import { state } from '../store/state.js';
import { signInWithUsername, signUpWithUsername, signOutUser } from '../modules/auth.js';
import { renderWorkoutSection } from './workoutUI.js';
import { renderDietSection } from './dietUI.js';
import { renderSleepSection } from './sleepUI.js';

let activeAuthTab = 'signin'; // 'signin' or 'signup'
let activeAppTab = 'workout'; // 'workout', 'diet', or 'sleep'

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
    <div id="app-container" style="max-width: 600px; margin: 0 auto; min-height: 100vh; background: #FAF7F8; display: flex; flex-direction: column;">
      <header style="background: linear-gradient(135deg, #FF9EAA, #FFB7C5); color: white; padding: 20px 20px 20px 20px; text-align: center; border-radius: 0 0 24px 24px; position: relative; box-shadow: 0 4px 15px rgba(255,158,170,0.3);">
        <h2 style="font-family: 'Mali', cursive; margin: 0; font-size: 1.6rem;">🐱 ICENA</h2>
        <p style="font-size: 0.95rem; margin-top: 4px; opacity: 0.95;">สวัสดีคุณ ${profileName} 💕 (คู่กับ ${partnerName})</p>
        <button id="btn-logout" style="position: absolute; right: 15px; top: 20px; background: rgba(255,255,255,0.25); border: none; color: white; padding: 6px 12px; border-radius: 12px; cursor: pointer; font-family: 'Kanit', sans-serif; font-size: 0.85rem;">
          ออกจากระบบ
        </button>

        <!-- Global Header Stats Bar -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; background: rgba(255,255,255,0.2); backdrop-filter: blur(8px); border-radius: 16px; padding: 10px;">
          <div>
            <div style="font-size: 0.75rem; opacity: 0.9;">เหรียญสะสม</div>
            <div style="font-size: 1.1rem; font-weight: bold; margin-top: 2px;">🪙 ${state.gameState.coins}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; opacity: 0.9;">ออกกำลังกาย</div>
            <div style="font-size: 1.1rem; font-weight: bold; margin-top: 2px;">🔥 ${state.gameState.streak} วัน</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; opacity: 0.9;">ประวัติออกกำลัง</div>
            <div style="font-size: 1.1rem; font-weight: bold; margin-top: 2px;">🏃‍♂️ ${state.workouts.length} ครั้ง</div>
          </div>
        </div>
      </header>

      <!-- App Navigation Bar -->
      <nav style="display: grid; grid-template-columns: repeat(3, 1fr); background: white; margin: 15px 20px 0 20px; padding: 6px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.04); gap: 5px;">
        <button id="nav-workout" style="background: ${activeAppTab === 'workout' ? '#FF9EAA' : 'transparent'}; color: ${activeAppTab === 'workout' ? 'white' : '#666'}; border: none; padding: 10px 5px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit'; transition: all 0.2s;">
          🏃‍♂️ ออกกำลังกาย
        </button>
        <button id="nav-diet" style="background: ${activeAppTab === 'diet' ? '#FF9EAA' : 'transparent'}; color: ${activeAppTab === 'diet' ? 'white' : '#666'}; border: none; padding: 10px 5px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit'; transition: all 0.2s;">
          🥗 อาหาร (AI)
        </button>
        <button id="nav-sleep" style="background: ${activeAppTab === 'sleep' ? '#FF9EAA' : 'transparent'}; color: ${activeAppTab === 'sleep' ? 'white' : '#666'}; border: none; padding: 10px 5px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit'; transition: all 0.2s;">
          😴 การนอน
        </button>
      </nav>

      <main style="padding: 0 20px 20px 20px; flex: 1;">
        <div id="module-container"></div>
      </main>
    </div>
  `;

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOutUser();
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

  // Render Selected Module Component
  const moduleContainer = container.querySelector('#module-container');
  if (moduleContainer) {
    if (activeAppTab === 'workout') {
      renderWorkoutSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'diet') {
      renderDietSection(moduleContainer, () => renderAppView(container));
    } else if (activeAppTab === 'sleep') {
      renderSleepSection(moduleContainer, () => renderAppView(container));
    }
  }
}



