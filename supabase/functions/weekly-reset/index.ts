import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate previous week start (Monday)
    const now = new Date();
    const prevWeekDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayOfWeek = prevWeekDate.getUTCDay();
    const diffToMon = prevWeekDate.getUTCDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const prevWeekMon = new Date(prevWeekDate.setUTCDate(diffToMon));
    const weekStartStr = prevWeekMon.toISOString().split('T')[0];

    // Fetch all users
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id, display_name');
    if (profileErr || !profiles || profiles.length < 2) {
      return new Response(JSON.stringify({ error: 'Fewer than 2 profiles found', details: profileErr }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const user1 = profiles[0];
    const user2 = profiles[1];

    // Fetch workouts, sleep, and diet for user1 & user2
    const fetchUserScore = async (userId: string) => {
      const [wRes, sRes, dRes] = await Promise.all([
        supabase.from('workouts').select('duration_minutes').eq('user_id', userId).gte('logged_at', weekStartStr),
        supabase.from('sleep_logs').select('duration_hours').eq('user_id', userId).gte('logged_at', weekStartStr),
        supabase.from('diet_logs').select('score').eq('user_id', userId).gte('logged_at', weekStartStr)
      ]);

      const workoutMins = (wRes.data || []).reduce((acc: number, w: any) => acc + (w.duration_minutes || 0), 0);
      const sleepHours = (sRes.data || []).reduce((acc: number, s: any) => acc + (s.duration_hours || 0), 0);
      const sleepScore = Math.round(sleepHours * 10);

      let dietScore = 0;
      (dRes.data || []).forEach((d: any) => {
        if (d.score === 'A') dietScore += 20;
        else if (d.score === 'B') dietScore += 10;
        else if (d.score === 'D') dietScore -= 10;
      });

      return workoutMins + sleepScore + dietScore;
    };

    const user1Score = await fetchUserScore(user1.id);
    const user2Score = await fetchUserScore(user2.id);

    let winnerId = null;
    if (user1Score > user2Score) winnerId = user1.id;
    else if (user2Score > user1Score) winnerId = user2.id;

    // Insert competition result into weekly_competitions
    const { data: compData, error: compErr } = await supabase.from('weekly_competitions').insert({
      week_start: weekStartStr,
      user1_id: user1.id,
      user2_id: user2.id,
      user1_score: user1Score,
      user2_score: user2Score,
      winner_id: winnerId,
      is_finalized: true
    }).select().single();

    if (compErr) {
      console.error('Failed to insert weekly_competitions:', compErr);
    }

    // Increment winner's total_weekly_wins in weekly_stats
    if (winnerId) {
      const { data: currentStats } = await supabase
        .from('weekly_stats')
        .select('total_weekly_wins')
        .eq('user_id', winnerId)
        .maybeSingle();

      const newWins = (currentStats?.total_weekly_wins || 0) + 1;

      await supabase.from('weekly_stats').upsert({
        user_id: winnerId,
        total_weekly_wins: newWins,
        updated_at: new Date().toISOString()
      });
    }

    return new Response(JSON.stringify({
      success: true,
      week_start: weekStartStr,
      user1: { name: user1.display_name, score: user1Score },
      user2: { name: user2.display_name, score: user2Score },
      winner_id: winnerId,
      competition: compData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
