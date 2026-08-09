import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';

export const BADGE_DEFINITIONS = [
  {
    id: 'first_workout',
    title: 'เริ่มต้นการเดินทาง 🏋️‍♂️',
    description: 'บันทึกการออกกำลังกายครั้งแรก',
    emoji: '🎯',
    check: () => (state.workouts || []).length >= 1
  },
  {
    id: 'streak_7',
    title: 'สายสตรอง 7 วัน 🔥',
    description: 'สะสม Streak การออกกำลังกายครบ 7 วัน',
    emoji: '🔥',
    check: () => (state.gameState.streak || 0) >= 7
  },
  {
    id: 'coin_master',
    title: 'เศรษฐีสุขภาพ 🪙',
    description: 'สะสมเหรียญรวมครบ 1,000 เหรียญ',
    emoji: '👑',
    check: () => (state.gameState.coins || 0) >= 1000
  },
  {
    id: 'healthy_eater',
    title: 'นักกินสายเฮลตี้ 🥗',
    description: 'บันทึกมื้ออาหารเกรด A ครบ 5 ครั้ง',
    emoji: '🥗',
    check: () => (state.dietLogs || []).filter(d => d.score === 'A').length >= 5
  },
  {
    id: 'sleep_king',
    title: 'ราชาแห่งการนอน 😴',
    description: 'บันทึกการนอนหลับ 8+ ชั่วโมง ครบ 3 ครั้ง',
    emoji: '👑',
    check: () => (state.sleepLogs || []).filter(s => s.duration_hours >= 8).length >= 3
  }
];

// Check and unlock new achievements
export async function checkAchievements() {
  if (!state.user) return [];

  const existingBadges = state.gameState.achievements || [];
  const newlyUnlocked = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (!existingBadges.includes(badge.id) && badge.check()) {
      newlyUnlocked.push(badge.id);
    }
  }

  if (newlyUnlocked.length === 0) {
    return existingBadges;
  }

  const updatedBadges = [...existingBadges, ...newlyUnlocked];

  try {
    const { error } = await supabase
      .from('user_game_state')
      .update({
        achievements: updatedBadges,
        updated_at: new Date()
      })
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to update achievements:', error);
      return existingBadges;
    }

    state.gameState.achievements = updatedBadges;

    // Toast for newly unlocked badges
    newlyUnlocked.forEach(badgeId => {
      const b = BADGE_DEFINITIONS.find(item => item.id === badgeId);
      if (b) {
        showToast(`ปลดล็อกความสำเร็จใหม่: ${b.title} ${b.emoji}`, 'success');
      }
    });

    return updatedBadges;
  } catch (err) {
    console.error('Unexpected error checking achievements:', err);
    return existingBadges;
  }
}
