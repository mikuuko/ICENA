import { state } from './store/state.js';
import { supabase } from './supabase.js';
import { loadProfiles } from './modules/auth.js';
import { loadAppData, resetState } from './store/loader.js';
import { renderAuthScreen, renderAppView } from './ui/render.js';

const appElement = document.getElementById('app');

// Fallback error UI if initialization fails
function renderErrorFallback(err) {
  if (!appElement) return;
  appElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: rgba(255,255,255,0.95); border-radius: 20px; padding: 25px; text-align: center; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 2px solid #FF9EAA;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🐱</div>
        <h3 style="color: #FF6B8B; font-family: 'Mali', cursive; margin-bottom: 8px;">ยินดีต้อนรับสู่ ICENA</h3>
        <p style="font-size: 0.85rem; color: #666; margin-bottom: 15px;">${err?.message || 'กำลังโหลดระบบ...'}</p>
        <button onclick="window.location.reload()" style="background: #FF9EAA; color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
          🔄 โหลดหน้าเว็บอีกครั้ง
        </button>
      </div>
    </div>
  `;
}

// Initial render to prevent blank background screen before auth event resolves
try {
  renderAuthScreen(appElement);
} catch (e) {
  renderErrorFallback(e);
}

// Initialize Auth Listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔑 Auth Event:', event);

  try {
    if (session && session.user) {
      state.user = session.user;
      try {
        await loadProfiles(session.user.id);
      } catch (pErr) {
        console.error('Error loading profiles:', pErr);
      }

      try {
        await loadAppData(session.user.id);
      } catch (dErr) {
        console.error('Error loading app data:', dErr);
      }

      renderAppView(appElement);
    } else {
      resetState();
      renderAuthScreen(appElement);
    }
  } catch (err) {
    console.error('Fatal Auth Change Error:', err);
    renderErrorFallback(err);
  }
});
