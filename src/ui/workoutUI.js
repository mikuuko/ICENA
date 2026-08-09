import { state } from '../store/state.js';
import { logWorkout, deleteWorkout, analyzeWorkoutImage } from '../modules/workouts.js';
import { getSignedImageUrl } from '../modules/storage.js';

const WORKOUT_TYPES = [
  { id: 'cardio', name: 'คาร์ดิโอ', emoji: '🏃‍♂️' },
  { id: 'weight', name: 'เวทเทรนนิ่ง', emoji: '🏋️‍♂️' },
  { id: 'yoga', name: 'โยคะ', emoji: '🧘‍♀️' },
  { id: 'running', name: 'วิ่ง', emoji: '👟' },
  { id: 'cycling', name: 'ปั่นจักรยาน', emoji: '🚴‍♀️' }
];

const INTENSITY_OPTIONS = [
  { id: 'low', name: 'เบาๆ (1.5x)', color: '#4CAF50' },
  { id: 'medium', name: 'ปานกลาง (2.25x)', color: '#FF9800' },
  { id: 'high', name: 'หนักมาก (2.75x)', color: '#F44336' }
];

export function renderWorkoutSection(container, onUpdateCallback) {
  let selectedFile = null;

  container.innerHTML = `
    <div class="workout-section" style="margin-top: 20px; text-align: left;">
      <!-- Log Form Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🏃‍♂️</span> บันทึกการออกกำลังกาย
        </h3>

        <!-- Optional Workout Screenshot Upload & Scan Area -->
        <div style="background: #FFF5F7; border: 2px dashed #FF9EAA; border-radius: 16px; padding: 15px; text-align: center; margin-bottom: 15px;">
          <input type="file" id="workout-photo-input" accept="image/*" style="display: none;">
          <div id="workout-preview-container" style="display: none; margin-bottom: 10px;">
            <img id="workout-preview" style="max-height: 160px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
          <button type="button" id="btn-select-workout-photo" style="background: white; border: 1.5px solid #FF9EAA; color: #FF6B8B; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
            📱 สกรีนช็อตแอปออกกำลังกาย (ถ้ามี)
          </button>
          <button type="button" id="btn-scan-workout-ai" style="display: none; background: #FF9EAA; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-left: 8px; font-family: 'Kanit';">
            ✨ สแกนด้วย Gemini AI
          </button>
          <p id="workout-ai-status" style="font-size: 0.8rem; color: #888; margin-top: 6px; display: none;"></p>
        </div>

        <form id="workout-form">
          <!-- Exercise Type -->
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 8px;">
              ประเภทการออกกำลังกาย
            </label>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 8px;">
              ${WORKOUT_TYPES.map((t, idx) => `
                <label style="cursor: pointer;">
                  <input type="radio" name="workout_type" value="${t.id}" ${idx === 0 ? 'checked' : ''} style="display: none;" class="workout-type-radio">
                  <div class="type-pill" style="border: 2px solid #FF9EAA; border-radius: 12px; padding: 10px 5px; text-align: center; font-size: 0.85rem; font-weight: 500; transition: all 0.2s;">
                    <div style="font-size: 1.4rem;">${t.emoji}</div>
                    <div style="margin-top: 2px;">${t.name}</div>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Duration & Intensity -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div>
              <label for="workout_duration" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                ระยะเวลา (นาที)
              </label>
              <input type="number" id="workout_duration" min="1" max="600" value="30" required style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 1rem; box-sizing: border-box;">
            </div>

            <div>
              <label for="workout_intensity" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                ระดับความเหนื่อย
              </label>
              <select id="workout_intensity" style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box; background: white;">
                ${INTENSITY_OPTIONS.map(opt => `
                  <option value="${opt.id}" ${opt.id === 'medium' ? 'selected' : ''}>${opt.name}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Note -->
          <div style="margin-bottom: 18px;">
            <label for="workout_note" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              บันทึกเพิ่มเติม (ถ้ามี)
            </label>
            <input type="text" id="workout_note" placeholder="เช่น วิ่งรอบสวน หรือ เล่นขา 4 เซ็ต" style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box;">
          </div>

          <button type="submit" id="btn-submit-workout" style="width: 100%; background: #FF9EAA; color: white; border: none; padding: 12px; border-radius: 14px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: background 0.2s; font-family: 'Kanit', sans-serif;">
            บันทึกและรับเหรียญ 🪙
          </button>
        </form>
      </div>

      <!-- Workout History Cards -->
      <div class="history-card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive;">
          📋 ประวัติการออกกำลังกาย (${state.workouts.length})
        </h3>

        ${state.workouts.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 30px 10px;">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">🏋️‍♀️</div>
            <p>ยังไม่มีรายการบันทึกการออกกำลังกาย</p>
            <p style="font-size: 0.85rem;">เริ่มออกกำลังกายแล้วบันทึกเพื่อสะสมเหรียญกันเถอะ!</p>
          </div>
        ` : `
          <div id="workout-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Injected asynchronously -->
          </div>
        `}
      </div>
    </div>
  `;

  // Dynamic Radio Style Update
  const radioInputs = container.querySelectorAll('.workout-type-radio');
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
  const photoInput = container.querySelector('#workout-photo-input');
  const btnSelectPhoto = container.querySelector('#btn-select-workout-photo');
  const btnScanAI = container.querySelector('#btn-scan-workout-ai');
  const previewContainer = container.querySelector('#workout-preview-container');
  const previewImg = container.querySelector('#workout-preview');
  const aiStatusText = container.querySelector('#workout-ai-status');

  btnSelectPhoto?.addEventListener('click', () => photoInput?.click());

  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      selectedFile = file;
      previewImg.src = URL.createObjectURL(file);
      previewContainer.style.display = 'block';
      btnScanAI.style.display = 'inline-block';
      aiStatusText.style.display = 'block';
      aiStatusText.innerText = 'พร้อมสแกนผลสกรีนช็อตด้วย Gemini AI แล้วค่ะ ✨';
    }
  });

  // Scan AI Handler
  btnScanAI?.addEventListener('click', async () => {
    if (!selectedFile) return;
    btnScanAI.disabled = true;
    btnScanAI.innerText = '⏳ กำลังวิเคราะห์...';
    aiStatusText.innerText = 'โค้ชเหมียว 🐱 กำลังอ่านสกรีนช็อตออกกำลังกายของคุณ...';

    const result = await analyzeWorkoutImage(selectedFile);
    btnScanAI.disabled = false;
    btnScanAI.innerText = '✨ สแกนด้วย Gemini AI';

    if (result) {
      if (result.type) {
        const radioToSelect = container.querySelector(`input[name="workout_type"][value="${result.type}"]`);
        if (radioToSelect) {
          radioToSelect.checked = true;
          updateRadioStyles();
        }
      }
      if (result.duration_minutes) container.querySelector('#workout_duration').value = result.duration_minutes;
      if (result.intensity) container.querySelector('#workout_intensity').value = result.intensity;
      if (result.note) container.querySelector('#workout_note').value = result.note;
      aiStatusText.innerText = 'วิเคราะห์สำเร็จ สกัดข้อมูลเรียบร้อยแล้วค่ะ ✨';
    }
  });

  // Form Submit Handler
  const form = container.querySelector('#workout-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = container.querySelector('#btn-submit-workout');
    submitBtn.disabled = true;
    submitBtn.innerText = 'กำลังบันทึกและคำนวณเหรียญ...';

    const selectedType = container.querySelector('input[name="workout_type"]:checked')?.value || 'cardio';
    const duration = container.querySelector('#workout_duration')?.value;
    const intensity = container.querySelector('#workout_intensity')?.value;
    const note = container.querySelector('#workout_note')?.value;

    const res = await logWorkout({
      type: selectedType,
      duration_minutes: duration,
      intensity,
      note,
      image_file: selectedFile
    });

    submitBtn.disabled = false;
    submitBtn.innerText = 'บันทึกและรับเหรียญ 🪙';

    if (res.success && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Render Workout Items with Signed Image URLs
  const workoutListContainer = container.querySelector('#workout-list');
  if (workoutListContainer && state.workouts.length > 0) {
    (async () => {
      const itemsHtml = await Promise.all(state.workouts.map(async (w) => {
        const typeObj = WORKOUT_TYPES.find(t => t.id === w.type) || { name: w.type, emoji: '🏋️‍♂️' };
        const intensityObj = INTENSITY_OPTIONS.find(i => i.id === w.intensity) || { name: w.intensity, color: '#888' };
        const signedUrl = w.image_url ? await getSignedImageUrl(w.image_url) : null;
        const loggedDate = new Date(w.logged_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF5F7; padding: 12px 15px; border-radius: 14px; border-left: 4px solid #FF9EAA;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${signedUrl ? `
                <img src="${signedUrl}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
              ` : `
                <div style="font-size: 1.8rem; background: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  ${typeObj.emoji}
                </div>
              `}
              <div>
                <div style="font-weight: bold; color: #333; font-size: 0.95rem;">
                  ${typeObj.name} (${w.duration_minutes} นาที)
                  <span style="font-size: 0.75rem; color: white; background: ${intensityObj.color}; padding: 2px 8px; border-radius: 10px; margin-left: 6px; font-weight: normal;">
                    ${w.intensity}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: #777; margin-top: 2px;">
                  ${loggedDate} ${w.note ? `• "${w.note}"` : ''}
                </div>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="text-align: right;">
                <div style="font-weight: bold; color: #FF9EAA; font-size: 0.95rem;">
                  +${w.coins_earned || 0} 🪙
                </div>
              </div>
              <button class="btn-delete-workout" data-id="${w.id}" title="ลบรายการ" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #FF6B6B; padding: 4px;">
                🗑️
              </button>
            </div>
          </div>
        `;
      }));

      workoutListContainer.innerHTML = itemsHtml.join('');

      // Delete Event Listeners
      workoutListContainer.querySelectorAll('.btn-delete-workout').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const workoutId = e.currentTarget.getAttribute('data-id');
          if (confirm('คุณต้องการลบรายการออกกำลังกายนี้ใช่หรือไม่?')) {
            const res = await deleteWorkout(workoutId);
            if (res.success && typeof onUpdateCallback === 'function') {
              onUpdateCallback();
            }
          }
        });
      });
    })();
  }
}
