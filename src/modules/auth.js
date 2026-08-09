import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { resetState } from '../store/loader.js';
import { showToast } from '../ui/toast.js';

// Convert simple username to internal email
function usernameToEmail(username) {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `${cleanUsername}.icena@gmail.com`;
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

    // If session is null, attempt instant sign in
    if (!data.session) {
      return await signInWithUsername(username, password);
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
    resetState();
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
    // 1. Get current user profile or auto-create if missing
    let { data: myProfile, error: myErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!myProfile) {
      const displayName = state.user?.user_metadata?.display_name || state.user?.email?.split('@')[0] || 'Member';
      const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(displayName)}`;

      const { data: createdProfile } = await supabase
        .from('profiles')
        .upsert({ id: userId, display_name: displayName, avatar_url: avatarUrl })
        .select()
        .single();

      await supabase
        .from('user_game_state')
        .upsert({ user_id: userId, streak: 0, coins: 0 });

      myProfile = createdProfile;
    }

    state.profile = myProfile;

    // 2. Get partner profile
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
