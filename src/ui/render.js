import { state } from '../store/state.js';
import { signInWithUsername, signUpWithUsername, signOutUser } from '../modules/auth.js';

let activeAuthTab = 'signin'; // 'signin' or 'signup'

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
      <header style="background: var(--primary-color); color: white; padding: 20px; text-align: center; border-radius: 0 0 20px 20px; position: relative;">
        <h2 style="font-family: 'Mali', cursive;">🐱 ICENA</h2>
        <p style="font-size: 0.95rem; margin-top: 4px;">สวัสดีคุณ ${profileName} 💕 (คู่กับ ${partnerName})</p>
        <button id="btn-logout" style="position: absolute; right: 15px; top: 20px; background: rgba(255,255,255,0.25); border: none; color: white; padding: 6px 12px; border-radius: 12px; cursor: pointer; font-family: 'Kanit';">
          ออกจากระบบ
        </button>
      </header>

      <main style="padding: 20px; flex: 1; text-align: center;">
        <div style="background: #FFF0F4; border-radius: 20px; padding: 30px; margin-top: 20px; border: 2px dashed #FF9EAA;">
          <h3 style="color: #FF6B8B; margin-bottom: 10px;">🎉 เข้าสู่ระบบสำเร็จแล้ว!</h3>
          <p style="color: #666;">Auth Module (Phase 2) สมบูรณ์เรียบร้อย</p>
          <p style="color: #888; font-size: 0.85rem; margin-top: 15px;">User ID: ${state.user.id}</p>
        </div>
      </main>
    </div>
  `;

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await signOutUser();
  });
}
