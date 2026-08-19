import { supabase } from '../supabase.js';
import { state } from './state.js';

// Helper to get Monday of the current week (YYYY-MM-DD)
export function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const dNum = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${dNum}`;
}

// Load all application data for logged in user into state
export async function loadAppData(userId) {
  if (!userId) return;

  try {
    const weekStart = getWeekStartDate();

    // Run parallel queries for maximum performance
    const [
      gameStateRes,
      workoutsRes,
      dietRes,
      sleepRes,
      myWeeklyRes,
      partnerWeeklyRes,
      shopRes,
      redemptionsRes
    ] = await Promise.all([
      // 1. Game State
      supabase.from('user_game_state').select('*').eq('user_id', userId).maybeSingle(),
      
      // 2. Workouts
      supabase.from('workouts').select('*').eq('user_id', userId).order('logged_at', { ascending: false }),
      
      // 3. Diet Logs
      supabase.from('diet_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }),
      
      // 4. Sleep Logs
      supabase.from('sleep_logs').select('*').eq('user_id', userId).order('logged_at', { ascending: false }),
      
      // 5. My Weekly Stats
      supabase.from('user_weekly_stats').select('*').eq('user_id', userId).eq('week_start', weekStart).maybeSingle(),
      
      // 6. Partner Weekly Stats (if partnerProfile exists)
      state.partnerProfile?.id
        ? supabase.from('user_weekly_stats').select('*').eq('user_id', state.partnerProfile.id).eq('week_start', weekStart).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
        
      // 7. Custom Shop Items
      supabase.from('custom_shop_items').select('*').eq('is_active', true).order('created_at', { ascending: true }),
      
      // 8. Victory Redemptions
      supabase.from('victory_redemptions').select('*').order('redeemed_at', { ascending: false })
    ]);

    // Process Game State
    let gState = gameStateRes.data;
    if (!gState) {
      // Auto-create initial game state if missing
      const { data: newGState } = await supabase
        .from('user_game_state')
        .upsert({ user_id: userId, streak: 0, coins: 0 })
        .select()
        .single();
      gState = newGState;
    }

    if (gState) {
      state.gameState = {
        streak: gState.streak || 0,
        coins: gState.coins || 0,
        quests: gState.active_quests || [],
        coupons: gState.coupons || [],
        achievements: gState.achievements || [],
        milestone_claims: gState.milestone_claims || []
      };
    }

    // Process Workouts
    state.workouts = workoutsRes.data || [];

    // --- TEMPORARY FIX FOR LATE NIGHT WORKOUTS ---
    let fixedAny = false;
    for (const w of state.workouts) {
      const d = new Date(w.logged_at);
      // Fix 12/8/2026 00:33 -> 11/8/2026 23:33
      if (d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 12 && d.getHours() === 0 && d.getMinutes() === 33) {
        const newD = new Date(d);
        newD.setDate(11);
        newD.setHours(23);
        await supabase.from('workouts').update({ logged_at: newD.toISOString() }).eq('id', w.id);
        fixedAny = true;
      }
      // Fix 15/8/2026 00:05 -> 14/8/2026 23:05
      if (d.getFullYear() === 2026 && d.getMonth() === 7 && d.getDate() === 15 && d.getHours() === 0 && d.getMinutes() === 5) {
        const newD = new Date(d);
        newD.setDate(14);
        newD.setHours(23);
        await supabase.from('workouts').update({ logged_at: newD.toISOString() }).eq('id', w.id);
        fixedAny = true;
      }
    }
    
    if (fixedAny) {
      // Reload workouts and recalculate streak after fix
      const updatedWorkouts = await supabase.from('workouts').select('*').eq('user_id', userId).order('logged_at', { ascending: false });
      state.workouts = updatedWorkouts.data || [];
      const { recalcStreak } = await import('../modules/streak.js');
      await recalcStreak();
    }
    // ---------------------------------------------

    // Process Diet Logs
    state.dietLogs = dietRes.data || [];

    // Process Sleep Logs
    state.sleepLogs = sleepRes.data || [];

    // Process Weekly Stats
    state.weeklyStats = myWeeklyRes.data || null;
    state.partnerWeeklyStats = partnerWeeklyRes.data || null;

    // Process Shop Items (Regular & Victory)
    const allShopItems = shopRes.data || [];
    state.customShopItems = allShopItems.filter(item => !item.is_victory && item.user_id === userId);
    state.victoryShopItems = allShopItems.filter(item => item.is_victory === true);

    // Process Victory Redemptions
    state.victoryRedemptions = redemptionsRes.data || [];

    state.isLoaded = true;
    console.log('✅ State Hydration Complete:', state);
  } catch (err) {
    console.error('❌ Error during loadAppData:', err);
  }
}

// Reset state to default initial state upon logout
export function resetState() {
  state.user = null;
  state.profile = null;
  state.partnerProfile = null;
  state.gameState = {
    streak: 0,
    coins: 0,
    quests: [],
    coupons: [],
    achievements: [],
    milestone_claims: []
  };
  state.workouts = [];
  state.dietLogs = [];
  state.sleepLogs = [];
  state.weeklyStats = null;
  state.partnerWeeklyStats = null;
  state.customShopItems = [];
  state.victoryShopItems = [];
  state.victoryRedemptions = [];
  state.isLoaded = false;
  console.log('🧹 State reset complete');
}

// Clear all user test data in Supabase & LocalStorage
export async function clearAllTestData() {
  if (!state.user) return { success: false, error: 'Not authenticated' };

  try {
    const userId = state.user.id;

    // Delete workouts, diet, sleep, custom shop, victory redemptions, weekly stats, doctor reports
    await Promise.all([
      supabase.from('workouts').delete().eq('user_id', userId),
      supabase.from('diet_logs').delete().eq('user_id', userId),
      supabase.from('sleep_logs').delete().eq('user_id', userId),
      supabase.from('custom_shop_items').delete().eq('user_id', userId),
      supabase.from('victory_redemptions').delete().eq('user_id', userId),
      supabase.from('user_weekly_stats').delete().eq('user_id', userId),
      supabase.from('doctor_reports').delete().eq('user_id', userId),
      supabase.from('coin_transactions').delete().eq('user_id', userId)
    ]);

    // Reset user game state
    await supabase
      .from('user_game_state')
      .update({
        streak: 0,
        coins: 0,
        last_workout_date: null,
        milestone_claims: [],
        active_quests: [],
        coupons: [],
        achievements: []
      })
      .eq('user_id', userId);

    // Clear local storage overrides
    localStorage.removeItem('icena_deleted_default_items');

    // Reload app data
    await loadAppData(userId);

    console.log('🧹 Test data reset complete');
    return { success: true };
  } catch (err) {
    console.error('Error clearing test data:', err);
    return { success: false, error: err };
  }
}
