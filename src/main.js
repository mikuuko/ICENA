import { state } from './store/state.js';
import { supabase } from './supabase.js';

console.log('🐱 ICENA App Initializing...');

async function initApp() {
  const appElement = document.getElementById('app');
  appElement.innerHTML = `
    <div style="font-family: 'Kanit', sans-serif; text-align: center; padding: 50px;">
      <h1 style="color: #FF9EAA;">🐱 ICENA Workout & Health App</h1>
      <p style="color: #666;">กำลังเตรียมความพร้อมระบบ...</p>
    </div>
  `;
}

initApp();
