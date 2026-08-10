import { state } from '../store/state.js';
import {
  DEFAULT_SHOP_ITEMS,
  getVisibleDefaultShopItems,
  getDeletedDefaultItemIds,
  deleteDefaultShopItem,
  restoreDefaultShopItems,
  purchaseShopItem,
  addCustomShopItem,
  deleteCustomShopItem,
  loadPartnerShopItems,
  redeemVictoryItem
} from '../modules/shop.js';
import { getWeekStartDate } from '../store/loader.js';

export function renderShopSection(container, onUpdateCallback) {
  let pendingPurchaseItem = null;

  const userCoins = state.gameState.coins || 0;
  const availableCoupons = (state.gameState.coupons || []).filter(c => !c.is_used);
  const partnerProfile = state.partnerProfile;
  const partnerName = partnerProfile?.display_name || 'คู่ของคุณ';
  const weekStart = getWeekStartDate();

  const visibleDefaultItems = getVisibleDefaultShopItems();
  const deletedDefaultIds = getDeletedDefaultItemIds();

  // Check if user already redeemed a Victory Shop item this week
  const isVictoryRedeemedThisWeek = (state.victoryRedemptions || []).some(
    r => r.week_start === weekStart
  );

  container.innerHTML = `
    <div class="shop-section" style="margin-top: 20px; text-align: left;">
      <!-- Shop Header Card -->
      <div style="background: linear-gradient(135deg, #FF9EAA, #FFB7C5); color: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(255,158,170,0.3); margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.85rem; opacity: 0.95;">ร้านค้าแลกรางวัล ICENA</div>
          <div style="font-size: 1.8rem; font-weight: bold; font-family: 'Mali', cursive; margin-top: 4px;">
            🪙 ${userCoins} เหรียญ
          </div>
          <div style="font-size: 0.8rem; opacity: 0.9; margin-top: 4px;">
            ออกกำลังกายแล้วมาแลกของอร่อยกันเถอะ!
          </div>
        </div>
        <div style="font-size: 3.2rem;">🛍️</div>
      </div>

      <!-- Standard Shop Items Grid -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <span><span>🥤</span> รายการอาหารและรางวัลมาตรฐาน (${visibleDefaultItems.length})</span>
          ${deletedDefaultIds.length > 0 ? `
            <button id="btn-restore-defaults" title="คืนค่ารายการที่ลบ" style="background: #FFF0F4; border: 1.5px solid #FF9EAA; color: #FF6B8B; padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
              🔄 คืนค่ารายการมาตรฐาน (${deletedDefaultIds.length})
            </button>
          ` : ''}
        </h3>

        ${visibleDefaultItems.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 25px 10px;">
            <div style="font-size: 2rem; margin-bottom: 6px;">🗑️</div>
            <p style="font-size: 0.9rem; margin-bottom: 10px;">คุณได้ลบรายการอาหารและรางวัลมาตรฐานทั้งหมดแล้ว</p>
            <button id="btn-restore-defaults" style="background: #FF9EAA; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
              🔄 คืนค่ารายการมาตรฐานทั้งหมด
            </button>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
            ${visibleDefaultItems.map(item => `
              <div style="background: #FFF5F7; border-radius: 16px; padding: 15px; text-align: center; border: 1px solid #FFE0E6; position: relative;">
                <button class="btn-delete-default" data-id="${item.id}" title="ลบรายการมาตรฐาน" style="position: absolute; right: 6px; top: 6px; background: none; border: none; font-size: 0.9rem; cursor: pointer; color: #FF6B6B;">
                  🗑️
                </button>
                <div style="font-size: 2.8rem; margin-bottom: 6px;">${item.emoji}</div>
                <div style="font-weight: bold; font-size: 0.9rem; color: #333; margin-bottom: 2px;">${item.name}</div>
                <div style="font-size: 0.75rem; color: #888; margin-bottom: 8px;">~${item.kcal} kcal</div>
                <div style="font-size: 1rem; font-weight: bold; color: #FF9EAA; margin-bottom: 10px;">${item.price} 🪙</div>
                <button class="btn-buy-item" data-id="${item.id}" data-type="default" style="width: 100%; background: #FF9EAA; color: white; border: none; padding: 8px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
                  สั่งซื้อ 🛒
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Custom Shop Items Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; justify-content: space-between;">
          <span>🎁</span> รายการสินค้าของคุณ (${state.customShopItems.length})
        </h3>

        <!-- Form Add Custom Item -->
        <form id="add-custom-item-form" style="background: #FFF9FA; border: 1.5px dashed #FF9EAA; border-radius: 16px; padding: 15px; margin-bottom: 18px;">
          <div style="font-weight: bold; color: #FF6B8B; font-size: 0.9rem; margin-bottom: 10px;">+ เพิ่มเมนูโปรดของคุณเอง</div>
          <div style="display: grid; grid-template-columns: 60px 1fr 100px; gap: 8px; margin-bottom: 10px;">
            <input type="text" id="custom_emoji" placeholder="🥤" value="🎁" style="padding: 8px; border: 1px solid #FFC0CB; border-radius: 10px; text-align: center; font-size: 1.2rem;">
            <input type="text" id="custom_name" placeholder="ชื่อเมนู เช่น ชาเขียวเย็น" required style="padding: 8px; border: 1px solid #FFC0CB; border-radius: 10px; font-size: 0.9rem;">
            <input type="number" id="custom_price" placeholder="ราคาเหรียญ" min="1" required style="padding: 8px; border: 1px solid #FFC0CB; border-radius: 10px; font-size: 0.9rem;">
          </div>
          <button type="submit" style="width: 100%; background: #FF9EAA; color: white; border: none; padding: 8px; border-radius: 10px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
            เพิ่มรายการ ➕
          </button>
        </form>

        ${state.customShopItems.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 15px 10px; font-size: 0.85rem;">
            ยังไม่มีสินค้าที่คุณเพิ่มเอง ลองสร้างเมนูโปรดด้านบนได้เลยค่ะ!
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
            ${state.customShopItems.map(item => `
              <div style="background: #FFF5F7; border-radius: 16px; padding: 15px; text-align: center; border: 1px solid #FFE0E6; position: relative;">
                <button class="btn-delete-custom" data-id="${item.id}" title="ลบรายการ" style="position: absolute; right: 6px; top: 6px; background: none; border: none; font-size: 0.9rem; cursor: pointer; color: #FF6B6B;">
                  🗑️
                </button>
                <div style="font-size: 2.5rem; margin-bottom: 6px;">${item.emoji}</div>
                <div style="font-weight: bold; font-size: 0.9rem; color: #333; margin-bottom: 4px;">${item.name}</div>
                <div style="font-size: 1rem; font-weight: bold; color: #FF9EAA; margin-bottom: 8px;">${item.price} 🪙</div>
                <button class="btn-buy-item" data-id="${item.id}" data-type="custom" style="width: 100%; background: #FF9EAA; color: white; border: none; padding: 8px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
                  สั่งซื้อ 🛒
                </button>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Victory Shop Section (Partner Items + Loser Coins) -->
      <div class="card" style="background: linear-gradient(135deg, #FFF9EB, #FFF3D6); border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0B2;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
          <h3 style="color: #F57C00; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px; margin: 0;">
            <span>👑</span> Victory Shop (ร้านค้าของ ${partnerName})
          </h3>
          <span style="font-size: 0.8rem; background: #FFE0B2; color: #E65100; padding: 4px 10px; border-radius: 12px; font-weight: bold;">
            ${isVictoryRedeemedThisWeek ? '✅ แลกสิทธิ์สัปดาห์นี้แล้ว (1/1)' : '🏆 ปลดล็อกสิทธิ์ผู้ชนะ'}
          </span>
        </div>

        <p style="font-size: 0.85rem; color: #795548; margin-bottom: 15px;">
          สิทธิพิเศษของผู้ชนะ: สั่งซื้อเมนูจากร้านของ <b>${partnerName}</b> โดยใช้ <b>เหรียญของ ${partnerName}</b> (จำกัด 1 ครั้ง/สัปดาห์)
        </p>

        <div id="partner-victory-shop-container" style="display: flex; flex-direction: column; gap: 10px;">
          <div style="text-align: center; color: #aaa; padding: 15px;">⏳ กำลังโหลดสินค้าจากร้านของ ${partnerName}...</div>
        </div>
      </div>

      <!-- Purchase Confirmation Modal Container -->
      <div id="purchase-modal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; align-items: center; justify-content: center; padding: 20px;">
        <div style="background: white; border-radius: 24px; width: 100%; max-width: 400px; padding: 25px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
          <div id="modal-item-emoji" style="font-size: 3.5rem; margin-bottom: 8px;">🥤</div>
          <h3 id="modal-item-name" style="color: #333; margin-bottom: 4px; font-family: 'Mali', cursive;">ชานมไข่มุก</h3>
          <p style="color: #888; font-size: 0.9rem; margin-bottom: 15px;">ราคาปกติ: <span id="modal-item-price" style="font-weight: bold; color: #FF6B8B;">90</span> เหรียญ</p>

          <!-- Coupon Selector -->
          <div style="margin-bottom: 20px; text-align: left;">
            <label for="coupon-select" style="display: block; font-size: 0.85rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              🎟️ เลือกใช้คูปองส่วนลด:
            </label>
            <select id="coupon-select" style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.9rem; background: white; box-sizing: border-box;">
              <option value="">ไม่ใช้คูปอง</option>
              ${availableCoupons.map(c => `
                <option value="${c.id}">${c.title} (${c.code})</option>
              `).join('')}
            </select>
          </div>

          <!-- Total Calculation Display -->
          <div style="background: #FFF5F7; padding: 12px; border-radius: 14px; margin-bottom: 20px; border: 1px solid #FFE0E6;">
            <div style="font-size: 0.85rem; color: #666;">ราคาสุทธิที่ต้องจ่าย:</div>
            <div id="modal-final-price" style="font-size: 1.4rem; font-weight: bold; color: #FF9EAA; margin-top: 2px;">90 เหรียญ</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <button id="btn-cancel-purchase" style="background: #EFEFEF; color: #666; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
              ยกเลิก ❌
            </button>
            <button id="btn-confirm-purchase" style="background: #FF9EAA; color: white; border: none; padding: 12px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
              ยืนยันสั่งซื้อ 🛍️
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Fetch and Render Partner Shop Items inside Victory Shop
  const victoryContainer = container.querySelector('#partner-victory-shop-container');
  if (victoryContainer) {
    if (!partnerProfile) {
      victoryContainer.innerHTML = `
        <div style="text-align: center; color: #aaa; padding: 15px;">ยังไม่มีข้อมูลคู่รักเพื่อดึงรายการสินค้า</div>
      `;
    } else {
      (async () => {
        const { customItems: partnerCustom, coins: partnerCoins } = await loadPartnerShopItems(partnerProfile.id);
        const visibleDefault = getVisibleDefaultShopItems();
        const allPartnerItems = [...visibleDefault, ...partnerCustom];

        victoryContainer.innerHTML = `
          <div style="background: white; border-radius: 12px; padding: 10px 14px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; border: 1px solid #FFE0B2;">
            <span style="font-size: 0.85rem; color: #5D4037;">เหรียญของ ${partnerName} ปัจจุบัน:</span>
            <span style="font-size: 1.1rem; font-weight: bold; color: #E65100;">🪙 ${partnerCoins} เหรียญ</span>
          </div>

          ${allPartnerItems.map(item => `
            <div style="display: flex; align-items: center; justify-content: space-between; background: white; padding: 12px 15px; border-radius: 14px; border: 1px solid #FFE0B2;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 1.8rem;">${item.emoji}</div>
                <div>
                  <div style="font-weight: bold; color: #4E342E; font-size: 0.9rem;">${item.name}</div>
                  <div style="font-size: 0.8rem; color: #E65100; font-weight: 500;">ราคา: ${item.price} เหรียญ (ใช้เหรียญของ ${partnerName})</div>
                </div>
              </div>
              <button class="btn-redeem-victory" data-id="${item.id}" data-name="${item.name}" data-emoji="${item.emoji}" data-price="${item.price}" ${isVictoryRedeemedThisWeek || partnerCoins < item.price ? 'disabled' : ''} style="background: ${isVictoryRedeemedThisWeek ? '#CCCCCC' : (partnerCoins >= item.price ? '#FFA726' : '#E0E0E0')}; color: white; border: none; padding: 8px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; cursor: ${!isVictoryRedeemedThisWeek && partnerCoins >= item.price ? 'pointer' : 'default'}; font-family: 'Kanit';">
                ${isVictoryRedeemedThisWeek ? 'แลกแล้ว' : (partnerCoins >= item.price ? 'สั่งซื้อด้วยเหรียญแฟน 👑' : 'เหรียญแฟนไม่พอ')}
              </button>
            </div>
          `).join('')}
        `;

        // Victory Item Redeem Handler
        victoryContainer.querySelectorAll('.btn-redeem-victory').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const itemId = e.currentTarget.getAttribute('data-id');
            const itemName = e.currentTarget.getAttribute('data-name');
            const itemEmoji = e.currentTarget.getAttribute('data-emoji');
            const itemPrice = parseInt(e.currentTarget.getAttribute('data-price'), 10);

            if (confirm(`คุณต้องการใช้เหรียญของ ${partnerName} จำนวน ${itemPrice} เหรียญ เพื่อสั่งซื้อ "${itemEmoji} ${itemName}" ใช่หรือไม่?`)) {
              const res = await redeemVictoryItem({
                item: { id: itemId, name: itemName, emoji: itemEmoji, price: itemPrice },
                loserId: partnerProfile.id
              });

              if (res.success && typeof onUpdateCallback === 'function') {
                onUpdateCallback();
              }
            }
          });
        });
      })();
    }
  }

  // Delete Default Item Handler
  container.querySelectorAll('.btn-delete-default').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('คุณต้องการลบรายการอาหารและรางวัลมาตรฐานนี้ใช่หรือไม่?')) {
        const res = deleteDefaultShopItem(id);
        if (res.success && typeof onUpdateCallback === 'function') {
          onUpdateCallback();
        }
      }
    });
  });

  // Restore Default Items Handler
  container.querySelectorAll('#btn-restore-defaults').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('คุณต้องการคืนค่ารายการอาหารและรางวัลมาตรฐานทั้งหมดที่ลบไปใช่หรือไม่?')) {
        const res = restoreDefaultShopItems();
        if (res.success && typeof onUpdateCallback === 'function') {
          onUpdateCallback();
        }
      }
    });
  });

  // Buy Item Click Handler -> Opens Modal for Standard/Custom Shop
  container.querySelectorAll('.btn-buy-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const type = e.currentTarget.getAttribute('data-type');

      let item = null;
      if (type === 'default') {
        item = DEFAULT_SHOP_ITEMS.find(i => i.id === id);
      } else {
        item = state.customShopItems.find(i => i.id === id);
      }

      if (item) {
        pendingPurchaseItem = item;
        const modal = container.querySelector('#purchase-modal');
        container.querySelector('#modal-item-emoji').innerText = item.emoji;
        container.querySelector('#modal-item-name').innerText = item.name;
        container.querySelector('#modal-item-price').innerText = item.price;
        container.querySelector('#modal-final-price').innerText = `${item.price} เหรียญ`;
        container.querySelector('#coupon-select').value = '';

        modal.style.display = 'flex';
      }
    });
  });

  // Dynamic Coupon Discount Price Calculation inside Modal
  const couponSelect = container.querySelector('#coupon-select');
  couponSelect?.addEventListener('change', () => {
    if (!pendingPurchaseItem) return;
    const selectedCouponId = couponSelect.value;
    let finalPrice = pendingPurchaseItem.price;

    if (selectedCouponId) {
      const coupon = availableCoupons.find(c => c.id === selectedCouponId);
      if (coupon) {
        finalPrice = Math.round(pendingPurchaseItem.price * (1 - coupon.discount / 100));
      }
    }

    container.querySelector('#modal-final-price').innerText = `${finalPrice} เหรียญ`;
  });

  // Confirm Purchase Handler
  container.querySelector('#btn-confirm-purchase')?.addEventListener('click', async () => {
    if (!pendingPurchaseItem) return;

    const confirmBtn = container.querySelector('#btn-confirm-purchase');
    confirmBtn.disabled = true;
    confirmBtn.innerText = 'กำลังทำรายการ...';

    const selectedCouponId = couponSelect?.value || null;
    const res = await purchaseShopItem(pendingPurchaseItem, selectedCouponId);

    confirmBtn.disabled = false;
    confirmBtn.innerText = 'ยืนยันสั่งซื้อ 🛍️';

    container.querySelector('#purchase-modal').style.display = 'none';
    pendingPurchaseItem = null;

    if (res.success && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Cancel Purchase Handler
  container.querySelector('#btn-cancel-purchase')?.addEventListener('click', () => {
    container.querySelector('#purchase-modal').style.display = 'none';
    pendingPurchaseItem = null;
  });

  // Add Custom Item Form Handler
  container.querySelector('#add-custom-item-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = container.querySelector('#custom_name')?.value;
    const emoji = container.querySelector('#custom_emoji')?.value || '🎁';
    const price = container.querySelector('#custom_price')?.value;

    const res = await addCustomShopItem({ name, emoji, price });
    if (res.success && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Delete Custom Item Handler
  container.querySelectorAll('.btn-delete-custom').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      if (confirm('คุณต้องการลบรายการสินค้านี้ใช่หรือไม่?')) {
        const res = await deleteCustomShopItem(id);
        if (res.success && typeof onUpdateCallback === 'function') {
          onUpdateCallback();
        }
      }
    });
  });
}
