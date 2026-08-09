import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';

// Convert simple username to internal email
function usernameToEmail(username) {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `${cleanUsername}@icena.app`;
}

// Sign Up with Username & Password
export async function signUpWithUsername(username, password, displayName) {
  try {
    if (!username || !password || !displayName) {
      showToast('กรุณากรอกข้อมูลให้ครบทุกช่องค่ะ', 'warning');
      return { success: false, error: 'Missing fields' };
    }

    const email = usernameToEmail(username);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });

    if (error) {
      console.error('Sign up error:', error);
      showToast(error.message || 'ไม่สามารถสร้างไอดีได้', 'error');
      return { success: false, error };
    }

    showToast(`สร้างไอดี ${displayName} สำเร็จแล้วค่ะ! 🐱`, 'success');
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected sign up error:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างไอดี', 'error');
    return { success: false, error: err };
  }
}

// Sign In with Username & Password
export async function signInWithUsername(username, password) {
  try {
    if (!username || !password) {
      showToast('กรุณากรอกไอดีและรหัสผ่านค่ะ', 'warning');
      return { success: false, error: 'Missing fields' };
    }

    const email = usernameToEmail(username);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Sign in error:', error);
      showToast('ไอดีหรือรหัสผ่านไม่ถูกต้องค่ะ 😿', 'error');
      return { success: false, error };
    }

    showToast('ยินดีต้อนรับกลับบ้านค่ะ! 🐾', 'success');
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected sign in error:', err);
    showToast('เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    return { success: false, error: err };
  }
}

// Sign Out
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast('ไม่สามารถออกจากระบบได้', 'error');
      return false;
    }
    state.user = null;
    state.profile = null;
    state.partnerProfile = null;
    showToast('ออกจากระบบแล้วค่ะ 👋', 'info');
    return true;
  } catch (err) {
    console.error('Sign out error:', err);
    return false;
  }
}

// Load current user's profile and partner's profile
export async function loadProfiles(userId) {
  try {
    // 1. Get current user profile
    const { data: myProfile, error: myErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (myErr) {
      console.error('Error fetching my profile:', myErr);
    } else {
      state.profile = myProfile;
    }

    // 2. Get partner profile (read all authenticated policy from Phase 1)
    const { data: allProfiles, error: allErr } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId);

    if (allErr) {
      console.error('Error fetching partner profile:', allErr);
    } else if (allProfiles && allProfiles.length > 0) {
      state.partnerProfile = allProfiles[0];
    } else {
      state.partnerProfile = null;
    }
  } catch (err) {
    console.error('Failed to load profiles:', err);
  }
}
