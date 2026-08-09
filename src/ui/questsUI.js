import { state } from '../store/state.js';
import { MILESTONES, claimMilestone, getWeeklyQuestsProgress, claimQuestReward } from '../modules/streak.js';
import { getUserCoupons } from '../modules/coupon.js';
import { BADGE_DEFINITIONS } from '../modules/achievements.js';

export function renderQuestsSection(container, onUpdateCallback) {
  const currentStreak = state.gameState.streak || 0;
  const claimedMilestones = state.gameState.milestone_claims || [];
  const weeklyQuests = getWeeklyQuestsProgress();
  const coupons = getUserCoupons();
  const unlockedBadges = state.gameState.achievements || [];

  // Determine current streak multiplier
  let streakMultiplier = 1.0;
  if (currentStreak >= 30) streakMultiplier = 2.5;
  else if (currentStreak >= 14) streakMultiplier = 2.0;
  else if (currentStreak >= 7) streakMultiplier = 1.5;
  else if (currentStreak >= 3) streakMultiplier = 1.2;

  container.innerHTML = `
    <div class="quests-section" style="margin-top: 20px; text-align: left;">
      <!-- Streak Banner Card -->
      <div style="background: linear-gradient(135deg, #FF6B8B, #FF9EAA); color: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(255,107,139,0.3); margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 0.85rem; opacity: 0.9;">สถิติออกกำลังกายต่อเนื่อง</div>
          <div style="font-size: 1.8rem; font-weight: bold; font-family: 'Mali', cursive; margin-top: 4px;">
            🔥 ${currentStreak} วันต่อเนื่อง!
          </div>
          <div style="font-size: 0.8rem; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 12px; display: inline-block; margin-top: 6px;">
            ตัวคูณเหรียญปัจจุบัน: <b>x${streakMultiplier}</b>
          </div>
        </div>
        <div style="font-size: 3.2rem;">🏆</div>
      </div>

      <!-- Milestone Bonuses Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🎁</span> โบนัส Streak (Milestones)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${MILESTONES.map(m => {
            const isUnlocked = currentStreak >= m.days;
            const isClaimed = claimedMilestones.includes(m.days);

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; background: ${isUnlocked ? '#FFF5F7' : '#F9F9F9'}; padding: 12px 15px; border-radius: 14px; border: 1px solid ${isUnlocked ? '#FFC0CB' : '#EEE'};">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div style="font-size: 1.5rem;">${isClaimed ? '✅' : (isUnlocked ? '🎉' : '🔒')}</div>
                  <div>
                    <div style="font-weight: bold; color: #333; font-size: 0.95rem;">
                      Streak ครบ ${m.label}
                    </div>
                    <div style="font-size: 0.8rem; color: #FF9EAA; font-weight: bold; margin-top: 2px;">
                      +${m.reward} เหรียญ 🪙
                    </div>
                  </div>
                </div>

                <button class="btn-claim-milestone" data-days="${m.days}" ${(!isUnlocked || isClaimed) ? 'disabled' : ''} style="background: ${isClaimed ? '#CCCCCC' : (isUnlocked ? '#FF9EAA' : '#E0E0E0')}; color: white; border: none; padding: 8px 14px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; cursor: ${isUnlocked && !isClaimed ? 'pointer' : 'default'}; font-family: 'Kanit'; transition: all 0.2s;">
                  ${isClaimed ? 'เคลมแล้ว' : (isUnlocked ? 'รับโบนัส 🎁' : `สะสมอีก ${m.days - currentStreak} วัน`)}
                </button>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Weekly Quests Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🎯</span> ภารกิจประจำสัปดาห์ (Weekly Quests)
        </h3>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${weeklyQuests.map(q => {
            const percent = Math.min(100, Math.round((q.current / q.goal) * 100));

            return `
              <div style="background: #FFF5F7; padding: 14px; border-radius: 14px; border-left: 4px solid #FF9EAA;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <div style="font-weight: bold; color: #333; font-size: 0.95rem; display: flex; align-items: center; gap: 6px;">
                    <span>${q.emoji}</span> ${q.title}
                  </div>
                  <div style="font-weight: bold; color: #FF9EAA; font-size: 0.85rem;">
                    +${q.reward} 🪙
                  </div>
                </div>

                <!-- Progress Bar -->
                <div style="background: #EFEFEF; border-radius: 10px; height: 10px; overflow: hidden; margin-bottom: 10px;">
                  <div style="background: #FF9EAA; width: ${percent}%; height: 100%; border-radius: 10px; transition: width 0.3s;"></div>
                </div>

                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 0.8rem; color: #777;">ความคืบหน้า: ${q.current} / ${q.goal} (${percent}%)</span>
                  <button class="btn-claim-quest" data-id="${q.id}" ${(!q.isCompleted || q.isClaimed) ? 'disabled' : ''} style="background: ${q.isClaimed ? '#CCCCCC' : (q.isCompleted ? '#FF9EAA' : '#E0E0E0')}; color: white; border: none; padding: 6px 12px; border-radius: 10px; font-size: 0.8rem; font-weight: bold; cursor: ${q.isCompleted && !q.isClaimed ? 'pointer' : 'default'}; font-family: 'Kanit';">
                    ${q.isClaimed ? 'รับรางวัลแล้ว' : (q.isCompleted ? 'รับรางวัล 🎉' : 'กำลังดำเนินการ')}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Earned Coupons Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🎟️</span> คูปองส่วนลดที่ได้รับ (${coupons.length})
        </h3>

        ${coupons.length === 0 ? `
          <div style="text-align: center; color: #aaa; padding: 20px 10px;">
            <div style="font-size: 2rem; margin-bottom: 6px;">🎟️</div>
            <p>ยังไม่มีคูปองส่วนลด</p>
            <p style="font-size: 0.8rem;">ออกกำลังกาย 15+ นาที เพื่อรับคูปอง (สูงสุด 3 ใบ/เดือน)</p>
          </div>
        ` : `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
            ${coupons.map(c => `
              <div style="background: linear-gradient(135deg, #FFF0F4, #FFE5EC); border: 2px dashed #FF9EAA; border-radius: 14px; padding: 12px; text-align: center; position: relative;">
                <div style="font-size: 1.1rem; font-weight: bold; color: #FF6B8B;">${c.title}</div>
                <div style="font-size: 0.8rem; background: white; border-radius: 8px; padding: 2px 6px; font-family: monospace; display: inline-block; margin-top: 6px; color: #555;">
                  ${c.code}
                </div>
                <div style="font-size: 0.75rem; color: #888; margin-top: 6px;">
                  ${c.is_used ? '❌ ใช้งานแล้ว' : '🎟️ พร้อมใช้งาน'}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Achievements Collection Card -->
      <div class="card" style="background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #FFE0E6;">
        <h3 style="color: #FF6B8B; margin-bottom: 15px; font-family: 'Mali', cursive; display: flex; align-items: center; gap: 8px;">
          <span>🎖️</span> ตราสัญลักษณ์ความสำเร็จ (${unlockedBadges.length}/${BADGE_DEFINITIONS.length})
        </h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px;">
          ${BADGE_DEFINITIONS.map(b => {
            const isUnlocked = unlockedBadges.includes(b.id);

            return `
              <div style="background: ${isUnlocked ? '#FFF5F7' : '#FAFAFA'}; border: 1.5px solid ${isUnlocked ? '#FF9EAA' : '#EAEAEA'}; border-radius: 14px; padding: 12px; text-align: center; filter: ${isUnlocked ? 'none' : 'grayscale(90%)'}; opacity: ${isUnlocked ? '1' : '0.6'};">
                <div style="font-size: 2.2rem; margin-bottom: 6px;">${isUnlocked ? b.emoji : '🔒'}</div>
                <div style="font-weight: bold; font-size: 0.85rem; color: ${isUnlocked ? '#FF6B8B' : '#777'};">
                  ${b.title}
                </div>
                <div style="font-size: 0.75rem; color: #888; margin-top: 4px;">
                  ${b.description}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;

  // Milestone Claim Event Listeners
  container.querySelectorAll('.btn-claim-milestone').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const days = parseInt(e.currentTarget.getAttribute('data-days'), 10);
      const res = await claimMilestone(days);
      if (res.success && typeof onUpdateCallback === 'function') {
        onUpdateCallback();
      }
    });
  });

  // Quest Claim Event Listeners
  container.querySelectorAll('.btn-claim-quest').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const questId = e.currentTarget.getAttribute('data-id');
      const res = await claimQuestReward(questId);
      if (res.success && typeof onUpdateCallback === 'function') {
        onUpdateCallback();
      }
    });
  });
}
