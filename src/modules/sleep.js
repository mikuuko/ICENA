import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { uploadImage } from './storage.js';
import { showToast } from '../ui/toast.js';

// Helper to convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}

// Analyze sleep report screenshot using Gemini AI Vision (gemini-3.5-flash-lite)
export async function analyzeSleepImage(imageFile) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || !imageFile) {
    showToast('กรุณาตั้งค่า VITE_GEMINI_API_KEY ก่อนใช้งาน AI Vision ค่ะ', 'warning');
    return null;
  }

  try {
    const base64Data = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';
    const model = 'gemini-3.5-flash-lite';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `คุณคือ AI ผู้เชี่ยวชาญด้านการนอนประจำแอป ICENA (โค้ชเหมียว 🐱) จงอ่านสกรีนช็อตผลการนอนหลับนี้แล้วตอบกลับเป็น JSON เท่านั้น โดยไม่ต้องมีข้อความเปิดปิดหรือ Markdown codeblock formatting ใดๆ โครงสร้าง JSON:
{
  "sleep_time": "YYYY-MM-DDTHH:MM",
  "wake_time": "YYYY-MM-DDTHH:MM",
  "quality": "good",
  "summary": "ข้อความวิเคราะห์คุณภาพการนอนสั้นๆ"
}
(คุณภาพ quality เลือกจาก 'poor': แย่, 'fair': ปานกลาง, 'good': ดี, 'excellent': ดีมาก)`;

    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data
              }
            }
          ]
        }
      ]
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      showToast('วิเคราะห์รูปการนอนไม่สำเร็จ (API Error)', 'error');
      return null;
    }

    const resData = await response.json();
    const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    showToast('วิเคราะห์ผลการนอนหลับด้วย Gemini AI สำเร็จ! 😴✨', 'success');
    return result;
  } catch (err) {
    console.error('Failed to analyze sleep image:', err);
    showToast('เกิดข้อผิดพลาดในการวิเคราะห์รูปการนอนหลับ', 'error');
    return null;
  }
}

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
export async function logSleep({ sleep_time, wake_time, quality = 'good', raw_text = '', image_file = null }) {
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
    let image_url = null;

    if (image_file) {
      const uploadRes = await uploadImage(image_file, 'sleep');
      if (uploadRes.success) {
        image_url = uploadRes.path;
      }
    }

    const { data: newLog, error } = await supabase
      .from('sleep_logs')
      .insert({
        user_id: state.user.id,
        sleep_time: start.toISOString(),
        wake_time: end.toISOString(),
        duration_hours: durationHours,
        quality,
        raw_text,
        image_url
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
