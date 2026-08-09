import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { getWeekStartDate } from '../store/loader.js';

// Calculate Weekly Score Breakdown for a specific user ID
export async function calculateUserWeeklyScore(userId) {
  if (!userId) return { workoutMins: 0, sleepHours: 0, dietPoints: 0, totalScore: 0 };

  const weekStart = getWeekStartDate();
  const weekStartMs = new Date(weekStart).getTime();

  try {
    const [workoutsRes, sleepRes, dietRes] = await Promise.all([
      supabase.from('workouts').select('duration_minutes').eq('user_id', userId).gte('logged_at', weekStart),
      supabase.from('sleep_logs').select('duration_hours').eq('user_id', userId).gte('logged_at', weekStart),
      supabase.from('diet_logs').select('score').eq('user_id', userId).gte('logged_at', weekStart)
    ]);

    const workouts = workoutsRes.data || [];
    const sleepLogs = sleepRes.data || [];
    const dietLogs = dietRes.data || [];

    const workoutMins = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const sleepHours = sleepLogs.reduce((sum, s) => sum + (s.duration_hours || 0), 0);
    const sleepScore = Math.round(sleepHours * 10);

    let dietPoints = 0;
    dietLogs.forEach(d => {
      if (d.score === 'A') dietPoints += 20;
      else if (d.score === 'B') dietPoints += 10;
      else if (d.score === 'D') dietPoints -= 10;
    });

    const totalScore = workoutMins + sleepScore + dietPoints;

    return {
      workoutMins,
      sleepHours: sleepHours.toFixed(1),
      sleepScore,
      dietPoints,
      totalScore
    };
  } catch (err) {
    console.error('Error calculating weekly score:', err);
    return { workoutMins: 0, sleepHours: '0', sleepScore: 0, dietPoints: 0, totalScore: 0 };
  }
}

// Get Live Battle Data comparing user and partner
export async function getWeeklyBattleData() {
  if (!state.user) return null;

  const myId = state.user.id;
  const partnerId = state.partnerProfile?.id;

  const [myBreakdown, partnerBreakdown] = await Promise.all([
    calculateUserWeeklyScore(myId),
    partnerId ? calculateUserWeeklyScore(partnerId) : Promise.resolve({ workoutMins: 0, sleepHours: '0', sleepScore: 0, dietPoints: 0, totalScore: 0 })
  ]);

  const diff = Math.abs(myBreakdown.totalScore - partnerBreakdown.totalScore);
  const isLeading = myBreakdown.totalScore > partnerBreakdown.totalScore;
  const isTied = myBreakdown.totalScore === partnerBreakdown.totalScore;

  return {
    myBreakdown,
    partnerBreakdown,
    diff,
    isLeading,
    isTied
  };
}

// Get Past Weekly Competition Champions History
export async function getWeeklyHistory() {
  try {
    const { data, error } = await supabase
      .from('weekly_competitions')
      .select('*')
      .order('week_start', { ascending: false });

    if (error) {
      console.error('Error fetching weekly competitions history:', error);
      return [];
    }

    state.weeklyHistory = data || [];
    return state.weeklyHistory;
  } catch (err) {
    console.error('Unexpected error loading weekly history:', err);
    return [];
  }
}
