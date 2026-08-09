import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';

export const MILESTONES = [
  { days: 3, reward: 50, label: '3 วัน' },
  { days: 7, reward: 150, label: '7 วัน (1 สัปดาห์)' },
  { days: 14, reward: 300, label: '14 วัน (2 สัปดาห์)' },
  { days: 30, reward: 600, label: '30 วัน (1 เดือน)' },
  { days: 60, reward: 1200, label: '60 วัน (2 เดือน)' }
];

export const QUEST_DEFINITIONS = [
  { id: 'cardio_5', title: 'คาร์ดิโอ 5 ครั้งในสัปดาห์นี้', emoji: '🏃‍♂️', goal: 5, reward: 150 },
  { id: 'duration_45_3', title: 'ออกกำลังกาย 45+ นาที ครบ 3 ครั้ง', emoji: '⏱️', goal: 3, reward: 200 },
  { id: 'weight_2', title: 'เวทเทรนนิ่ง 2 ครั้งในสัปดาห์นี้', emoji: '🏋️‍♂️', goal: 2, reward: 100 }
];

// Helper to get Monday of the current week (YYYY-MM-DD)
function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Recalculate Streak from workouts list
export async function recalcStreak() {
  if (!state.user || !state.workouts) return 0;

  try {
    // 1. Extract unique workout dates (YYYY-MM-DD) sorted descending
    const dateSet = new Set();
    state.workouts.forEach(w => {
      if (w.logged_at) {
        const dStr = new Date(w.logged_at).toISOString().split('T')[0];
        dateSet.add(dStr);
      }
    });

    const dates = Array.from(dateSet).sort().reverse(); // e.g. ['2026-08-09', '2026-08-08']

    if (dates.length === 0) {
      state.gameState.streak = 0;
      return 0;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    // Check if streak is active (workout done today or yesterday)
    let currentCheck = new Date();
    if (!dateSet.has(todayStr) && !dateSet.has(yesterdayStr)) {
      // Streak broken
      state.gameState.streak = 0;
    } else {
      let streak = 0;
      // Start counting back from the most recent workout date
      let checkDate = dateSet.has(todayStr) ? new Date() : yesterdayDate;

      while (true) {
        const checkStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      state.gameState.streak = streak;
    }

    // Sync streak to database
    await supabase
      .from('user_game_state')
      .upsert({
        user_id: state.user.id,
        streak: state.gameState.streak,
        last_workout_date: dates[0],
        updated_at: new Date()
      });

    return state.gameState.streak;
  } catch (err) {
    console.error('Error recalculating streak:', err);
    return state.gameState.streak || 0;
  }
}

// Claim Milestone Bonus
export async function claimMilestone(days) {
  if (!state.user) return { success: false };

  const milestone = MILESTONES.find(m => m.days === days);
  if (!milestone) return { success: false, error: 'Invalid milestone' };

  if (state.gameState.streak < days) {
    showToast(`Streak ต้องสะสมครบ ${days} วันก่อนนะคะ 😿`, 'warning');
    return { success: false, error: 'Streak not enough' };
  }

  const claims = state.gameState.milestone_claims || [];
  if (claims.includes(days)) {
    showToast(`คุณเคลมโบนัส ${days} วันไปแล้วค่ะ!`, 'info');
    return { success: false, error: 'Already claimed' };
  }

  try {
    const newClaims = [...claims, days];
    const newCoins = (state.gameState.coins || 0) + milestone.reward;

    // 1. Insert Transaction
    await supabase.from('coin_transactions').insert({
      user_id: state.user.id,
      amount: milestone.reward,
      source: 'milestone',
      reference_id: `milestone_${days}`,
      description: `โบนัส Milestone Streak ${days} วัน`
    });

    // 2. Update Game State
    const { error } = await supabase
      .from('user_game_state')
      .update({
        coins: newCoins,
        milestone_claims: newClaims,
        updated_at: new Date()
      })
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to claim milestone:', error);
      showToast('ไม่สามารถเคลมโบนัสได้', 'error');
      return { success: false, error };
    }

    state.gameState.coins = newCoins;
    state.gameState.milestone_claims = newClaims;

    showToast(`เคลมโบนัส Milestone ${days} วันสำเร็จ! 🎉 +${milestone.reward} เหรียญ 🪙`, 'success');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error claiming milestone:', err);
    showToast('เกิดข้อผิดพลาดในการเคลมโบนัส', 'error');
    return { success: false, error: err };
  }
}

// Get Weekly Quests progress
export function getWeeklyQuestsProgress() {
  const weekStart = getWeekStartDate();
  const weekStartMs = new Date(weekStart).getTime();
  const claimedQuests = state.gameState.quests || [];

  // Filter workouts in current week
  const thisWeekWorkouts = (state.workouts || []).filter(w => {
    const wTime = new Date(w.logged_at).getTime();
    return wTime >= weekStartMs;
  });

  const cardioCount = thisWeekWorkouts.filter(w => w.type === 'cardio').length;
  const duration45Count = thisWeekWorkouts.filter(w => (w.duration_minutes || 0) >= 45).length;
  const weightCount = thisWeekWorkouts.filter(w => w.type === 'weight').length;

  const countsMap = {
    cardio_5: cardioCount,
    duration_45_3: duration45Count,
    weight_2: weightCount
  };

  return QUEST_DEFINITIONS.map(q => {
    const current = countsMap[q.id] || 0;
    const isCompleted = current >= q.goal;
    const isClaimed = claimedQuests.includes(q.id);

    return {
      ...q,
      current: Math.min(current, q.goal),
      isCompleted,
      isClaimed
    };
  });
}

// Claim Weekly Quest Reward
export async function claimQuestReward(questId) {
  if (!state.user) return { success: false };

  const questsProgress = getWeeklyQuestsProgress();
  const quest = questsProgress.find(q => q.id === questId);

  if (!quest) return { success: false, error: 'Quest not found' };
  if (!quest.isCompleted) {
    showToast('ยังทำภารกิจนี้ไม่สำเร็จค่ะ', 'warning');
    return { success: false, error: 'Quest incomplete' };
  }
  if (quest.isClaimed) {
    showToast('คุณรับรางวัลภารกิจนี้ไปแล้วค่ะ', 'info');
    return { success: false, error: 'Already claimed' };
  }

  try {
    const claimedList = state.gameState.quests || [];
    const newClaimedList = [...claimedList, questId];
    const newCoins = (state.gameState.coins || 0) + quest.reward;

    // 1. Insert Coin Transaction
    await supabase.from('coin_transactions').insert({
      user_id: state.user.id,
      amount: quest.reward,
      source: 'quest',
      reference_id: questId,
      description: `รางวัลภารกิจประจำสัปดาห์: ${quest.title}`
    });

    // 2. Update Game State
    const { error } = await supabase
      .from('user_game_state')
      .update({
        coins: newCoins,
        active_quests: newClaimedList,
        updated_at: new Date()
      })
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to claim quest reward:', error);
      showToast('ไม่สามารถรับรางวัลภารกิจได้', 'error');
      return { success: false, error };
    }

    state.gameState.coins = newCoins;
    state.gameState.quests = newClaimedList;

    showToast(`รับรางวัลภารกิจสำเร็จ! 🎉 +${quest.reward} เหรียญ 🪙`, 'success');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error claiming quest:', err);
    showToast('เกิดข้อผิดพลาดในการรับรางวัลภารกิจ', 'error');
    return { success: false, error: err };
  }
}
