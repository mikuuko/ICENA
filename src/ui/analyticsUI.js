import { state } from '../store/state.js';
import {
  getActivityHeatmapData,
  getHealthMetricsSummary,
  generateDoctorReport,
  updateDoctorReportNote,
  loadLatestDoctorReport
} from '../modules/analytics.js';

const GRADE_COLORS = {
  A: '#4CAF50',
  B: '#2196F3',
  C: '#FF9800',
  D: '#F44336'
};

const INTENSITY_COLORS = {
  0: '#EFEFEF',
  1: '#FFE0E6',
  2: '#FFB7C5',
  3: '#FF9EAA',
  4: '#FF6B8B'
};

export function renderAnalyticsSection(container, onUpdateCallback) {
  const heatmapData = getActivityHeatmapData(30);
  const metrics = getHealthMetricsSummary();
  const report = state.latestDoctorReport;

  container.innerHTML = `
    <div class="analytics-section" style="margin-top: 20px; text-align: left;">
      <!-- Activity Heatmap Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 12px; font-family: 'Mali', cursive; display: flex; align-items: center; justify-content: space-between;">
          <span>📅 Activity Heatmap (30 วันล่าสุด)</span>
        </h3>
        <p style="font-size: 0.8rem; color: #888; margin-bottom: 15px;">
          ระดับสีเข้มขึ้นตามระยะเวลาการออกกำลังกายในแต่ละวัน
        </p>

        <!-- Heatmap Grid -->
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 15px;">
          ${heatmapData.map(item => `
            <div style="background: ${INTENSITY_COLORS[item.intensityLevel]}; border-radius: 12px; padding: 8px; text-align: center; border: 1px solid rgba(0,0,0,0.03); transition: transform 0.2s;" title="${item.dateStr}: ${item.durationMinutes} นาที (${item.count} ครั้ง)">
              <div style="font-size: 0.7rem; color: ${item.intensityLevel >= 3 ? 'white' : '#666'}; font-weight: 500;">
                ${item.dayName}
              </div>
              <div style="font-size: 0.95rem; font-weight: bold; color: ${item.intensityLevel >= 3 ? 'white' : '#333'}; margin-top: 2px;">
                ${item.dayNumber}
              </div>
              <div style="font-size: 0.65rem; color: ${item.intensityLevel >= 3 ? 'rgba(255,255,255,0.9)' : '#888'}; margin-top: 2px;">
                ${item.durationMinutes > 0 ? `${item.durationMinutes}m` : '-'}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Heatmap Color Legend -->
        <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px; font-size: 0.75rem; color: #777;">
          <span>น้อย</span>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${INTENSITY_COLORS[0]};"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${INTENSITY_COLORS[1]};"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${INTENSITY_COLORS[2]};"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${INTENSITY_COLORS[3]};"></div>
          <div style="width: 12px; height: 12px; border-radius: 3px; background: ${INTENSITY_COLORS[4]};"></div>
          <span>มาก</span>
        </div>
      </div>

      <!-- Weekly Health Metrics Summary Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive;">
          📊 สรุปสุขภาพรอบ 7 วันที่ผ่านมา
        </h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px;">
          <div style="background: #FFF5F7; border-radius: 14px; padding: 12px; text-align: center;">
            <div style="font-size: 1.5rem;">🏃‍♂️</div>
            <div style="font-size: 1.1rem; font-weight: bold; color: #FF9EAA; margin-top: 2px;">
              ${metrics.weeklyWorkoutCount} ครั้ง
            </div>
            <div style="font-size: 0.75rem; color: #888;">${metrics.totalWorkoutMinutes} นาทีรวม</div>
          </div>

          <div style="background: #FFF5F7; border-radius: 14px; padding: 12px; text-align: center;">
            <div style="font-size: 1.5rem;">😴</div>
            <div style="font-size: 1.1rem; font-weight: bold; color: #FF9EAA; margin-top: 2px;">
              ${metrics.avgSleepHours} ชม.
            </div>
            <div style="font-size: 0.75rem; color: #888;">เฉลี่ยต่อคืน</div>
          </div>

          <div style="background: #FFF5F7; border-radius: 14px; padding: 12px; text-align: center;">
            <div style="font-size: 1.5rem;">🥗</div>
            <div style="font-size: 1.1rem; font-weight: bold; color: #FF9EAA; margin-top: 2px;">
              ${metrics.weeklyDietCount} มื้อ
            </div>
            <div style="font-size: 0.75rem; color: #888;">
              A:${metrics.gradeCounts.A} B:${metrics.gradeCounts.B} C:${metrics.gradeCounts.C} D:${metrics.gradeCounts.D}
            </div>
          </div>
        </div>
      </div>

      <!-- AI Doctor Report Card (Coach Meow 🐱) -->
      <div class="card" style="background: linear-gradient(135deg, #FFF0F4, #FFE5EC); border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 2px solid #FF9EAA;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
          <h3 style="color: #FF6B8B; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px; margin: 0;">
            <span>🐱</span> รายงานประเมินสุขภาพจากโค้ชเหมียว
          </h3>
          <button id="btn-generate-report" style="background: #FF9EAA; color: white; border: none; padding: 8px 14px; border-radius: 12px; font-weight: bold; cursor: pointer; font-family: 'Kanit'; font-size: 0.85rem;">
            ✨ สร้างรายงาน AI
          </button>
        </div>

        ${!report ? `
          <div style="text-align: center; color: #888; padding: 30px 10px; background: white; border-radius: 16px;">
            <div style="font-size: 2.8rem; margin-bottom: 8px;">🩺</div>
            <p>ยังไม่มีรายงานประเมินสุขภาพ</p>
            <p style="font-size: 0.85rem;">กดปุ่ม "✨ สร้างรายงาน AI" ด้านบนเพื่อเริ่มวิเคราะห์สุขภาพกับโค้ชเหมียว 🐱</p>
          </div>
        ` : `
          <div style="background: white; border-radius: 16px; padding: 18px;">
            <!-- Grade & Date -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span style="font-size: 0.8rem; color: #888;">
                สร้างเมื่อ: ${new Date(report.generated_at || Date.now()).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
              <span style="background: ${GRADE_COLORS[report.grade] || '#FF9EAA'}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 0.95rem;">
                เกรดสุขภาพ: ${report.grade}
              </span>
            </div>

            <!-- Summary -->
            <div style="background: #FFF5F7; border-left: 4px solid #FF9EAA; border-radius: 8px; padding: 12px; font-size: 0.9rem; color: #444; margin-bottom: 15px; line-height: 1.5;">
              "${report.summary}"
            </div>

            <!-- Recommendations -->
            <div style="margin-bottom: 18px;">
              <div style="font-weight: bold; color: #FF6B8B; font-size: 0.9rem; margin-bottom: 8px;">
                📌 ข้อแนะนำพัฒนาสุขภาพจากโค้ชเหมียว:
              </div>
              <ul style="margin: 0; padding-left: 20px; font-size: 0.85rem; color: #555; display: flex; flex-direction: column; gap: 6px;">
                ${(report.recommendations || []).map(r => `<li>${r}</li>`).join('')}
              </ul>
            </div>

            <!-- User Note Section (Editable by user) -->
            <div style="border-top: 1px dashed #FFE0E6; padding-top: 12px;">
              <label for="doctor-report-note" style="display: block; font-size: 0.85rem; font-weight: bold; color: #555; margin-bottom: 6px;">
                📝 โน้ตส่วนตัวของคุณ (สำหรับทบทวน):
              </label>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="doctor-report-note" value="${report.user_note || ''}" placeholder="บันทึกความรู้สึก หรือเป้าหมายถัดไป" style="flex: 1; padding: 8px 12px; border: 1px solid #FFC0CB; border-radius: 10px; font-size: 0.85rem;">
                <button id="btn-save-note" data-id="${report.id || ''}" style="background: #FF9EAA; color: white; border: none; padding: 8px 14px; border-radius: 10px; font-size: 0.85rem; font-weight: bold; cursor: pointer; font-family: 'Kanit';">
                  บันทึก 📝
                </button>
              </div>
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  // Generate Doctor Report Handler
  container.querySelector('#btn-generate-report')?.addEventListener('click', async () => {
    const btn = container.querySelector('#btn-generate-report');
    btn.disabled = true;
    btn.innerText = '⏳ กำลังประเมิน...';

    const res = await generateDoctorReport();
    btn.disabled = false;
    btn.innerText = '✨ สร้างรายงาน AI';

    if (res && typeof onUpdateCallback === 'function') {
      onUpdateCallback();
    }
  });

  // Save Note Handler
  container.querySelector('#btn-save-note')?.addEventListener('click', async (e) => {
    const reportId = e.currentTarget.getAttribute('data-id');
    const note = container.querySelector('#doctor-report-note')?.value;
    await updateDoctorReportNote(reportId, note);
  });
}
