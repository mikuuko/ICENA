import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { uploadImage } from './storage.js';
import { showToast } from '../ui/toast.js';
import { callGeminiAPI } from './gemini.js';

// Helper to convert File to Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
}


// Analyze food photo using Gemini AI Vision
export async function analyzeFoodImage(imageFile) {
  if (!imageFile) {
    showToast('กรุณาเลือกรูปภาพอาหารก่อนสแกนค่ะ', 'warning');
    return null;
  }

  try {
    const base64Data = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';
    const prompt = `คุณคือ AI นักโภชนาการประจำแอป ICENA (โค้ชเหมียว 🐱) จงวิเคราะห์รูปอาหารนี้แล้วตอบกลับเป็น JSON เท่านั้น โดยไม่ต้องมีข้อความเปิดปิดหรือ Markdown codeblock formatting ใดๆ โครงสร้าง JSON:
{
  "food_name": "ชื่ออาหารภาษาไทยกระชับ",
  "calories": 450,
  "score": "A",
  "summary": "คำแนะนำโภชนาการสั้นๆ"
}
(เกรด score เลือกจาก A: ดีมากต่อสุขภาพ, B: ดี, C: ปานกลาง/แป้งสูง, D: ของทอด/น้ำตาลสูง)`;

    const result = await callGeminiAPI(prompt, base64Data, mimeType);
    if (result) {
      showToast('วิเคราะห์เมนูอาหารด้วย Gemini AI สำเร็จ! 🐱✨', 'success');
    }
    return result;
  } catch (err) {
    console.error('Failed to analyze food image:', err);
    showToast('เกิดข้อผิดพลาดในการวิเคราะห์รูปอาหาร', 'error');
    return null;
  }
}

// Analyze food calories & score from text name using Gemini AI
export async function analyzeFoodText(foodName) {
  if (!foodName || !foodName.trim()) {
    showToast('กรุณากรอกชื่ออาหารก่อนกดประเมินค่ะ', 'warning');
    return null;
  }

  const prompt = `คุณคือ AI นักโภชนาการประจำแอป ICENA (โค้ชเหมียว 🐱) จงประเมินเมนูอาหารชื่อ "${foodName.trim()}" แล้วตอบกลับเป็น JSON เท่านั้น โดยไม่ต้องมีข้อความเปิดปิดหรือ Markdown codeblock formatting ใดๆ โครงสร้าง JSON:
{
  "food_name": "${foodName.trim()}",
  "calories": 450,
  "score": "B",
  "summary": "คำแนะนำโภชนาการสั้นๆ"
}
(เกรด score เลือกจาก A: ดีมากต่อสุขภาพ, B: ดี, C: ปานกลาง/แป้งสูง, D: ของทอด/หวานจัด)`;

  const result = await callGeminiAPI(prompt);
  if (result) {
    showToast(`AI ประเมินเมนู "${foodName}" สำเร็จ! 🤖✨`, 'success');
  }
  return result;
}

// Load diet logs for current user
export async function loadDietLogs() {
  if (!state.user) return [];

  try {
    const { data, error } = await supabase
      .from('diet_logs')
      .select('*')
      .eq('user_id', state.user.id)
      .order('logged_at', { ascending: false });

    if (error) {
      console.error('Error fetching diet logs:', error);
      showToast('ไม่สามารถดึงข้อมูลมื้ออาหารได้', 'error');
      return [];
    }

    state.dietLogs = data || [];
    return state.dietLogs;
  } catch (err) {
    console.error('Unexpected error loading diet logs:', err);
    return [];
  }
}

// Log diet record
export async function logDiet({ meal_type, food_name, calories = 0, score = 'B', image_file = null, ai_analysis = {}, logged_at = null }) {
  if (!state.user) {
    showToast('กรุณาเข้าสู่ระบบก่อนบันทึกมื้ออาหารค่ะ', 'warning');
    return { success: false, error: 'Not authenticated' };
  }

  try {
    let image_url = null;

    if (image_file) {
      const uploadRes = await uploadImage(image_file, 'diet');
      if (uploadRes.success) {
        image_url = uploadRes.path;
      }
    }

    const insertPayload = {
      user_id: state.user.id,
      meal_type,
      food_name,
      calories: parseInt(calories, 10) || 0,
      score,
      image_url,
      ai_analysis
    };

    if (logged_at) {
      const parsedDate = new Date(logged_at);
      if (!isNaN(parsedDate.getTime())) {
        insertPayload.logged_at = parsedDate.toISOString();
      }
    }

    const { data: newLog, error } = await supabase
      .from('diet_logs')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Failed to log diet:', error);
      showToast('ไม่สามารถบันทึกมื้ออาหารได้', 'error');
      return { success: false, error };
    }

    showToast(`บันทึกมื้อ ${food_name} เรียบร้อยแล้วค่ะ 🥗`, 'success');
    await loadDietLogs();
    return { success: true, data: newLog };
  } catch (err) {
    console.error('Unexpected error logging diet:', err);
    showToast('เกิดข้อผิดพลาดในการบันทึกมื้ออาหาร', 'error');
    return { success: false, error: err };
  }
}

// Delete diet log record
export async function deleteDietLog(logId) {
  if (!state.user || !logId) return { success: false };

  try {
    const { error } = await supabase
      .from('diet_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to delete diet log:', error);
      showToast('ไม่สามารถลบรายการอาหารได้', 'error');
      return { success: false, error };
    }

    showToast('ลบรายการอาหารเรียบร้อยแล้วค่ะ 🗑️', 'info');
    await loadDietLogs();
    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting diet log:', err);
    showToast('เกิดข้อผิดพลาดในการลบรายการอาหาร', 'error');
    return { success: false, error: err };
  }
}
