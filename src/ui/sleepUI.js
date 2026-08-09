import { state } from '../store/state.js';
import { logSleep, deleteSleepLog, analyzeSleepImage } from '../modules/sleep.js';
import { getSignedImageUrl } from '../modules/storage.js';

const QUALITY_OPTIONS = [
  { id: 'poor', name: '🔴 แย่ (พักผ่อนไม่เพียงพอ)', color: '#F44336' },
  { id: 'fair', name: '🟡 ปานกลาง (ตื่นมายังเพลีย)', color: '#FF9800' },
  { id: 'good', name: '🟢 ดี (หลับสนิทตลอดคืน)', color: '#4CAF50' },
  { id: 'excellent', name: '🌟 ดีมาก (สดชื่นกระปรี้กระเปร่า)', color: '#9C27B0' }
];

function toDatetimeLocalString(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function renderSleepSection(container, onUpdateCallback) {
  let selectedFile = null;
  const now = new Date();
  const defaultWake = toDatetimeLocalString(now);
  const yesterdayBed = new Date(now.getTime() - 8 * 60 * 60 * 1000);
  const defaultSleep = toDatetimeLocalString(yesterdayBed);

  container.innerHTML = `
    <div class="sleep-section" style="margin-top: 20px; text-align: left;">
      <!-- Sleep Form Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>😴</span> บันทึกการนอนหลับ
        </h3>

        <!-- Optional Sleep Screenshot Upload & Scan Area -->
        <div style="background: #FFF5F7; border: 2px dashed #FF9EAA; border-radius: 16px; padding: 15px; text-align: center; margin-bottom: 15px;">
          <input type="file" id="sleep-photo-input" accept="image/*" style="display: none;">
          <div id="sleep-preview-container" style="display: none; margin-bottom: 10px;">
            <img id="sleep-preview" style="max-height: 160px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
          </div>
          <button type="button" id="btn-select-sleep-photo" style="background: white; border: 1.5px solid #FF9EAA; color: #FF6B8B; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
            📱 สกรีนช็อตแอปการนอน (ถ้ามี)
          </button>
          <button type="button" id="btn-scan-sleep-ai" style="display: none; background: #FF9EAA; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: bold; cursor: pointer; margin-left: 8px; font-family: 'Kanit';">
            ✨ สแกนด้วย Gemini AI
          </button>
          <p id="sleep-ai-status" style="font-size: 0.8rem; color: #888; margin-top: 6px; display: none;"></p>
        </div>

        <form id="sleep-form">
          <!-- Sleep & Wake Times -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
            <div>
              <label for="sleep_time" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                เวลาเข้านอน 🌙
              </label>
              <input type="datetime-local" id="sleep_time" value="${defaultSleep}" required style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.9rem; box-sizing: border-box;">
            </div>

            <div>
              <label for="wake_time" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                เวลาตื่นนอน ☀️
              </label>
              <input type="datetime-local" id="wake_time" value="${defaultWake}" required style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.9rem; box-sizing: border-box;">
            </div>
          </div>

          <!-- Duration Preview -->
          <div style="background: #FFF5F7; border-radius: 12px; padding: 10px; text-align: center; margin-bottom: 15px; border: 1px solid #FFE0E6;">
            <span style="font-size: 0.9rem; color: #666;">ระยะเวลานอนรวม: </span>
            <span id="calculated-duration" style="font-size: 1.1rem; font-weight: bold; color: #FF9EAA;">8.00 ชั่วโมง</span>
          </div>

          <!-- Sleep Quality -->
          <div style="margin-bottom: 15px;">
            <label for="sleep_quality" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              คุณภาพการนอนหลับ
            </label>
            <select id="sleep_quality" style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box; background: white;">
              ${QUALITY_OPTIONS.map(q => `
                <option value="${q.id}" ${q.id === 'good' ? 'selected' : ''}>${q.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Note -->
          <div style="margin-bottom: 18px;">
            <label for="sleep_note" style="display: block; font-size: 0.9rem; font-weight: bold; color: #555; margin-bottom: 6px;">
              บันทึกเพิ่มเติม (ถ้ามี)
            </label>
            <input type="text" id="sleep_note" placeholder="เช่น ฝันดี ไม่ตื่นกลางดึก" style="width: 100%; padding: 10px; border: 1.5px solid #FFC0CB; border-radius: 12px; font-size: 0.95rem; box-sizing: border-box;">
          </div>

          <button type="submit" id="btn-submit-sleep" style="width: 100%; background: #FF9EAA; color: white; border: none; padding: 12px; border-radius: 14px; font-size: 1rem; font-weight: bold; cursor: pointer; font-family: 'Kanit', sans-serif;">
            บันทึกการนอนหลับ 😴
          </button>
        </form>
      </div>

      <!-- Sleep Log History Cards -->
      <div class="history-card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive;">
          📋 ประวัติการนอนหลับ (${state.sleepLogs.length})
        </h3>

        ${state.sleepLogs.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 30px 10px;">
            <div style="font-size: 2.5rem; margin-bottom: 8px;">😴</div>
            <p>ยังไม่มีบันทึกการนอนหลับ</p>
          </div>
        ` : `
          <div id="sleep-list" style="display: flex; flex-direction: column; gap: 10px;">
            <!-- Items injected asynchronously -->
          </div>
        `}
      </div>
    </div>
  `;

  // Real-time Duration Calculator
  const sleepInput = container.querySelector('#sleep_time');
  const wakeInput = container.querySelector('#wake_time');
  const durationText = container.querySelector('#calculated-duration');

  const updateDuration = () => {
    const s = new Date(sleepInput?.value);
    const w = new Date(wakeInput?.value);
    if (!isNaN(s.getTime()) && !isNaN(w.getTime()) && w > s) {
      const hours = ((w - s) / (1000 * 60 * 60)).toFixed(2);
      durationText.innerText = `${hours} ชั่วโมง`;
    } else {
      durationText.innerText = 'โปรดระบุช่วงเวลาให้ถูกต้อง';
    }
  };

  sleepInput?.addEventListener('change', updateDuration);
  wakeInput?.addEventListener('change', updateDuration);

  // Photo Selector Handlers
  const photoInput = container.querySelector('#sleep-photo-input');
  const btnSelectPhoto = container.querySelector('#btn-select-sleep-photo');
  const btnScanAI = container.querySelector('#btn-scan-sleep-ai');
  const previewContainer = container.querySelector('#sleep-preview-container');
  const previewImg = container.querySelector('#sleep-preview');
  const aiStatusText = container.querySelector('#sleep-ai-status');

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
    aiStatusText.innerText = 'โค้ชเหมียว 🐱 กำลังอ่านสกรีนช็อตการนอนของคุณ...';

    const result = await analyzeSleepImage(selectedFile);
    btnScanAI.disabled = false;
    btnScanAI.innerText = '✨ สแกนด้วย Gemini AI';

    if (result) {
      if (result.sleep_time) sleepInput.value = toDatetimeLocalString(result.sleep_time);
      if (result.wake_time) wakeInput.value = toDatetimeLocalString(result.wake_time);
      if (result.quality) container.querySelector('#sleep_quality').value = result.quality;
      if (result.summary) container.querySelector('#sleep_note').value = result.summary;
      updateDuration();
      aiStatusText.innerText = 'วิเคราะห์สำเร็จ สกัดข้อมูลเรียบร้อยแล้วค่ะ ✨';
    }
  });

  // Form Submit Handler
  const form = container.querySelector('#sleep-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = container.querySelector('#btn-submit-sleep');
    submitBtn.disabled = true;
    submitBtn.innerText = 'กำลังบันทึก...';

    const sleepTime = sleepInput?.value;
    const wakeTime = wakeInput?.value;
    const quality = container.querySelector('#sleep_quality')?.value;
    const note = container.querySelector('#sleep_note')?.value;

    const res = await logSleep({
      sleep_time: sleepTime,
      wake_time: wakeTime,
      quality,
      raw_text: note,
      image_file: selectedFile
    });

    submitBtn.disabled = false;
    submitBtn.innerText = 'บันทึกการนอนหลับ 😴';

    if (res.success && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Render Sleep Items with Signed Image URLs
  const sleepListContainer = container.querySelector('#sleep-list');
  if (sleepListContainer && state.sleepLogs.length > 0) {
    (async () => {
      const itemsHtml = await Promise.all(state.sleepLogs.map(async (log) => {
        const qualityObj = QUALITY_OPTIONS.find(q => q.id === log.quality) || { name: log.quality, color: '#888' };
        const signedUrl = log.image_url ? await getSignedImageUrl(log.image_url) : null;
        const sleepDateStr = new Date(log.sleep_time).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' });
        const wakeDateStr = new Date(log.wake_time).toLocaleString('th-TH', { timeStyle: 'short' });

        return `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF5F7; padding: 12px 15px; border-radius: 14px; border-left: 4px solid #FF9EAA;">
            <div style="display: flex; align-items: center; gap: 12px;">
              ${signedUrl ? `
                <img src="${signedUrl}" style="width: 50px; height: 50px; border-radius: 10px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
              ` : `
                <div style="font-size: 1.8rem; background: white; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                  😴
                </div>
              `}
              <div>
                <div style="font-weight: bold; color: #333; font-size: 0.95rem;">
                  นอน ${log.duration_hours} ชั่วโมง
                  <span style="font-size: 0.75rem; color: white; background: ${qualityObj.color}; padding: 2px 8px; border-radius: 10px; margin-left: 6px; font-weight: normal;">
                    ${log.quality}
                  </span>
                </div>
                <div style="font-size: 0.8rem; color: #777; margin-top: 2px;">
                  ${sleepDateStr} - ${wakeDateStr} ${log.raw_text ? `• "${log.raw_text}"` : ''}
                </div>
              </div>
            </div>

            <button class="btn-delete-sleep" data-id="${log.id}" title="ลบรายการ" style="background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #FF6B6B; padding: 4px;">
              🗑️
            </button>
          </div>
        `;
      }));

      sleepListContainer.innerHTML = itemsHtml.join('');

      // Delete Event Listeners
      sleepListContainer.querySelectorAll('.btn-delete-sleep').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          if (confirm('คุณต้องการลบรายการนอนหลับนี้ใช่หรือไม่?')) {
            const res = await deleteSleepLog(id);
            if (res.success && typeof onUpdateCallback === 'function') {
              onUpdateCallback();
            }
          }
        });
      });
    })();
  }
}
