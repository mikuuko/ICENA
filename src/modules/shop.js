import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { getWeekStartDate } from '../store/loader.js';
import { showToast } from '../ui/toast.js';

export const DEFAULT_SHOP_ITEMS = [
  { id: 'milktea',  emoji: '🥤', name: 'ชานมไข่มุก',     price: 90,  kcal: 450  },
  { id: 'fries',    emoji: '🍟', name: 'เฟรนช์ฟรายส์ชีส', price: 150, kcal: 750  },
  { id: 'sandwich', emoji: '🥪', name: 'แซนวิชแฮมชีส',   price: 80,  kcal: 400  },
  { id: 'pizza',    emoji: '🍕', name: 'พิซซ่าถาดกลาง',  price: 450, kcal: 2250 },
  { id: 'icecream', emoji: '🍦', name: 'ไอศกรีมซันเด',    price: 90,  kcal: 450  },
  { id: 'buffet',   emoji: '🍲', name: 'บุฟเฟ่ต์ชาบู',    price: 500, kcal: 2500 }
];

export const VICTORY_SHOP_ITEMS = [
  { id: 'victory_massage', emoji: '💆‍♀️', name: 'สิทธิพิเศษ: นวดผ่อนคลาย 1 ชั่วโมง', price: 0 },
  { id: 'victory_movie',   emoji: '🎬', name: 'สิทธิพิเศษ: เลือกหนังดูแบบ VIP 1 เรื่อง', price: 0 },
  { id: 'victory_dinner',  emoji: '🕯️', name: 'สิทธิพิเศษ: ดินเนอร์มื้อพิเศษฟรี', price: 0 }
];

// Load Custom Shop Items
export async function loadCustomShopItems() {
  if (!state.user) return [];

  try {
    const { data, error } = await supabase
      .from('custom_shop_items')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading custom shop items:', error);
      return [];
    }

    state.customShopItems = data || [];
    return state.customShopItems;
  } catch (err) {
    console.error('Unexpected error loading custom shop items:', err);
    return [];
  }
}

// Add Custom Shop Item
export async function addCustomShopItem({ name, emoji = '🎁', price, kcal = 0 }) {
  if (!state.user) return { success: false };

  const parsedPrice = parseInt(price, 10);
  if (!name || isNaN(parsedPrice) || parsedPrice <= 0) {
    showToast('กรุณากรอกชื่อสินค้าและราคาให้ถูกต้องค่ะ', 'warning');
    return { success: false, error: 'Invalid fields' };
  }

  try {
    const { data: newItem, error } = await supabase
      .from('custom_shop_items')
      .insert({
        user_id: state.user.id,
        name,
        emoji: emoji || '🎁',
        price: parsedPrice,
        kcal: parseInt(kcal, 10) || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to add custom shop item:', error);
      showToast('ไม่สามารถสร้างรายการสินค้าได้', 'error');
      return { success: false, error };
    }

    showToast(`สร้างรายการ "${name}" สำเร็จแล้วค่ะ 🎉`, 'success');
    await loadCustomShopItems();
    return { success: true, data: newItem };
  } catch (err) {
    console.error('Unexpected error adding custom shop item:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างรายการสินค้า', 'error');
    return { success: false, error: err };
  }
}

// Delete Custom Shop Item
export async function deleteCustomShopItem(itemId) {
  if (!state.user || !itemId) return { success: false };

  try {
    const { error } = await supabase
      .from('custom_shop_items')
      .update({ is_active: false })
      .eq('id', itemId)
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to delete custom shop item:', error);
      showToast('ไม่สามารถลบรายการสินค้าได้', 'error');
      return { success: false, error };
    }

    showToast('ลบรายการสินค้าเรียบร้อยแล้วค่ะ 🗑️', 'info');
    await loadCustomShopItems();
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting custom shop item:', err);
    showToast('เกิดข้อผิดพลาดในการลบรายการสินค้า', 'error');
    return { success: false, error: err };
  }
}

// Purchase Shop Item (with optional coupon discount)
export async function purchaseShopItem(item, couponId = null) {
  if (!state.user || !item) {
    showToast('กรุณาเข้าสู่ระบบก่อนทำรายการค่ะ', 'warning');
    return { success: false };
  }

  const userCoins = state.gameState.coins || 0;
  let finalPrice = item.price;
  let appliedCoupon = null;

  // Check coupon discount
  if (couponId) {
    const coupons = state.gameState.coupons || [];
    appliedCoupon = coupons.find(c => c.id === couponId && !c.is_used);
    if (appliedCoupon) {
      finalPrice = Math.round(item.price * (1 - appliedCoupon.discount / 100));
    }
  }

  if (userCoins < finalPrice) {
    showToast(`เหรียญไม่พอค่ะ (ต้องการ ${finalPrice} เหรียญ มีอยู่ ${userCoins} เหรียญ) 😿`, 'warning');
    return { success: false, error: 'Insufficient coins' };
  }

  try {
    const newCoins = userCoins - finalPrice;
    let updatedCoupons = state.gameState.coupons || [];

    if (appliedCoupon) {
      updatedCoupons = updatedCoupons.map(c =>
        c.id === couponId ? { ...c, is_used: true } : c
      );
    }

    // 1. Insert Transaction (Append-only negative amount)
    const { error: txErr } = await supabase.from('coin_transactions').insert({
      user_id: state.user.id,
      amount: -finalPrice,
      source: 'shop_purchase',
      reference_id: item.id,
      description: `ซื้อ ${item.name}${appliedCoupon ? ` (ใช้คูปองลด ${appliedCoupon.discount}%)` : ''}`
    });

    if (txErr) {
      console.error('Failed to log coin transaction for purchase:', txErr);
      showToast('ไม่สามารถตัดเหรียญเพื่อซื้อสินค้าได้', 'error');
      return { success: false, error: txErr };
    }

    // 2. Update User Game State Balance and Coupons
    const { error: stateErr } = await supabase
      .from('user_game_state')
      .update({
        coins: newCoins,
        coupons: updatedCoupons,
        updated_at: new Date()
      })
      .eq('user_id', state.user.id);

    if (stateErr) {
      console.error('Failed to update coins balance:', stateErr);
      showToast('ไม่สามารถอัปเดตยอดเหรียญได้', 'error');
      return { success: false, error: stateErr };
    }

    state.gameState.coins = newCoins;
    state.gameState.coupons = updatedCoupons;

    showToast(`ซื้อ ${item.emoji} ${item.name} สำเร็จแล้ว! 🎉 (-${finalPrice} เหรียญ)`, 'success');
    return { success: true, finalPrice };
  } catch (err) {
    console.error('Unexpected error purchasing item:', err);
    showToast('เกิดข้อผิดพลาดในการซื้อสินค้า', 'error');
    return { success: false, error: err };
  }
}

// Load Victory Redemptions
export async function loadVictoryRedemptions() {
  if (!state.user) return [];

  try {
    const { data, error } = await supabase
      .from('victory_redemptions')
      .select('*')
      .eq('user_id', state.user.id)
      .order('redeemed_at', { ascending: false });

    if (error) {
      console.error('Error fetching victory redemptions:', error);
      return [];
    }

    state.victoryRedemptions = data || [];
    return state.victoryRedemptions;
  } catch (err) {
    console.error('Unexpected error loading victory redemptions:', err);
    return [];
  }
}

// Redeem Victory Shop Item (Must be properly awaited! Bug #5 fix)
export async function redeemVictoryItem(item) {
  if (!state.user) return { success: false };

  try {
    const weekStart = getWeekStartDate();

    const { data, error } = await supabase
      .from('victory_redemptions')
      .insert({
        user_id: state.user.id,
        item_id: item.id,
        item_name: item.name,
        item_emoji: item.emoji || '🏆',
        price_paid: 0,
        week_start: weekStart,
        is_fulfilled: false
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to redeem victory item:', error);
      showToast('ไม่สามารถแลกรางวัล Victory Shop ได้', 'error');
      return { success: false, error };
    }

    showToast(`แลกรางวัลฉลองชัยชนะ ${item.emoji} ${item.name} เรียบร้อยแล้วค่ะ! 👑`, 'success');
    await loadVictoryRedemptions();
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error redeeming victory item:', err);
    showToast('เกิดข้อผิดพลาดในการแลกรางวัล Victory Shop', 'error');
    return { success: false, error: err };
  }
}
