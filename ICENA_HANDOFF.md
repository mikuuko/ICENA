# 🚀 ICENA — Project Handoff Brief
# อ่านไฟล์นี้ก่อนทำอะไรทุกอย่าง

> สร้างโดย: แชทก่อนหน้า | วันที่: 2026-08-09
> ไฟล์นี้คือ Single Source of Truth สำหรับการสร้าง ICENA ตั้งแต่ต้น

---

## 🎯 สิ่งที่กำลังสร้าง

**ICENA** — แอปออกกำลังกายสำหรับคู่รัก 2 คน (ออย + ไอซ์)
ทดแทน FitQuest v2 ที่มีปัญหา โดยสร้างใหม่ด้วย architecture ที่ดีกว่า

### ผู้ใช้
- **ออย (Oil)** — ชาย เจ้าของโปรเจค
- **ไอซ์ (Ice)** — หญิง แฟนออย

---

## ⚙️ Tech Stack ที่ตัดสินใจแล้ว

| รายการ | คำตอบ | เหตุผล |
|:-------|:------|:-------|
| **Framework** | **Vite + ES Modules** | import/export จริง, hot reload, แยกไฟล์ได้ชัดเจน |
| **Backend** | **Supabase (โปรเจคใหม่)** | Project ID: `sxmpsrlysmxuldqyridd` |
| **Design** | เอาจาก FitQuest v2 มาใช้ แต่ clean code ใหม่ | ไม่ต้องออกแบบใหม่ประหยัดเวลา |
| **AI Vision** | **Gemini API (ฟรี)** | มี API Key แล้ว วิเคราะห์รูปอาหารจริง |
| **Weekly Reset** | **Supabase Edge Function** | รันอัตโนมัติทุกวันจันทร์ ไม่ต้องเปิดแอป |
| **โฟลเดอร์โปรเจค** | `C:\Users\User\Desktop\ICENA` | สร้างโฟลเดอร์แล้ว |

---

## 📁 โครงสร้างไฟล์ที่วางแผนไว้

```
ICENA/
├── index.html                  ← หน้าเดียว (SPA)
├── package.json
├── vite.config.js
├── .env                        ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY
├── .env.example
├── supabase/
│   └── schema.sql              ← schema ใหม่ (แก้ bug จาก v2 ทั้งหมด)
└── src/
    ├── main.js                 ← entry point: initApp, onAuthStateChange
    ├── supabase.js             ← สร้าง Supabase client
    ├── store/
    │   └── state.js            ← ตัวแปร global ทั้งหมด (source of truth)
    ├── modules/
    │   ├── auth.js             ← signIn, signUp, signOut
    │   ├── workouts.js         ← logWorkout, deleteWorkout, loadWorkouts
    │   ├── diet.js             ← logDiet, deleteDietLog, uploadDietPhoto
    │   ├── sleep.js            ← logSleep, deleteSleepLog
    │   ├── coins.js            ← calculateCoins, loadCoinBalance
    │   ├── streak.js           ← recalcStreak, updateStreakAndQuests, claimMilestone
    │   ├── shop.js             ← openPurchaseModal, confirmPurchase, Victory Shop
    │   ├── coupon.js           ← checkAndIssueCoupon, coupon logic
    │   ├── achievements.js     ← checkAchievements, badge definitions
    │   ├── analytics.js        ← renderBarCharts, renderHeatMap, doctor report
    │   └── weekly.js           ← updateWeeklyScore, loadPartnerStats
    ├── ui/
    │   ├── render.js           ← renderDashboard, renderWorkoutTab, etc.
    │   ├── toast.js            ← showToast, showLoading
    │   └── confetti.js         ← startConfetti, animateConfetti
    └── styles/
        └── main.css            ← CSS จาก FitQuest v2 ปรับ clean
```

---

## 🔗 Supabase Information

| รายการ | ข้อมูล |
|:-------|:-------|
| **Project ID** | `sxmpsrlysmxuldqyridd` |
| **Project URL** | `https://sxmpsrlysmxuldqyridd.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/sxmpsrlysmxuldqyridd |
| **Anon Key** | *(ผู้ใช้ต้องคัดลอกจาก Dashboard → Settings → API → "anon public")* |

> ⚠️ **ขั้นตอนแรกสุด Phase 0** — ต้องให้ผู้ใช้วาง anon key ก่อนทำอะไรทั้งนั้น

---

## 🐛 Bug จาก FitQuest v2 ที่ต้องแก้ใน ICENA (อย่าทำซ้ำ!)

### 🔴 Critical — ห้ามทำซ้ำเด็ดขาด

**1. Double Coin Award**
```
❌ v2: RPC award_workout_coins + fallback client insert = เหรียญซ้ำซ้อน
✅ ICENA: ใช้ RPC เท่านั้น ถ้า RPC error → แสดง error ไม่ใช่ insert เอง
```

**2. Historical sync ปนอยู่กับ business logic**
```
❌ v2: syncMissingHistoricalLogs() 474 บรรทัด hardcode ข้อมูล Oil/Ice ใน app.js
✅ ICENA: ไม่มีโค้ดนี้เลย data สะอาดตั้งแต่แรก
```

**3. Profiles RLS อ่าน partner ไม่ได้**
```
❌ v2: policy "profiles: read own" → Victory Shop ไม่รู้ชื่อ partner
✅ ICENA schema ต้องมี:
   create policy "profiles: read all authenticated" on public.profiles
     for select to authenticated using (true);
```

**4. Ice inject ซ้ำทุก load**
```
❌ v2: ใช้ workouts table เช็ค diet/sleep Ice → inject ซ้ำ
✅ ICENA: ไม่มีโค้ดนี้เลย
```

### 🟠 Medium — ต้องแก้

**5. Victory Shop async ไม่ถูก await**
```
❌ v2: renderVictoryShopItems(items); // ไม่มี await
✅ ICENA: await renderVictoryShopItems(items);
```

**6. deleteWorkout ไม่ update streak/weekly score**
```
❌ v2: ลบ workout แล้ว streak ไม่ recalculate
✅ ICENA: deleteWorkout() → recalcStreak() → updateWeeklyScore() → updateDB()
```

**7. streakMultiplier แสดงใน UI แต่ไม่คูณเหรียญจริง**
```
❌ v2: streakMultiplier() มีแค่ใน dashboard ไม่ได้ใช้ใน calculateCoins
✅ ICENA: calculateCoins(duration, intensity, streak) → คูณ multiplier เสมอ
```

**8. checkWeeklyReset ไม่ update total_weekly_losses ใน memory**
```
❌ v2: ลืมบรรทัด myWeeklyStats.total_weekly_losses = newLosses;
✅ ICENA: อัปเดตทุก field หลัง weekly reset ครบ
```

**9. doctor_reports user insert เองได้ → ปลอม grade ได้**
```
❌ v2: authenticated user insert doctor_reports ได้เลย
✅ ICENA: ลบ INSERT policy → insert ได้เฉพาะ service_role (AI doctor task)
          user แก้ได้เฉพาะ user_note field ผ่าน UPDATE
```

---

## 🗄️ Schema ที่ต้องสร้าง (สรุปย่อ)

```sql
-- ตารางหลัก 10 ตาราง (เหมือน v2 แต่แก้ bug)
public.profiles          -- + policy "read all authenticated"
public.workouts          -- + image_url text ตั้งแต่แรก
public.sleep_logs        -- + image_url text, raw_text text ตั้งแต่แรก
public.diet_logs         -- + image_url text ตั้งแต่แรก
public.coin_transactions -- Append-only (ห้าม UPDATE/DELETE)
public.user_game_state   -- streak, quests, coupons, achievements
public.user_weekly_stats
public.custom_shop_items
public.victory_redemptions  -- + week_start date ตั้งแต่แรก (ไม่ต้อง migrate)
public.doctor_reports    -- INSERT เฉพาะ service_role

-- RPC Functions
public.award_workout_coins(p_workout_id uuid) -- server-side เท่านั้น
```

---

## 💰 ระบบเหรียญ (Coin System)

### สูตรคำนวณเหรียญออกกำลังกาย
```
coins = duration_minutes × rate × streakMultiplier

rate:
  low    = 1.5
  medium = 2.25
  high   = 2.75

streakMultiplier:
  streak < 3  → 1.0
  streak >= 3  → 1.2
  streak >= 7  → 1.5
  streak >= 14 → 2.0
  streak >= 30 → 2.5
```

### Milestone Bonuses
```
3 วัน  → +50 เหรียญ
7 วัน  → +150 เหรียญ
14 วัน → +300 เหรียญ
30 วัน → +600 เหรียญ
60 วัน → +1,200 เหรียญ
```

### Quest Rewards (รายสัปดาห์)
```
คาร์ดิโอ 5 ครั้ง          → +150 เหรียญ
ออก 45+ นาที ครบ 3 ครั้ง  → +200 เหรียญ
เวทเทรนนิ่ง 2 ครั้ง       → +100 เหรียญ
```

### Coupon System
```
ออกกำลังกาย >= 15 นาที → ได้คูปอง (สูงสุด 3 ใบ/เดือน)
  15-44 นาที → ลด 10%
  45-59 นาที → ลด 20%
  60+ นาที   → ลด 30%
```

### Default Shop Items
```js
{ id: 'milktea',  emoji: '🥤', name: 'ชานมไข่มุก',     price: 90,  kcal: 450  }
{ id: 'fries',    emoji: '🍟', name: 'เฟรนช์ฟรายส์ชีส', price: 150, kcal: 750  }
{ id: 'sandwich', emoji: '🥪', name: 'แซนวิชแฮมชีส',   price: 80,  kcal: 400  }
{ id: 'pizza',    emoji: '🍕', name: 'พิซซ่าถาดกลาง',  price: 450, kcal: 2250 }
{ id: 'icecream', emoji: '🍦', name: 'ไอศกรีมซันเด',    price: 90,  kcal: 450  }
{ id: 'buffet',   emoji: '🍲', name: 'บุฟเฟ่ต์ชาบู',    price: 500, kcal: 2500 }
```

---

## 🎨 Design System (ต่อยอดจาก FitQuest v2)

```
Theme: Kawaii Cat — Baby Pink + Pastel + Glassmorphism
Primary Color: #FF9EAA (baby pink)
Fonts: Mali, Kanit, Itim, Nunito (Google Fonts)
Avatar: DiceBear — https://api.dicebear.com/7.x/adventurer/svg?seed={name}
Advisor mascot: โค้ชเหมียว 🐱
```

**CSS Reference (copy มาจากนี้):**
`C:\Users\User\Desktop\แอปออกกำลังกาย\fitquest-v2\src\styles.css`

**HTML Reference:**
`C:\Users\User\Desktop\แอปออกกำลังกาย\fitquest-v2\src\index.html`

---

## 🤖 AI Vision (Gemini) สำหรับวิเคราะห์รูปอาหาร

```
Model: gemini-1.5-flash (ฟรี)
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
ใช้เมื่อ: ผู้ใช้อัปโหลดรูปอาหาร → วิเคราะห์เมนู + ประเมินแคลอรี + คะแนนโภชนาการ
```

---

## 📏 กฎสำคัญสำหรับ AI ที่รับไฟล์นี้

1. **ทำทีละเฟสเท่านั้น** อย่ากระโดดข้ามเฟส
2. **อธิบายก่อนทำเสมอ** — บอกว่าจะทำอะไร ทำไม ผลที่จะเห็นคืออะไร
3. **ถามถ้ามีตัวเลือก** — ใช้ ask_question tool ไม่ตัดสินใจแทนผู้ใช้
4. **สรุปท้ายเฟส** — ให้ผู้ใช้ทดสอบ + อนุมัติก่อนไปต่อ
5. **ใช้ภาษาไทย** เป็นกันเอง อ่านเข้าใจง่าย อธิบาย tech term ทุกครั้ง
6. **State ต้องอยู่ใน `src/store/state.js` เท่านั้น**
7. **Coin award ผ่าน RPC เท่านั้น** ห้าม client-side fallback insert
8. **ห้ามใส่ service_role key ใน client code** ใช้ anon key + RLS เท่านั้น

---

## 📋 แผนเฟส (สถานะ)

| เฟส | ชื่อ | สถานะ | หมายเหตุ |
|:----|:-----|:------|:---------|
| **0** | Setup | ⏳ รอเริ่ม | ต้องการ Supabase Anon Key + Gemini API Key จากผู้ใช้ |
| **1** | Database Schema | ⏳ รอ Phase 0 |  |
| **2** | Auth Module | ⏳ รอ Phase 1 |  |
| **3** | State Management | ⏳ รอ Phase 2 |  |
| **4** | Workout Module | ⏳ รอ Phase 3 |  |
| **5** | Health Logging | ⏳ รอ Phase 4 |  |
| **6** | Streak + Quests | ⏳ รอ Phase 5 |  |
| **7** | Shop + Victory Shop | ⏳ รอ Phase 6 |  |
| **8** | Analytics | ⏳ รอ Phase 7 |  |
| **9** | Weekly Competition | ⏳ รอ Phase 8 |  |
| **10** | Polish | ⏳ รอ Phase 9 |  |
| **11** | Deploy | ⏳ รอ Phase 10 |  |

---

## 🚦 สิ่งที่ต้องทำทันทีเมื่ออ่านไฟล์นี้

1. แนะนำตัวกับผู้ใช้ว่ารับไฟล์นี้มาแล้ว เข้าใจสิ่งที่ต้องสร้าง
2. ขอ **Supabase Anon Key** จาก https://supabase.com/dashboard/project/sxmpsrlysmxuldqyridd/settings/api
3. ขอ **Gemini API Key**
4. เมื่อได้ key ทั้งสองแล้ว → เริ่ม Phase 0

---

*ICENA Handoff Brief v1.0 — 2026-08-09*
