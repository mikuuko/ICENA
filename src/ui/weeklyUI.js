import { state } from '../store/state.js';
import { getWeeklyBattleData, getWeeklyHistory } from '../modules/weekly.js';

export function renderWeeklySection(container, onUpdateCallback) {
  const profileName = state.profile?.display_name || 'คุณ';
  const partnerName = state.partnerProfile?.display_name || 'คู่ของคุณ';

  container.innerHTML = `
    <div class="weekly-section" style="margin-top: 20px; text-align: left;">
      <!-- Weekly Battle Header Card -->
      <div style="background: linear-gradient(135deg, #FF6B8B, #FF9EAA); color: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(255,107,139,0.3); margin-bottom: 25px; text-align: center;">
        <div style="font-size: 0.85rem; opacity: 0.95;">การแข่งขันรายสัปดาห์</div>
        <h2 style="font-family: 'Mali', cursive; margin: 4px 0 8px 0; font-size: 1.6rem;">
          ⚔️ ${profileName} VS ${partnerName}
        </h2>
        <p style="font-size: 0.8rem; opacity: 0.9; margin: 0;">
          คะแนนมาจากการออกกำลังกาย (นาที) + การนอน (ชม.x10) + เกรดอาหาร
        </p>
      </div>

      <!-- Live Battle Container -->
      <div id="battle-container" style="margin-bottom: 25px;">
        <div style="text-align: center; color: #aaa; padding: 20px;">⏳ กำลังคำนวณคะแนนสดการแข่งขัน...</div>
      </div>

      <!-- Past Weekly Champions History Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; justify-content: space-between;">
          <span>👑 ประวัติแชมป์รายสัปดาห์</span>
          <button id="btn-refresh-history" style="background: none; border: none; font-size: 1.1rem; cursor: pointer;">🔄</button>
        </h3>

        <div id="history-container">
          <div style="text-align: center; color: #aaa; padding: 15px;">⏳ กำลังดึงประวัติแชมป์...</div>
        </div>
      </div>
    </div>
  `;

  // Fetch Live Battle Data
  (async () => {
    const battle = await getWeeklyBattleData();
    const battleContainer = container.querySelector('#battle-container');

    if (battleContainer && battle) {
      const myScore = battle.myBreakdown.totalScore;
      const partnerScore = battle.partnerBreakdown.totalScore;
      const totalCombined = Math.max(1, myScore + partnerScore);
      const myPct = Math.round((myScore / totalCombined) * 100);
      const partnerPct = 100 - myPct;

      let statusBadgeHtml = '';
      if (battle.isTied) {
        statusBadgeHtml = `
          <div style="background: #2196F3; color: white; padding: 10px 15px; border-radius: 14px; text-align: center; font-weight: bold; margin-bottom: 15px;">
            🤝 คะแนนเสมอกันอยู่! (0 คะแนน)
          </div>
        `;
      } else if (battle.isLeading) {
        statusBadgeHtml = `
          <div style="background: linear-gradient(135deg, #4CAF50, #81C784); color: white; padding: 12px 15px; border-radius: 14px; text-align: center; font-weight: bold; margin-bottom: 15px; box-shadow: 0 4px 10px rgba(76,175,80,0.2);">
            👑 คุณกำลังนำอยู่! (+${battle.diff} คะแนน) ✨
          </div>
        `;
      } else {
        statusBadgeHtml = `
          <div style="background: linear-gradient(135deg, #FF9800, #FFB74D); color: white; padding: 12px 15px; border-radius: 14px; text-align: center; font-weight: bold; margin-bottom: 15px;">
            🔥 คุณตามหลังอยู่ ${battle.diff} คะแนน! (เร่งออกกำลังกายด่วน) 🏃‍♂️
          </div>
        `;
      }

      battleContainer.innerHTML = `
        ${statusBadgeHtml}

        <!-- VS Comparison Progress Bar -->
        <div style="background: white; border-radius: 16px; padding: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #FFE0E6; margin-bottom: 15px;">
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: bold; color: #444; margin-bottom: 8px;">
            <span>${profileName}: ${myScore} pts</span>
            <span>${partnerName}: ${partnerScore} pts</span>
          </div>
          <div style="height: 14px; background: #FFF0F4; border-radius: 10px; overflow: hidden; display: flex;">
            <div style="width: ${myPct}%; background: #FF9EAA; transition: width 0.5s;"></div>
            <div style="width: ${partnerPct}%; background: #9ECAFF; transition: width 0.5s;"></div>
          </div>
        </div>

        <!-- 2 Battle Cards Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <!-- Your Card -->
          <div style="background: white; border-radius: 18px; padding: 15px; border: 2px solid ${battle.isLeading ? '#FF9EAA' : '#FFE0E6'}; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <div style="text-align: center; margin-bottom: 10px;">
              <div style="font-size: 2rem;">👤</div>
              <div style="font-weight: bold; color: #333; font-size: 0.95rem;">${profileName}</div>
              <div style="font-size: 1.4rem; font-weight: bold; color: #FF9EAA; margin-top: 2px;">${myScore} <span style="font-size: 0.8rem;">pts</span></div>
            </div>
            <div style="font-size: 0.75rem; color: #666; display: flex; flex-direction: column; gap: 4px; border-top: 1px dashed #FFE0E6; padding-top: 8px;">
              <div>🏃‍♂️ ออกกำลัง: <b>${battle.myBreakdown.workoutMins}</b>m</div>
              <div>😴 การนอน: <b>${battle.myBreakdown.sleepHours}</b>h (${battle.myBreakdown.sleepScore}pts)</div>
              <div>🥗 อาหาร: <b>${battle.myBreakdown.dietPoints}</b>pts</div>
            </div>
          </div>

          <!-- Partner Card -->
          <div style="background: white; border-radius: 18px; padding: 15px; border: 2px solid ${!battle.isLeading && !battle.isTied ? '#9ECAFF' : '#EAEAEA'}; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
            <div style="text-align: center; margin-bottom: 10px;">
              <div style="font-size: 2rem;">💕</div>
              <div style="font-weight: bold; color: #333; font-size: 0.95rem;">${partnerName}</div>
              <div style="font-size: 1.4rem; font-weight: bold; color: #5C6BC0; margin-top: 2px;">${partnerScore} <span style="font-size: 0.8rem;">pts</span></div>
            </div>
            <div style="font-size: 0.75rem; color: #666; display: flex; flex-direction: column; gap: 4px; border-top: 1px dashed #EAEAEA; padding-top: 8px;">
              <div>🏃‍♂️ ออกกำลัง: <b>${battle.partnerBreakdown.workoutMins}</b>m</div>
              <div>😴 การนอน: <b>${battle.partnerBreakdown.sleepHours}</b>h (${battle.partnerBreakdown.sleepScore}pts)</div>
              <div>🥗 อาหาร: <b>${battle.partnerBreakdown.dietPoints}</b>pts</div>
            </div>
          </div>
        </div>
      `;
    }
  })();

  // Fetch History List
  const loadHistoryUI = async () => {
    const historyContainer = container.querySelector('#history-container');
    if (!historyContainer) return;

    const history = await getWeeklyHistory();

    if (history.length === 0) {
      historyContainer.innerHTML = `
        <div style="text-align: center; color: #aaa; padding: 15px 10px; font-size: 0.85rem;">
          ยังไม่มีประวัติการแข่งขันที่สรุปผล ระบบจะสรุปผลอัตโนมัติทุกวันจันทร์ค่ะ 🏆
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${history.map(item => `
          <div style="display: flex; align-items: center; justify-content: space-between; background: #FFF5F7; padding: 10px 14px; border-radius: 12px; border: 1px solid #FFE0E6;">
            <div>
              <div style="font-size: 0.8rem; color: #888;">สัปดาห์: ${item.week_start}</div>
              <div style="font-size: 0.85rem; font-weight: bold; color: #333; margin-top: 2px;">
                คะแนน: ${item.user1_score} VS ${item.user2_score}
              </div>
            </div>
            <div style="background: #FF9EAA; color: white; padding: 4px 10px; border-radius: 10px; font-size: 0.8rem; font-weight: bold;">
              👑 ผู้ชนะ
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  loadHistoryUI();

  container.querySelector('#btn-refresh-history')?.addEventListener('click', () => {
    loadHistoryUI();
  });
}
