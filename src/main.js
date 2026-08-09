import { state } from './store/state.js';
import { supabase } from './supabase.js';
import { loadProfiles } from './modules/auth.js';
import { renderAuthScreen, renderAppView } from './ui/render.js';

const appElement = document.getElementById('app');

// Initialize Auth Listener
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔑 Auth Event:', event);

  if (session && session.user) {
    state.user = session.user;
    await loadProfiles(session.user.id);
    renderAppView(appElement);
  } else {
    state.user = null;
    state.profile = null;
    state.partnerProfile = null;
    renderAuthScreen(appElement);
  }
});
