import { showToast } from '../ui/toast.js';

// Get Gemini API Key with localStorage fallback & user prompt
export function getGeminiApiKey() {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'YOUR_GEMINI_API_KEY') {
    apiKey = localStorage.getItem('ICENA_GEMINI_API_KEY') || '';
  }

  if (!apiKey) {
    const input = prompt(
      '🔑 กรุณากรอก Gemini API Key เพื่อเปิดใช้งานระบบ AI (โค้ชเหมียว 🐱)\n(สามารถสร้างคีย์ฟรีได้ที่ https://aistudio.google.com):'
    );
    if (input && input.trim()) {
      apiKey = input.trim();
      localStorage.setItem('ICENA_GEMINI_API_KEY', apiKey);
      showToast('บันทึก Gemini API Key เรียบร้อยแล้วค่ะ! 🐱✨', 'success');
    }
  }

  return apiKey;
}

// Call Gemini API with candidate model fallback
export async function callGeminiAPI(promptText, base64Image = null, mimeType = 'image/jpeg') {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    showToast('ไม่พบ Gemini API Key (โปรดใส่ API Key เพื่อใช้งาน AI ค่ะ)', 'warning');
    return null;
  }

  const candidateModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash-lite'];

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts = [{ text: promptText }];
      if (base64Image) {
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        });
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] })
      });

      if (response.status === 404) {
        console.warn(`Gemini model ${model} returned 404, trying fallback model...`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gemini API error (${model}):`, errText);
        showToast(`Gemini API Error (${response.status}): โปรดตรวจสอบ API Key`, 'error');
        return null;
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(cleanedText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', rawText);
        showToast('AI ประมวลผลตอบกลับในรูปแบบที่ไม่ถูกต้อง', 'error');
        return null;
      }
    } catch (netErr) {
      console.error(`Network error calling Gemini API (${model}):`, netErr);
    }
  }

  showToast('ไม่สามารถเชื่อมต่อ Gemini API ได้ (โปรดตรวจสอบ API Key)', 'error');
  return null;
}
