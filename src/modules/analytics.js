import { supabase } from '../supabase.js';
import { state } from '../store/state.js';
import { showToast } from '../ui/toast.js';
import { callGeminiAPI } from './gemini.js';

// Calculate Activity Heatmap data for last N days
export function getActivityHeatmapData(daysCount = 30) {
  const result = [];
  const today = new Date();

  // Create date map from workouts
  const durationByDate = {};
  const countByDate = {};

  (state.workouts || []).forEach(w => {
    if (w.logged_at) {
      const dStr = new Date(w.logged_at).toISOString().split('T')[0];
      durationByDate[dStr] = (durationByDate[dStr] || 0) + (w.duration_minutes || 0);
      countByDate[dStr] = (countByDate[dStr] || 0) + 1;
    }
  });

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const duration = durationByDate[dateStr] || 0;
    const count = countByDate[dateStr] || 0;

    let intensityLevel = 0;
    if (duration >= 60) intensityLevel = 4;
    else if (duration >= 45) intensityLevel = 3;
    else if (duration >= 30) intensityLevel = 2;
    else if (duration > 0) intensityLevel = 1;

    const dayName = d.toLocaleDateString('th-TH', { weekday: 'short' });
    const dayNumber = d.getDate();

    result.push({
      dateStr,
      dayName,
      dayNumber,
      durationMinutes: duration,
      count,
      intensityLevel
    });
  }

  return result;
}

// Calculate summary health metrics
export function getHealthMetricsSummary() {
  const now = new Date();
  const weekAgoMs = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  const recentWorkouts = (state.workouts || []).filter(w => new Date(w.logged_at).getTime() >= weekAgoMs);
  const totalWorkoutMinutes = recentWorkouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);

  const recentSleep = (state.sleepLogs || []).filter(s => new Date(s.logged_at).getTime() >= weekAgoMs);
  const avgSleepHours = recentSleep.length > 0
    ? (recentSleep.reduce((sum, s) => sum + (s.duration_hours || 0), 0) / recentSleep.length).toFixed(1)
    : '0';

  const recentDiet = (state.dietLogs || []).filter(d => new Date(d.logged_at).getTime() >= weekAgoMs);
  const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
  recentDiet.forEach(d => {
    if (gradeCounts[d.score] !== undefined) gradeCounts[d.score]++;
  });

  return {
    weeklyWorkoutCount: recentWorkouts.length,
    totalWorkoutMinutes,
    avgSleepHours,
    weeklyDietCount: recentDiet.length,
    gradeCounts
  };
}

// Load latest Doctor Report from Supabase
export async function loadLatestDoctorReport() {
  if (!state.user) return null;

  try {
    const { data, error } = await supabase
      .from('doctor_reports')
      .select('*')
      .eq('user_id', state.user.id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching doctor report:', error);
      return null;
    }

    state.latestDoctorReport = data || null;
    return state.latestDoctorReport;
  } catch (err) {
    console.error('Unexpected error loading doctor report:', err);
    return null;
  }
}

// Generate AI Doctor Report using Gemini
export async function generateDoctorReport() {
  const metrics = getHealthMetricsSummary();
  const streak = state.gameState.streak || 0;
  const userName = state.profile?.display_name || 'คุณผู้ใช้';

  try {
    const prompt = `คุณคือ "โค้ชเหมียว 🐱" แพทย์ผู้เชี่ยวชาญและวิเคราะห์สุขภาพประจำแอป ICENA จงวิเคราะห์ข้อมูลสุขภาพของคุณ ${userName} ในช่วง 7 วันที่ผ่านมาดังนี้:
- ออกกำลังกายรวม: ${metrics.weeklyWorkoutCount} ครั้ง (${metrics.totalWorkoutMinutes} นาที)
- ออกกำลังกายต่อเนื่อง (Streak): ${streak} วัน
- เวลานอนหลับเฉลี่ย: ${metrics.avgSleepHours} ชั่วโมง/คืน
- บันทึกมื้ออาหาร: ${metrics.weeklyDietCount} มื้อ (เกรด A: ${metrics.gradeCounts.A}, B: ${metrics.gradeCounts.B}, C: ${metrics.gradeCounts.C}, D: ${metrics.gradeCounts.D})

จงประเมินผลและตอบกลับเป็น JSON เท่านั้น โดยไม่ต้องมีข้อความเปิดปิดหรือ Markdown codeblock formatting ใดๆ โครงสร้าง JSON:
{
  "grade": "A",
  "summary": "คำประเมินภาพรวมสุขภาพน่ารักๆ จากโค้ชเหมียว (2-3 ประโยค)",
  "recommendations": [
    "ข้อแนะนำด้านการออกกำลังกาย 1 ข้อ",
    "ข้อแนะนำด้านโภชนาการ/อาหาร 1 ข้อ",
    "ข้อแนะนำด้านการพักผ่อน 1 ข้อ"
  ]
}
(เกรด grade เลือกจาก 'A': ดีเยี่ยม, 'B': ดี, 'C': ต้องปรับปรุง, 'D': ควรระวังเรื่องสุขภาพ)`;

    const reportData = await callGeminiAPI(prompt);
    if (!reportData) return null;

    state.latestDoctorReport = {
      ...reportData,
      generated_at: new Date().toISOString(),
      user_note: ''
    };

    showToast('สร้างรายงานสุขภาพจากโค้ชเหมียว 🐱 สำเร็จแล้วค่ะ!', 'success');
    return state.latestDoctorReport;
  } catch (err) {
    console.error('Failed to generate doctor report:', err);
    showToast('เกิดข้อผิดพลาดในการสร้างรายงานสุขภาพ', 'error');
    return null;
  }
}

// Update User Note on Doctor Report
export async function updateDoctorReportNote(reportId, note) {
  if (state.latestDoctorReport) {
    state.latestDoctorReport.user_note = note;
  }

  if (!state.user || !reportId) {
    showToast('บันทึกโน้ตเรียบร้อยแล้วค่ะ 📝', 'info');
    return { success: true };
  }

  try {
    const { error } = await supabase
      .from('doctor_reports')
      .update({ user_note: note })
      .eq('id', reportId)
      .eq('user_id', state.user.id);

    if (error) {
      console.error('Failed to update doctor report note:', error);
    }

    showToast('บันทึกโน้ตเรียบร้อยแล้วค่ะ 📝', 'info');
    return { success: true };
  } catch (err) {
    console.error('Unexpected error updating doctor report note:', err);
    return { success: false, error: err };
  }
}
