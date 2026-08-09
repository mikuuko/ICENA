import { state } from '../store/state.js';
import { logDiet, deleteDietLog, analyzeFoodImage } from '../modules/diet.js';
import { getSignedImageUrl } from '../modules/storage.js';

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

export function renderDietSection(container, onUpdateCallback) {
  let selectedFile = null;
  let aiResultData = {};

  container.innerHTML = `
    <div class="diet-section" style="margin-top: 20px; text-align: left;">
      <!-- Diet Form Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🥗</span> บันทึกมื้ออาหาร (Gemini AI Vision 🤖)
        </h3>

        <!-- Photo Upload & Scan Area -->
        <div style="background: #FFF5F7; border: 2px dashed #FF9EAA; border-radius: 16px; padding: 15px; text-align: center; margin-bottom: 15px;">
          <input type="file" id="diet-photo-input" accept="image/*" style="display: none;">
          <div id="photo-preview-container" style="display: none; margin-bottom: 10px;">
            <img id="photo-preview" style="max-height: 180px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
          <button type="button" id="btn-select-photo" style="background: white; border: 1.5px solid #FF9EAA; color: #FF6B8B; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
            📸 เลือกรูปอาหาร
          </button>
          <button type="button" id="btn-scan-ai" style="display: none; background: #FF9EAA; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-left: 8px; font-family: 'Kanit';">
            ✨ สแกนด้วย Gemini AI
          </button>
          <p id="ai-status-text" style="font-size: 0.8rem; color: #888; margin-top: 6px; display: none;"></p>
        </div>

        <form id="diet-form">
          <!-- Meal Type -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 8px;">
              ประเภทมื้ออาหาร
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
              ${MEAL_TYPES.map((m, idx) => `
                <label style="cursor: pointer;">
                  <input type="radio" name="meal_type" value="${m.id}" ${idx === 0 ? 'checked' : ''} style="display: none;" class="meal-type-radio">
                  <div class="meal-pill" style="border: 2px solid #FF9EAA; border-radius: 12px; padding: 8px 4px; text-align: center; font-size: 0.8rem; font-weight: 500; transition: all 0.2s;">
                    <div style="font-size: 1.2rem;">${m.emoji}</div>
                    <div style="margin-top: 2px;">${m.name}</div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Food Name & Calories -->
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div>
              <label for="food_name" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                ชื่ออาหาร
              </label>
              <input type="text" id="food_name" placeholder="เช่น ข้าวมันไก่" required style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box;">
            </div>

            <div>
              <label for="calories" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                แคลอรี (kcal)
              </label>
              <input type="number" id="calories" min="0" value="450" required style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box;">
            </div>
          </div>

          <!-- Score -->
          <div style="margin-bottom: 18px;">
            <label for="score" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              เกรดคุณค่าอาหาร
            </label>
            <select id="score" style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box; background: white;">
              <option value="A">Grade A 🌟 ดีมาก (คลีน/เฮลตี้)</option>
              <option value="B" selected>Grade B 👍 ดี (มีคุณค่าทางโภชนาการ)</option>
              <option value="C">Grade C ⚠️ ปานกลาง (แป้ง/ไขมันสูง)</option>
              <option value="D">Grade D 🍔 ควรระวัง (ของทอด/หวานจัด)</option>
            </select>
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

  // Photo Selector Handlers
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

  // Scan AI Handler
  btnScanAI?.addEventListener('click', async () => {
    if (!selectedFile) return;
    btnScanAI.disabled = true;
    btnScanAI.innerText = '⏳ กำลังวิเคราะห์...';
    aiStatusText.innerText = 'โค้ชเหมียว 🐱 กำลังวิเคราะห์โภชนาการอาหารของคุณ...';

    const result = await analyzeFoodImage(selectedFile);
    btnScanAI.disabled = false;
    btnScanAI.innerText = '✨ สแกนด้วย Gemini AI';

    if (result) {
      aiResultData = result;
      if (result.food_name) container.querySelector('#food_name').value = result.food_name;
      if (result.calories) container.querySelector('#calories').value = result.calories;
      if (result.score) container.querySelector('#score').value = result.score;
      aiStatusText.innerText = `วิเคราะห์สำเร็จ: ${result.summary || ''}`;
    } else {
      aiStatusText.innerText = 'การวิเคราะห์ล้มเหลว กรุณากรอกข้อมูลเองนะคะ';
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
    const calories = container.querySelector('#calories')?.value;
    const score = container.querySelector('#score')?.value;

    const res = await logDiet({
      meal_type: selectedMeal,
      food_name: foodName,
      calories,
      score,
      image_file: selectedFile,
      ai_analysis: aiResultData
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
