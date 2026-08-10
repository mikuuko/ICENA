import { state } from '../store/state.js';
import { signInWithUsername, signUpWithUsername, signOutUser } from '../modules/auth.js';
import { clearAllTestData } from '../store/loader.js';
import { showToast } from './toast.js';
import { renderWorkoutSection } from './workoutUI.js';
import { renderDietSection } from './dietUI.js';
import { renderSleepSection } from './sleepUI.js';
import { renderQuestsSection } from './questsUI.js';
import { renderShopSection } from './shopUI.js';
import { renderAnalyticsSection } from './analyticsUI.js';
import { renderWeeklySection } from './weeklyUI.js';

let activeAuthTab = 'signin'; // 'signin' or 'signup'
let activeAppTab = 'workout'; // 'workout', 'diet', 'sleep', 'quests', 'shop', 'analytics', or 'weekly'

// Render Auth Screen (Login / Register)
export function renderAuthScreen(container) {
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="cat-mascot">🐱</div>
          <h1 class="auth-title">ICENA</h1>
          <p class="auth-subtitle">แอปคู่รักสุขภาพดี ออย & ไอซ์ 💕</p>
        </div>

        <div class="auth-tabs">
          <button id="tab-signin" class="auth-tab ${activeAuthTab === 'signin' ? 'active' : ''}">เข้าสู่ระบบ</button>
          <button id="tab-signup" class="auth-tab ${activeAuthTab === 'signup' ? 'active' : ''}">สร้างไอดีใหม่</button>
        </div>

        <form id="auth-form">
          ${activeAuthTab === 'signup' ? `
            <div class="form-group">
              <label class="form-label" for="display_name">ชื่อที่ให้เรียก (เช่น ออย หรือ ไอซ์)</label>
              <input type="text" id="display_name" class="form-input" placeholder="ใส่ชื่อน่ารักๆ ของคุณ" required />
            </div>
          ` : ''}

          <div class="form-group">
            <label class="form-label" for="username">ไอดี (Username)</label>
            <input type="text" id="username" class="form-input" placeholder="เช่น Oil หรือ Ice" required />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">รหัสผ่าน</label>
            <input type="password" id="password" class="form-input" placeholder="ตั้งรหัสผ่านของคุณ" required />
          </div>

          <button type="submit" class="btn-primary" id="btn-submit">
            ${activeAuthTab === 'signin' ? 'เข้าสู่ระบบ 🐾' : 'ลงทะเบียนเป็นสมาชิก 🐱'}
          </button>
        </form>
      </div>
    </div>
  `;

  // Tab Listeners
  document.getElementById('tab-signin')?.addEventListener('click', () => {
    activeAuthTab = 'signin';
    renderAuthScreen(container);
  });

  document.getElementById('tab-signup')?.addEventListener('click', () => {
    activeAuthTab = 'signup';
    renderAuthScreen(container);
  });

  // Form Submit Listener
  document.getElementById('auth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerText = 'กำลังดำเนินการ...';

    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;

    if (activeAuthTab === 'signin') {
      await signInWithUsername(username, password);
    } else {
      const displayName = document.getElementById('display_name')?.value;
      await signUpWithUsername(username, password, displayName);
    }

    submitBtn.disabled = false;
  });
}

// Render App Main View (When logged in)
export function renderAppView(container) {
  const profileName = state.profile?.display_name || state.user?.email?.split('@')[0] || 'Member';
  const partnerName = state.partnerProfile?.display_name || 'คู่ของคุณ';

  container.innerHTML = `
    <div id="app-container">
      <!-- iOS Sticky Header -->
      <header style="background: linear-gradient(135deg, #FF9EAA, #FFB7C5); color: white; padding: 25px 20px 20px 20px; text-align: center; border-radius: 0 0 24px 24px; position: relative; box-shadow: 0 4px 15px rgba(255,158,170,0.3);">
        <h2 style="font-family: 'Mali', cursive; margin: 0; font-size: 1.6rem;">🐱 ICENA</h2>
        <p style="font-size: 0.95rem; margin-top: 4px; opacity: 0.95;">สวัสดีคุณ ${profileName} 💕 (คู่กับ ${partnerName})</p>
        <div style="position: absolute; right: 12px; top: 18px; display: flex; gap: 6px; align-items: center;">
          <button id="btn-reset-test-data" title="ล้างข้อมูลทดสอบทั้งหมด" style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 5px 9px; border-radius: 10px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.78rem; font-weight: 500;">
            🧹 ล้างข้อมูลเทส
          </button>
          <button id="btn-logout" style="background: rgba(255,255,255,0.25); border: none; color: white; padding: 5px 9px; border-radius: 10px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.78rem; font-weight: 500;">
            ออกจากระบบ
          </button>
        </div>

        <!-- Global Header Stats Bar -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-radius: 16px; padding: 10px;">
          <div>
            <div style="font-size: 0.75rem; opacity: 0.9;">เหรียญสะสม</div>
            <div style="font-size: 1.1rem; font-weight: bold; margin-top: 2px; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <img src="/icons/Coins.png" style="width: 20px; height: 20px; object-fit: contain;" /> ${state.gameState.coins}
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; opacity: 0.9;">ออกกำลังกาย</div>
            <div style="font-size: 1.1rem; font-weight: bold; margin-top: 2px; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <img src="/icons/FireStreak.png" style="width: 20px; height: 20px; object-fit: contain;" /> ${state.gameState.streak} วัน
            </div>
          </div>
          <div>
            <div style="font-size: 0.75rem; opacity: 0.9;">ประวัติออกกำลัง</div>
            <div style="font-size: 1.1rem; font-weight: bold; margin-top: 2px; display: flex; align-items: center; justify-content: center; gap: 4px;">
              <img src="/icons/Workout.png" style="width: 20px; height: 20px; object-fit: contain;" /> ${state.workouts.length} ครั้ง
            </div>
          </div>
        </div>
      </header>

      <!-- Main Module Body -->
      <main style="padding: 15px 18px; flex: 1;">
        <div id="module-container"></div>
      </main>

      <!-- iOS Fixed Bottom Navigation Bar (Glassmorphism 7 Tabs) -->
      <nav class="ios-bottom-nav">
        <div class="ios-nav-scroll hide-scrollbar">
          <button id="nav-workout" class="ios-nav-item ${activeAppTab === 'workout' ? 'active' : ''}">
            <img src="/icons/Workout.png" class="nav-icon-img" alt="ออกกำลัง" />
            <span>ออกกำลัง</span>
          </button>
          <button id="nav-diet" class="ios-nav-item ${activeAppTab === 'diet' ? 'active' : ''}">
            <img src="/icons/Diet.png" class="nav-icon-img" alt="อาหาร" />
            <span>อาหาร</span>
          </button>
          <button id="nav-sleep" class="ios-nav-item ${activeAppTab === 'sleep' ? 'active' : ''}">
            <img src="/icons/Sleep.png" class="nav-icon-img" alt="การนอน" />
            <span>การนอน</span>
          </button>
          <button id="nav-quests" class="ios-nav-item ${activeAppTab === 'quests' ? 'active' : ''}">
            <img src="/icons/Quests.png" class="nav-icon-img" alt="ภารกิจ" />
            <span>ภารกิจ</span>
          </button>
          <button id="nav-shop" class="ios-nav-item ${activeAppTab === 'shop' ? 'active' : ''}">
            <img src="/icons/Shop.png" class="nav-icon-img" alt="ร้านค้า" />
            <span>ร้านค้า</span>
          </button>
          <button id="nav-analytics" class="ios-nav-item ${activeAppTab === 'analytics' ? 'active' : ''}">
            <img src="/icons/Analytics.png" class="nav-icon-img" alt="วิเคราะห์" />
            <span>วิเคราะห์</span>
          </button>
          <button id="nav-weekly" class="ios-nav-item ${activeAppTab === 'weekly' ? 'active' : ''}">
            <img src="/icons/Quests.png" class="nav-icon-img" alt="แข่งขัน" />
            <span>แข่งขัน</span>
          </button>
        </div>
      </nav>
    </div>
  `;

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOutUser();
  });

  document.getElementById('btn-reset-test-data')?.addEventListener('click', async () => {
    if (confirm('คุณต้องการล้างข้อมูลทดสอบทั้งหมด (ประวัติออกกำลังกาย, มื้ออาหาร, การนอน, เหรียญ, สินค้ากำหนดเอง) ใช่หรือไม่?')) {
      const res = await clearAllTestData();
      if (res.success) {
        showToast('ล้างข้อมูลทดสอบเรียบร้อยแล้วค่ะ 🧹✨', 'success');
        renderAppView(container);
      } else {
        showToast('เกิดข้อผิดพลาดในการล้างข้อมูล', 'error');
      }
    }
  });

  // Navigation Event Listeners
  container.querySelector('#nav-workout')?.addEventListener('click', () => {
    activeAppTab = 'workout';
    renderAppView(container);
  });

  container.querySelector('#nav-diet')?.addEventListener('click', () => {
    activeAppTab = 'diet';
    renderAppView(container);
  });

  container.querySelector('#nav-sleep')?.addEventListener('click', () => {
    activeAppTab = 'sleep';
    renderAppView(container);
  });

  container.querySelector('#nav-quests')?.addEventListener('click', () => {
    activeAppTab = 'quests';
    renderAppView(container);
  });

  container.querySelector('#nav-shop')?.addEventListener('click', () => {
    activeAppTab = 'shop';
    renderAppView(container);
  });

  container.querySelector('#nav-analytics')?.addEventListener('click', () => {
    activeAppTab = 'analytics';
    renderAppView(container);
  });

  container.querySelector('#nav-weekly')?.addEventListener('click', () => {
    activeAppTab = 'weekly';
    renderAppView(container);
  });

  // Render Selected Module Component
  const moduleContainer = container.querySelector('#module-container');
  if (moduleContainer) {
    if (activeAppTab === 'workout') {
      renderWorkoutSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'diet') {
      renderDietSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'sleep') {
      renderSleepSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'quests') {
      renderQuestsSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'shop') {
      renderShopSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'analytics') {
      renderAnalyticsSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'weekly') {
      renderWeeklySection(moduleContainer, () => renderAppView(container));
    }
  }
}








