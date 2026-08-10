import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { uploadImage } from './storage.js';
import { recalcStreak } from './streak.js';
import { checkAndIssueCoupon } from './coupon.js';
import { checkAchievements } from './achievements.js';
import { showToast } from '../ui/toast.js';
import { callGeminiAPI } from './gemini.js';

// Helper to convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}

// Analyze workout report screenshot using Gemini AI Vision
export async function analyzeWorkoutImage(imageFile) {
  if (!imageFile) {
    showToast('กรุณาเลือกรูปภาพผลการออกกำลังกายก่อนสแกนค่ะ', 'warning');
    return null;
  }

  try {
    const base64Data = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';
    const prompt = `คุณคือ AI ผู้เชี่ยวชาญการออกกำลังกายประจำแอป ICENA (โค้ชเหมียว 🐱) จงอ่านสกรีนช็อตผลการออกกำลังกายนี้แล้วตอบกลับเป็น JSON เท่านั้น โดยไม่ต้องมีข้อความเปิดปิดหรือ Markdown codeblock formatting ใดๆ โครงสร้าง JSON:
{
  "type": "cardio",
  "duration_minutes": 45,
  "intensity": "medium",
  "note": "ข้อความสรุปกิจกรรมสั้นๆ"
}
(ประเภท type เลือกจาก 'cardio', 'weight', 'yoga', 'running', 'cycling'; ระดับ intensity เลือกจาก 'low', 'medium', 'high')`;

    const result = await callGeminiAPI(prompt, base64Data, mimeType);
    if (result) {
      showToast('วิเคราะห์ผลออกกำลังกายด้วย Gemini AI สำเร็จ! 🏃‍♂️✨', 'success');
    }
    return result;
  } catch (err) {
    console.error('Failed to analyze workout image:', err);
    showToast('เกิดข้อผิดพลาดในการวิเคราะห์รูปออกกำลังกาย', 'error');
    return null;
  }
}

// Load workouts for current user
export async function loadWorkouts() {
  if (!state.user) return [];

  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', state.user.id)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error fetching workouts:', error);
      showToast('ไม่สามารถดึงข้อมูลออกกำลังกายได้', 'error');
      return [];
    }

    state.workouts = data || [];
    return state.workouts;
  } catch (err) {
    console.error('Unexpected error loading workouts:', err);
    return [];
  }
}

// Log new workout and award coins via Server-Side RPC ONLY
export async function logWorkout({ type, duration_minutes, intensity, note = '', image_file = null }) {
  if (!state.user) {
    showToast('กรุณาเข้าสู่ระบบก่อนบันทึกกิจกรรมค่ะ', 'warning');
    return { success: false, error: 'Not authenticated' };
  }

  const duration = parseInt(duration_minutes, 10);
  if (isNaN(duration) || duration <= 0) {
    showToast('กรุณาระบุระยะเวลาออกกำลังกายให้ถูกต้องค่ะ', 'warning');
    return { success: false, error: 'Invalid duration' };
  }

  try {
    let image_url = null;

    if (image_file) {
      const uploadRes = await uploadImage(image_file, 'workout');
      if (uploadRes.success) {
        image_url = uploadRes.path;
      }
    }

    // 1. Insert Workout Record
    const { data: newWorkout, error: insertErr } = await supabase
      .from('workouts')
      .insert({
        user_id: state.user.id,
        type,
        duration_minutes: duration,
        intensity,
        note,
        image_url
      })
      .select()
      .single();

    if (insertErr || !newWorkout) {
      console.error('Failed to insert workout:', insertErr);
      showToast(insertErr?.message || 'ไม่สามารถบันทึกการออกกำลังกายได้', 'error');
      return { success: false, error: insertErr };
    }

    // 2. Award Coins via RPC ONLY (Rule #7 & Anti-pattern mitigation)
    const { data: coinRes, error: rpcErr } = await supabase.rpc('award_workout_coins', {
      p_workout_id: newWorkout.id
    });

    let coinsEarned = 0;

    if (rpcErr) {
      console.error('RPC award_workout_coins error:', rpcErr);
      showToast('บันทึกสำเร็จ แต่มอบเหรียญไม่สำเร็จ: ' + rpcErr.message, 'error');
    } else if (coinRes && coinRes.success) {
      coinsEarned = coinRes.coins_earned;
      state.gameState.coins = coinRes.new_total_coins;
      showToast(
        `บันทึกการออกกำลังกายสำเร็จ! 🎉 +${coinsEarned} เหรียญ 🪙 (ตัวคูณ x${coinRes.streak_multiplier})`,
        'success'
      );
    }

    // 3. Refresh Workouts State & Trigger Gamification Updates
    await loadWorkouts();
    await recalcStreak();
    await checkAndIssueCoupon(duration);
    await checkAchievements();

    return { success: true, data: newWorkout, coinsEarned };
  } catch (err) {
    console.error('Unexpected error in logWorkout:', err);
    showToast('เกิดข้อผิดพลาดในการบันทึกการออกกำลังกาย', 'error');
    return { success: false, error: err };
  }
}

// Delete workout record (Recalculates Streak on delete!)
export async function deleteWorkout(workoutId) {
  if (!state.user || !workoutId) return { success: false };

  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to delete workout:', error);
      showToast('ไม่สามารถลบรายการออกกำลังกายได้', 'error');
      return { success: false, error };
    }

    showToast('ลบรายการออกกำลังกายเรียบร้อยแล้วค่ะ 🗑️', 'info');
    await loadWorkouts();
    await recalcStreak();
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting workout:', err);
    showToast('เกิดข้อผิดพลาดในการลบรายการ', 'error');
    return { success: false, error: err };
  }
}

