import { showToast } from '../ui/toast.js';

// Get Gemini / OpenCode API Key with localStorage fallback & user prompt
export function getGeminiApiKey(forcePrompt = false) {
  if (forcePrompt) {
    localStorage.removeItem('ICENA_GEMINI_API_KEY');
  }

  let apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey === 'YOUR_GEMINI_API_KEY') {
    apiKey = localStorage.getItem('ICENA_GEMINI_API_KEY') || '';
  }

  if (!apiKey || forcePrompt) {
    const input = prompt(
      '🔑 กรุณากรอก Gemini / OpenCode API Key เพื่อเปิดใช้งานระบบ AI (โค้ชเหมียว 🐱):\n(รองรับทั้ง Gemini Key "AIza..." และ OpenCode Key "sk-..."):',
      apiKey || ''
    );
    if (input && input.trim()) {
      apiKey = input.trim();
      localStorage.setItem('ICENA_GEMINI_API_KEY', apiKey);
      showToast('บันทึก API Key เรียบร้อยแล้วค่ะ! 🐱✨', 'success');
    }
  }

  return apiKey;
}

// Reset API Key
export function resetGeminiApiKey() {
  return getGeminiApiKey(true);
}

// Helper to handle OpenAI / OpenCode Chat Completion format for sk- keys
async function callOpenCodeAPI(apiKey, promptText, base64Image = null, mimeType = 'image/jpeg') {
  const endpoints = [
    { url: 'https://api.opencode.ai/v1/chat/completions', model: 'google/gemini-flash-1.5' },
    { url: 'https://opencode.ai/v1/chat/completions', model: 'google/gemini-flash-1.5' },
    { url: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemini-flash-1.5' }
  ];

  let messageContent = promptText;
  if (base64Image) {
    messageContent = [
      { type: 'text', text: promptText },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
    ];
  }

  for (const ep of endpoints) {
    try {
      const response = await fetch(ep.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: ep.model,
          messages: [{ role: 'user', content: messageContent }],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        console.warn(`OpenCode endpoint ${ep.url} returned HTTP ${response.status}`);
        continue;
      }

      const resData = await response.json();
      const rawText = resData.choices?.[0]?.message?.content || '';
      const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        return JSON.parse(cleanedText);
      } catch (pErr) {
        console.error('Failed to parse OpenCode JSON output:', rawText);
        return null;
      }
    } catch (err) {
      console.warn(`Error calling OpenCode API at ${ep.url}:`, err);
    }
  }

  return null;
}

// Call Gemini / OpenCode API with candidate model fallback & 429 rate limit handling
export async function callGeminiAPI(promptText, base64Image = null, mimeType = 'image/jpeg') {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    showToast('ไม่พบ API Key (โปรดใส่ API Key เพื่อใช้งาน AI ค่ะ)', 'warning');
    return null;
  }

  // If key starts with 'sk-', try OpenCode / OpenAI Compatible API first
  if (apiKey.startsWith('sk-')) {
    const openCodeResult = await callOpenCodeAPI(apiKey, promptText, base64Image, mimeType);
    if (openCodeResult) {
      return openCodeResult;
    }
  }

  // Standard Gemini API Candidate Models
  const candidateModels = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-1.5-pro',
    'gemini-3.5-flash-lite'
  ];

  let has429Err = false;
  let hasAuthErr = false;

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

      const headers = { 'Content-Type': 'application/json' };
      if (apiKey.startsWith('sk-')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ contents: [{ parts }] })
      });

      // Handle Model Not Found (404) -> Fallback
      if (response.status === 404) {
        console.warn(`Gemini model ${model} returned 404 Not Found, trying fallback...`);
        continue;
      }

      // Handle Rate Limit / Quota Exceeded (429) -> Fallback
      if (response.status === 429) {
        console.warn(`Gemini model ${model} returned 429 Rate Limit Exceeded, trying fallback...`);
        has429Err = true;
        continue;
      }

      // Handle Invalid API Key / Auth Error (400 or 403)
      if (response.status === 400 || response.status === 403) {
        const errText = await response.text();
        console.error(`Gemini API Auth Error (${model}):`, errText);
        hasAuthErr = true;
        break;
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Gemini API error (${model} - HTTP ${response.status}):`, errText);
        continue;
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

  // Handle specific overall errors
  if (hasAuthErr) {
    localStorage.removeItem('ICENA_GEMINI_API_KEY');
    showToast('🔑 API Key ไม่ถูกต้อง หรือไม่มีสิทธิ์ใช้งาน (Error 400/403) โปรดตรวจสอบคีย์ใหม่ค่ะ', 'error');
  } else if (has429Err) {
    showToast('⏳ โควต้า API ถ่ายโอนถี่เกินไป (Error 429 Rate Limit) โปรดรอ 1-2 นาทีแล้วลองใหม่นะคะ', 'warning');
  } else {
    showToast('ไม่สามารถเชื่อมต่อ AI API ได้ (โปรดตรวจสอบ API Key หรืออินเทอร์เน็ต)', 'error');
  }

  return null;
}
