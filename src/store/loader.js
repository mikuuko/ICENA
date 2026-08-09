import { supabase } from '../supabase.js';
import { state } from './state.js';

// Helper to get Monday of the current week (YYYY-MM-DD)
export function getWeekStartDate(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
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

    // Process Diet Logs
    state.dietLogs = dietRes.data || [];

    // Process Sleep Logs
    state.sleepLogs = sleepRes.data || [];

    // Process Weekly Stats
    state.weeklyStats = myWeeklyRes.data || null;
    state.partnerWeeklyStats = partnerWeeklyRes.data || null;

    // Process Shop Items
    state.customShopItems = shopRes.data || [];

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
  state.victoryRedemptions = [];
  state.isLoaded = false;
  console.log('🧹 State reset complete');
}
