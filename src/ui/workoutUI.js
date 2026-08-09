import { state } from '../store/state.js';
import { logWorkout, deleteWorkout } from '../modules/workouts.js';

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
  container.innerHTML = `
    <div class="workout-section" style="margin-top: 20px; text-align: left;">
      <!-- Log Form Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🏃‍♂️</span> บันทึกการออกกำลังกาย
        </h3>

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
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; justify-content: space-between;">
          <span>📋 ประวัติการออกกำลังกาย (${state.workouts.length})</span>
        </h3>

        ${state.workouts.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 30px 10px;">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">🏋️‍♀️</div>
            <p>ยังไม่มีรายการบันทึกการออกกำลังกาย</p>
            <p style="font-size: 0.85rem;">เริ่มออกกำลังกายแล้วบันทึกเพื่อสะสมเหรียญกันเถอะ!</p>
          </div>
        ` : `
          <div class="workout-list" style="display: flex; flex-direction: column; gap: 10px;">
            ${state.workouts.map(w => {
              const typeObj = WORKOUT_TYPES.find(t => t.id === w.type) || { name: w.type, emoji: '🏋️‍♂️' };
              const intensityObj = INTENSITY_OPTIONS.find(i => i.id === w.intensity) || { name: w.intensity, color: '#888' };
              const loggedDate = new Date(w.logged_at).toLocaleString('th-TH', {
                dateStyle: 'short',
                timeStyle: 'short'
              });

              return `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF5F7; padding: 12px 15px; border-radius: 14px; border-left: 4px solid #FF9EAA;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 1.8rem; background: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                      ${typeObj.emoji}
                    </div>
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
            }).join('')}
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
      note
    });

    submitBtn.disabled = false;
    submitBtn.innerText = 'บันทึกและรับเหรียญ 🪙';

    if (res.success && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Delete Handlers
  container.querySelectorAll('.btn-delete-workout').forEach(btn => {
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
}
