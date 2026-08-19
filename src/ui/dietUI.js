import { state } from '../store/state.js';
import { logDiet, deleteDietLog, analyzeFoodImage, analyzeFoodText } from '../modules/diet.js';
import { getSignedImageUrl } from '../modules/storage.js';
import { showToast } from './toast.js';

const MEAL_TYPES = [
  { id: 'breakfast', name: 'มื้อเช้า', emoji: '🌅' },
  { id: 'lunch', name: 'มื้อเที่ยง', emoji: '☀️' },
  { id: 'dinner', name: 'มื้อเย็น', emoji: '🌙' },
  { id: 'snack', name: 'ของว่าง', emoji: '🍪' }
];

const SCORE_COLORS = {
  A: '#4CAF50',
  B: '#2196F3',
  C: '#FF9800',
  D: '#F44336'
};

function toDatetimeLocalValue(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function renderDietSection(container, onUpdateCallback) {
  let selectedFile = null;
  let currentCalories = 0;
  let currentScore = 'B';
  let aiResultData = {};
  const now = new Date();
  const nowStr = toDatetimeLocalValue(now);

  container.innerHTML = `
    <div class="diet-section" style="margin-top: 20px; text-align: left;">
      <!-- Diet Form Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🥗</span> บันทึกมื้ออาหาร (Gemini AI 🤖)
        </h3>

        <!-- Photo Upload & Scan Area -->
        <div style="background: #FFF5F7; border: 2px dashed #FF9EAA; border-radius: 16px; padding: 15px; text-align: center; margin-bottom: 15px;">
          <input type="file" id="diet-photo-input" accept="image/*" style="display: none;">
          <div id="photo-preview-container" style="display: none; margin-bottom: 10px;">
            <img id="photo-preview" style="max-height: 180px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
          <button type="button" id="btn-select-photo" style="background: white; border: 1.5px solid #FF9EAA; color: #FF6B8B; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
            📸 ถ่าย/เลือกรูปอาหาร (ถ้ามี)
          </button>
          <button type="button" id="btn-scan-ai" style="display: none; background: #FF9EAA; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-left: 8px; font-family: 'Kanit';">
            ✨ สแกนรูปด้วย Gemini AI
          </button>
          <p id="ai-status-text" style="font-size: 0.8rem; color: #888; margin-top: 6px; display: none;"></p>
        </div>

        <form id="diet-form">
          <!-- Date / Time Selection -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              📅 วันที่รับประทาน
            </label>
            <div style="display: flex; gap: 8px; margin-bottom: 8px;">
              <button type="button" id="btn-diet-date-today" class="diet-date-btn" style="flex: 1; padding: 7px 8px; border-radius: 10px; border: 1.5px solid #FF9EAA; background: #FF9EAA; color: white; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                🌟 วันนี้
              </button>
              <button type="button" id="btn-diet-date-yesterday" class="diet-date-btn" style="flex: 1; padding: 7px 8px; border-radius: 10px; border: 1.5px solid #FFC0CB; background: white; color: #666; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                ⏪ เมื่อวาน
              </button>
              <button type="button" id="btn-diet-date-custom" class="diet-date-btn" style="flex: 1; padding: 7px 8px; border-radius: 10px; border: 1.5px solid #FFC0CB; background: white; color: #666; font-size: 0.85rem; font-weight: bold; cursor: pointer; transition: all 0.2s;">
                🗓️ กำหนดเอง
              </button>
            </div>

            <div id="diet-custom-date-container" style="display: none; margin-top: 6px;">
              <input type="datetime-local" id="diet_datetime" value="${nowStr}" max="${nowStr}" style="width: 100%; padding: 9px 12px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.9rem; box-sizing: border-box; background: white;">
            </div>
            <div id="diet-date-badge" style="display: none; font-size: 0.8rem; color: #E91E63; background: #FFF0F3; border: 1px solid #FFD1DC; padding: 5px 10px; border-radius: 8px; margin-top: 6px;">
              ⚡ <span id="diet-date-badge-text">บันทึกย้อนหลัง (ระบบจะคำนวณแต้มสุขภาพย้อนหลังให้อัตโนมัติ ✨)</span>
            </div>
          </div>

          <!-- Meal Type -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 8px;">
              ประเภทมื้ออาหาร
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${MEAL_TYPES.map((m, idx) => `
                <label style="cursor: pointer;">
                  <input type="radio" name="meal_type" value="${m.id}" ${idx === 1 ? 'checked' : ''} style="display: none;" class="meal-type-radio">
                  <div class="meal-pill" style="border: 2px solid #FF9EAA; border-radius: 12px; padding: 8px 4px; text-align: center; font-size: 0.8rem; font-weight: 500; transition: all 0.2s;">
                    <div style="font-size: 1.2rem;">${m.emoji}</div>
                    <div style="margin-top: 2px;">${m.name}</div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Food Name Input -->
          <div style="margin-bottom: 15px;">
            <label for="food_name" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              ชื่ออาหารที่รับประทาน
            </label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="food_name" placeholder="เช่น ข้าวมันไก่, สลัดอกไก่" required style="flex: 1; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box;">
              <button type="button" id="btn-text-ai" style="background: #FFF0F4; border: 1.5px solid #FF9EAA; color: #FF6B8B; padding: 0 12px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
                🤖 AI ประเมิน
              </button>
            </div>
          </div>

          <!-- AI Evaluation Display Badge (Auto-populated by AI) -->
          <div id="ai-evaluation-box" style="background: #FFF9FA; border: 1px solid #FFE0E6; border-radius: 14px; padding: 12px 15px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-size: 0.8rem; color: #888;">ผลการประเมินจาก Gemini AI 🐱</div>
              <div id="ai-eval-summary" style="font-size: 0.9rem; font-weight: 500; color: #666; margin-top: 2px;">
                ประมาณการ: <b id="eval-kcal" style="color: #FF6B8B;">0</b> kcal • เกรด <span id="eval-score" style="background: #9E9E9E; color: white; padding: 1px 8px; border-radius: 10px; font-size: 0.8rem;">รอประเมิน</span>
              </div>
            </div>
            <div style="font-size: 1.5rem;">🤖</div>
          </div>

          <button type="submit" id="btn-submit-diet" style="width: 100%; background: #FF9EAA; color: white; border: none; padding: 12px; border-radius: 14px; font-size: 1rem; font-weight: bold; cursor: pointer; font-family: 'Kanit', sans-serif;">
            บันทึกมื้ออาหาร 🥗
          </button>
        </form>
      </div>

      <!-- Diet Log History Cards -->
      <div class="history-card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive;">
          📋 ประวัติมื้ออาหาร (${state.dietLogs.length})
        </h3>

        ${state.dietLogs.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 30px 10px;">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">🥗</div>
            <p>ยังไม่มีบันทึกมื้ออาหาร</p>
          </div>
        ` : `
          <div id="diet-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Items injected asynchronously -->
          </div>
        `}
      </div>
    </div>
  `;

  // Dynamic Radio Style Update
  const radioInputs = container.querySelectorAll('.meal-type-radio');
  const updateRadioStyles = () => {
    radioInputs.forEach(r => {
      const pill = r.nextElementSibling;
      if (r.checked) {
        pill.style.background = '#FF9EAA';
        pill.style.color = 'white';
        pill.style.borderColor = '#FF9EAA';
      } else {
        pill.style.background = 'white';
        pill.style.color = '#555';
        pill.style.borderColor = '#FFC0CB';
      }
    });
  };
  updateRadioStyles();
  radioInputs.forEach(r => r.addEventListener('change', updateRadioStyles));

  // Helper to update UI evaluation badge
  const updateEvaluationBadge = (kcal, score, summary = '') => {
    currentCalories = parseInt(kcal, 10) || 0;
    currentScore = score || 'B';
    const kcalElem = container.querySelector('#eval-kcal');
    const scoreElem = container.querySelector('#eval-score');
    const evalSummaryContainer = container.querySelector('#ai-eval-summary');

    if (kcalElem) kcalElem.innerText = currentCalories;
    if (scoreElem) {
      scoreElem.innerText = `Grade ${currentScore}`;
      scoreElem.style.background = SCORE_COLORS[currentScore] || '#2196F3';
    }
    if (evalSummaryContainer && summary) {
      evalSummaryContainer.innerHTML = `
        ประมาณการ: <b id="eval-kcal" style="color: #FF6B8B;">${currentCalories}</b> kcal • เกรด <span id="eval-score" style="background: ${SCORE_COLORS[currentScore] || '#2196F3'}; color: white; padding: 1px 8px; border-radius: 10px; font-size: 0.8rem;">Grade ${currentScore}</span>
        <div style="font-size: 0.8rem; color: #555; margin-top: 4px; font-style: italic;">"${summary}"</div>
      `;
    }
  };

  // Date Selector Handlers
  const btnDietToday = container.querySelector('#btn-diet-date-today');
  const btnDietYesterday = container.querySelector('#btn-diet-date-yesterday');
  const btnDietCustom = container.querySelector('#btn-diet-date-custom');
  const customDietDateContainer = container.querySelector('#diet-custom-date-container');
  const datetimeDietInput = container.querySelector('#diet_datetime');
  const dietDateBadge = container.querySelector('#diet-date-badge');
  const dietDateBadgeText = container.querySelector('#diet-date-badge-text');

  const updateDietDateButtonsStyle = (activeBtn) => {
    [btnDietToday, btnDietYesterday, btnDietCustom].forEach(btn => {
      if (!btn) return;
      if (btn === activeBtn) {
        btn.style.background = '#FF9EAA';
        btn.style.color = 'white';
        btn.style.borderColor = '#FF9EAA';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#666';
        btn.style.borderColor = '#FFC0CB';
      }
    });
  };

  const checkAndShowDietDateBadge = (selectedDate) => {
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = selectedDate.toDateString() === yesterday.toDateString();

    if (isToday) {
      dietDateBadge.style.display = 'none';
    } else if (isYesterday) {
      dietDateBadgeText.innerText = 'บันทึกย้อนหลังของเมื่อวาน (ระบบจะคำนวณแต้มสุขภาพย้อนหลังให้อัตโนมัติ ✨)';
      dietDateBadge.style.display = 'block';
    } else {
      const dateStr = selectedDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      dietDateBadgeText.innerText = `บันทึกย้อนหลังวันที่ ${dateStr} (ระบบจะคำนวณแต้มสุขภาพย้อนหลังให้อัตโนมัติ ✨)`;
      dietDateBadge.style.display = 'block';
    }
  };

  btnDietToday?.addEventListener('click', () => {
    updateDietDateButtonsStyle(btnDietToday);
    customDietDateContainer.style.display = 'none';
    const currentNow = new Date();
    datetimeDietInput.value = toDatetimeLocalValue(currentNow);
    dietDateBadge.style.display = 'none';
  });

  btnDietYesterday?.addEventListener('click', () => {
    updateDietDateButtonsStyle(btnDietYesterday);
    customDietDateContainer.style.display = 'none';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    datetimeDietInput.value = toDatetimeLocalValue(yesterday);
    checkAndShowDietDateBadge(yesterday);
  });

  btnDietCustom?.addEventListener('click', () => {
    updateDietDateButtonsStyle(btnDietCustom);
    customDietDateContainer.style.display = 'block';
    const curDate = new Date(datetimeDietInput.value || Date.now());
    checkAndShowDietDateBadge(curDate);
  });

  datetimeDietInput?.addEventListener('change', () => {
    const curDate = new Date(datetimeDietInput.value);
    if (!isNaN(curDate.getTime())) {
      checkAndShowDietDateBadge(curDate);
    }
  });

  // Photo Selector & Scan AI Handlers
  const photoInput = container.querySelector('#diet-photo-input');
  const btnSelectPhoto = container.querySelector('#btn-select-photo');
  const btnScanAI = container.querySelector('#btn-scan-ai');
  const previewContainer = container.querySelector('#photo-preview-container');
  const previewImg = container.querySelector('#photo-preview');
  const aiStatusText = container.querySelector('#ai-status-text');

  btnSelectPhoto?.addEventListener('click', () => photoInput?.click());

  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      previewImg.src = URL.createObjectURL(file);
      previewContainer.style.display = 'block';
      btnScanAI.style.display = 'inline-block';
      aiStatusText.style.display = 'block';
      aiStatusText.innerText = 'พร้อมสแกนวิเคราะห์ด้วย Gemini AI แล้วค่ะ ✨';
    }
  });

  btnScanAI?.addEventListener('click', async () => {
    if (!selectedFile) return;
    btnScanAI.disabled = true;
    btnScanAI.innerText = '⏳ กำลังวิเคราะห์...';
    aiStatusText.innerText = 'โค้ชเหมียว 🐱 กำลังวิเคราะห์รูปอาหารของคุณ...';

    const result = await analyzeFoodImage(selectedFile);
    btnScanAI.disabled = false;
    btnScanAI.innerText = '✨ สแกนรูปด้วย Gemini AI';

    if (result) {
      aiResultData = result;
      if (result.food_name) container.querySelector('#food_name').value = result.food_name;
      updateEvaluationBadge(result.calories || 0, result.score || 'B', result.summary || '');
      aiStatusText.innerText = `วิเคราะห์สำเร็จ: ${result.summary || ''}`;
    }
  });

  // Text AI Estimation Handler
  container.querySelector('#btn-text-ai')?.addEventListener('click', async () => {
    const foodNameInput = container.querySelector('#food_name');
    const foodName = foodNameInput?.value?.trim();

    if (!foodName) {
      showToast('กรุณากรอกชื่ออาหารก่อนกดประเมินค่ะ', 'warning');
      foodNameInput?.focus();
      return;
    }

    const btnTextAI = container.querySelector('#btn-text-ai');
    btnTextAI.disabled = true;
    btnTextAI.innerText = '⏳ กำลังประเมิน...';

    const result = await analyzeFoodText(foodName);
    btnTextAI.disabled = false;
    btnTextAI.innerText = '🤖 AI ประเมิน';

    if (result) {
      aiResultData = result;
      updateEvaluationBadge(result.calories || 0, result.score || 'B', result.summary || '');
    }
  });

  // Form Submit Handler
  const form = container.querySelector('#diet-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = container.querySelector('#btn-submit-diet');
    submitBtn.disabled = true;
    submitBtn.innerText = 'กำลังบันทึก...';

    const selectedMeal = container.querySelector('input[name="meal_type"]:checked')?.value || 'lunch';
    const foodName = container.querySelector('#food_name')?.value;
    const loggedAtVal = datetimeDietInput?.value;

    const res = await logDiet({
      meal_type: selectedMeal,
      food_name: foodName,
      calories: currentCalories,
      score: currentScore,
      image_file: selectedFile,
      ai_analysis: aiResultData,
      logged_at: loggedAtVal ? new Date(loggedAtVal).toISOString() : null
    });

    submitBtn.disabled = false;
    submitBtn.innerText = 'บันทึกมื้ออาหาร 🥗';

    if (res.success && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Render Diet Items with Signed Image URLs
  const dietListContainer = container.querySelector('#diet-list');
  if (dietListContainer && state.dietLogs.length > 0) {
    (async () => {
      const itemsHtml = await Promise.all(state.dietLogs.map(async (log) => {
        const mealObj = MEAL_TYPES.find(m => m.id === log.meal_type) || { name: log.meal_type, emoji: '🥗' };
        const scoreColor = SCORE_COLORS[log.score] || '#888';
        const signedUrl = log.image_url ? await getSignedImageUrl(log.image_url) : null;
        const loggedDate = new Date(log.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF5F7; padding: 12px 15px; border-radius: 14px; border-left: 4px solid #FF9EAA;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${signedUrl ? `
                <img src="${signedUrl}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
              ` : `
                <div style="font-size: 1.8rem; background: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  ${mealObj.emoji}
                </div>
              `}
              <div>
                <div style="font-weight: bold; color: #333; font-size: 0.95rem;">
                  ${log.food_name} (${log.calories} kcal)
                  <span style="font-size: 0.75rem; color: white; background: ${scoreColor}; padding: 2px 8px; border-radius: 10px; margin-left: 6px; font-weight: normal;">
                    Grade ${log.score}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: #777; margin-top: 2px;">
                  ${mealObj.name} • ${loggedDate}
                </div>
              </div>
            </div>

            <button class="btn-delete-diet" data-id="${log.id}" title="ลบรายการ" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #FF6B6B; padding: 4px;">
              🗑️
            </button>
          </div>
        `;
      }));

      dietListContainer.innerHTML = itemsHtml.join('');

      // Delete Event Listeners
      dietListContainer.querySelectorAll('.btn-delete-diet').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('คุณต้องการลบรายการอาหารนี้ใช่หรือไม่?')) {
            const res = await deleteDietLog(id);
            if (res.success && typeof onUpdateCallback === 'function') {
              onUpdateCallback();
            }
          }
        });
      });
    })();
  }
}
