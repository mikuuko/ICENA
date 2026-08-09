import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';

// Check workout duration and issue coupon if eligible (Max 3 coupons / month)
export async function checkAndIssueCoupon(durationMinutes) {
  if (!state.user) return null;

  const duration = parseInt(durationMinutes, 10);
  if (isNaN(duration) || duration < 15) {
    return null; // Less than 15 minutes does not earn coupon
  }

  const existingCoupons = state.gameState.coupons || [];
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Count coupons earned this month
  const thisMonthCouponsCount = existingCoupons.filter(c => {
    if (!c.created_at) return false;
    const cDate = new Date(c.created_at);
    const cYearMonth = `${cDate.getFullYear()}-${String(cDate.getMonth() + 1).padStart(2, '0')}`;
    return cYearMonth === currentYearMonth;
  }).length;

  if (thisMonthCouponsCount >= 3) {
    console.log('Coupon limit reached for this month (Max 3)');
    return null;
  }

  // Determine coupon tier
  let discount = 10;
  let title = 'คูปองส่วนลด 10%';
  if (duration >= 60) {
    discount = 30;
    title = 'คูปองส่วนลด 30%';
  } else if (duration >= 45) {
    discount = 20;
    title = 'คูปองส่วนลด 20%';
  }

  const newCoupon = {
    id: `coupon_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: `ICENA_${discount}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    discount,
    title,
    created_at: now.toISOString(),
    is_used: false
  };

  const updatedCoupons = [...existingCoupons, newCoupon];

  try {
    const { error } = await supabase
      .from('user_game_state')
      .update({
        coupons: updatedCoupons,
        updated_at: new Date()
      })
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to issue coupon:', error);
      return null;
    }

    state.gameState.coupons = updatedCoupons;
    showToast(`ยินดีด้วย! ได้รับ ${title} 🎟️`, 'success');
    return newCoupon;
  } catch (err) {
    console.error('Unexpected error issuing coupon:', err);
    return null;
  }
}

// Get user coupons
export function getUserCoupons() {
  return state.gameState.coupons || [];
}
