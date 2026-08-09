import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';

// Load sleep logs for current user
export async function loadSleepLogs() {
  if (!state.user) return [];

  try {
    const { data, error } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', state.user.id)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error fetching sleep logs:', error);
      showToast('ไม่สามารถดึงข้อมูลการนอนหลับได้', 'error');
      return [];
    }

    state.sleepLogs = data || [];
    return state.sleepLogs;
  } catch (err) {
    console.error('Unexpected error loading sleep logs:', err);
    return [];
  }
}

// Log sleep record
export async function logSleep({ sleep_time, wake_time, quality = 'good', raw_text = '' }) {
  if (!state.user) {
    showToast('กรุณาเข้าสู่ระบบก่อนบันทึกการนอนหลับค่ะ', 'warning');
    return { success: false, error: 'Not authenticated' };
  }

  const start = new Date(sleep_time);
  const end = new Date(wake_time);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
    showToast('กรุณาระบุเวลาเข้านอนและเวลาตื่นนอนให้ถูกต้องค่ะ', 'warning');
    return { success: false, error: 'Invalid timestamps' };
  }

  // Calculate duration in hours
  const diffMs = end - start;
  const durationHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

  try {
    const { data: newLog, error } = await supabase
      .from('sleep_logs')
      .insert({
        user_id: state.user.id,
        sleep_time: start.toISOString(),
        wake_time: end.toISOString(),
        duration_hours: durationHours,
        quality,
        raw_text
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log sleep:', error);
      showToast('ไม่สามารถบันทึกข้อมูลการนอนหลับได้', 'error');
      return { success: false, error };
    }

    showToast(`บันทึกการนอนหลับ (${durationHours} ชั่วโมง) เรียบร้อยแล้วค่ะ 😴`, 'success');
    await loadSleepLogs();
    return { success: true, data: newLog };
  } catch (err) {
    console.error('Unexpected error logging sleep:', err);
    showToast('เกิดข้อผิดพลาดในการบันทึกการนอนหลับ', 'error');
    return { success: false, error: err };
  }
}

// Delete sleep log record
export async function deleteSleepLog(logId) {
  if (!state.user || !logId) return { success: false };

  try {
    const { error } = await supabase
      .from('sleep_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to delete sleep log:', error);
      showToast('ไม่สามารถลบรายการนอนหลับได้', 'error');
      return { success: false, error };
    }

    showToast('ลบรายการนอนหลับเรียบร้อยแล้วค่ะ 🗑️', 'info');
    await loadSleepLogs();
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting sleep log:', err);
    showToast('เกิดข้อผิดพลาดในการลบรายการนอนหลับ', 'error');
    return { success: false, error: err };
  }
}
