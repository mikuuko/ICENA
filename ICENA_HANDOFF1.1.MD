# 🚀 ICENA — Project Handoff Brief (v1.1 — Reviewed by Claude)
# อ่านไฟล์นี้ก่อนทำอะไรทุกอย่าง

> เขียนต้นฉบับโดย: Claude Sonnet 4.6 บน Antigravity IDE | วันที่: 2026-08-09
> ปรับปรุงโดย: Claude (Sonnet 5) | วันที่: 2026-08-09
> ไฟล์นี้คือ Single Source of Truth สำหรับการสร้าง ICENA ตั้งแต่ต้น
> **ไฟล์นี้จะถูกส่งให้ Gemini 3.6 Flash (High) เป็นคนดำเนินการสร้างจริงใน Antigravity IDE**

---

## 📝 สิ่งที่แก้ไขจากฉบับเดิม (v1.0 → v1.1)

| จุด | ปัญหาเดิม | แก้เป็น |
|:----|:----------|:--------|
| Gemini model | `gemini-1.5-flash` — **ปลดระวางแล้ว ยิง request ได้ 404** | `gemini-3.5-flash-lite` — ฟรี เร็ว ยังไม่มีกำหนดปลด |
| RLS scope | แก้แค่ policy ของ `profiles` | generalize ให้ครอบคลุมทุกตารางที่ weekly competition / victory shop ต้องอ่านข้ามคน |
| Storage | ไม่ได้พูดถึงเลย | เพิ่ม private bucket + RLS + signed URL |
| Deployment | ไม่ได้ระบุ | Cloudflare Pages (frontend) + Supabase Edge Function (backend, deploy แยก) |
| Version control | ไม่ได้พูดถึง | เพิ่มเป็นขั้นตอนแรกสุดของ Phase 0 |

---

## 🎯 สิ่งที่กำลังสร้าง

**ICENA** — แอปออกกำลังกายสำหรับคู่รัก 2 คน (ออย + ไอซ์)
ทดแทน FitQuest v2 ที่มีปัญหา โดยสร้างใหม่ด้วย architecture ที่ดีกว่า

### ผู้ใช้
- **ออย (Oil)** — ชาย เจ้าของโปรเจค
- **ไอซ์ (Ice)** — หญิง แฟนออย

> หมายเหตุสำคัญสำหรับผู้ดำเนินการ: **แอปนี้มีผู้ใช้แค่ 2 คนตลอดชีพของโปรเจค** เพราะฉะนั้น RLS policy หลายจุดใช้แนวทาง "authenticated ทุกคนอ่านได้ แก้ได้เฉพาะของตัวเอง" แทนการทำระบบ friend/partner-linking ที่ซับซ้อน — เป็นการตัดสินใจที่ตั้งใจ ไม่ใช่ security hole

---

## ⚙️ Tech Stack ที่ตัดสินใจแล้ว

| รายการ | คำตอบ | เหตุผล |
|:-------|:------|:-------|
| **Framework** | **Vite + ES Modules** | import/export จริง, hot reload, แยกไฟล์ได้ชัดเจน |
| **Backend** | **Supabase (โปรเจคใหม่)** | Project ID: `sxmpsrlysmxuldqyridd` |
| **Design** | เอาจาก FitQuest v2 มาใช้ แต่ clean code ใหม่ | ไม่ต้องออกแบบใหม่ประหยัดเวลา |
| **AI Vision** | **Gemini API — `gemini-3.5-flash-lite`** | ฟรี เร็ว ยังไม่มีกำหนดปลดระวาง (ต่างจาก 2.5-flash ที่จะปลด ต.ค. 2026) |
| **Weekly Reset** | **Supabase Edge Function** | รันอัตโนมัติทุกวันจันทร์ ไม่ต้องเปิดแอป |
| **Image Storage** | **Supabase Storage — private bucket** | รูปอาหาร/ออกกำลังกาย เก็บแบบ private + เข้าถึงผ่าน signed URL |
| **Deployment (Frontend)** | **Cloudflare Pages** เชื่อมกับ GitHub repo | push → auto deploy, ฟรี, มี env var management ในตัว |
| **Deployment (Backend)** | **Supabase Edge Function** deploy ผ่าน Supabase CLI (แยกจาก Cloudflare) | Edge Function รันบน infra ของ Supabase ไม่ใช่ Cloudflare |
| **โฟลเดอร์โปรเจค** | `C:\Users\User\Desktop\ICENA` | สร้างโฟลเดอร์แล้ว |

> ⚠️ **ข้อควรระวังเรื่อง Gemini model ในอนาคต**: วงการ Gemini API เปลี่ยนรุ่น/ปลดระวางโมเดลบ่อยมาก (2.0 → 2.5 → 3.x ภายในปีเดียว) ถ้า Gemini 3.6 Flash เจอ error 404 ตอนเรียก API ระหว่างทำ Phase ไหนก็ตาม ให้ **เช็ค https://ai.google.dev/gemini-api/docs/models ก่อน** ว่ารุ่นที่ใช้ยังมีอยู่ไหม แล้วอัปเดต model string ในโค้ด — อย่าเดาเอง

---

## 📁 โครงสร้างไฟล์ที่วางแผนไว้

```
ICENA/
├── .git/                       ← init ตั้งแต่ Phase 0 (ดูหัวข้อ Version Control)
├── .gitignore                  ← ต้องมี .env, node_modules
├── index.html                  ← หน้าเดียว (SPA)
├── package.json
├── vite.config.js
├── .env                        ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY
├── .env.example
├── supabase/
│   ├── schema.sql              ← schema ใหม่ (แก้ bug จาก v2 ทั้งหมด)
│   └── functions/
│       └── weekly-reset/       ← Edge Function, deploy แยกผ่าน Supabase CLI
└── src/
    ├── main.js                 ← entry point: initApp, onAuthStateChange
    ├── supabase.js             ← สร้าง Supabase client
    ├── store/
    │   └── state.js            ← ตัวแปร global ทั้งหมด (source of truth)
    ├── modules/
    │   ├── auth.js             ← signIn, signUp, signOut
    │   ├── workouts.js         ← logWorkout, deleteWorkout, loadWorkouts
    │   ├── diet.js             ← logDiet, deleteDietLog, uploadDietPhoto
    │   ├── sleep.js             ← logSleep, deleteSleepLog
    │   ├── coins.js             ← calculateCoins, loadCoinBalance
    │   ├── streak.js            ← recalcStreak, updateStreakAndQuests, claimMilestone
    │   ├── shop.js              ← openPurchaseModal, confirmPurchase, Victory Shop
    │   ├── coupon.js            ← checkAndIssueCoupon, coupon logic
    │   ├── achievements.js      ← checkAchievements, badge definitions
    │   ├── storage.js           ← uploadImage, getSignedUrl (ใหม่)
    │   ├── analytics.js         ← renderBarCharts, renderHeatMap, doctor report
    │   └── weekly.js            ← updateWeeklyScore, loadPartnerStats
    ├── ui/
    │   ├── render.js            ← renderDashboard, renderWorkoutTab, etc.
    │   ├── toast.js             ← showToast, showLoading
    │   └── confetti.js          ← startConfetti, animateConfetti
    └── styles/
        └── main.css             ← CSS จาก FitQuest v2 ปรับ clean
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

## 🗂️ Version Control (ใหม่ — ต้องทำเป็นอันดับแรกใน Phase 0)

```
1. git init ในโฟลเดอร์ ICENA
2. สร้าง .gitignore ที่มี: node_modules/, .env, dist/
3. commit แรกทันทีหลังสร้างโครงไฟล์เปล่า (ก่อนเริ่มเขียน logic)
4. commit ทุกจบ Phase (ไม่ใช่ทุกไฟล์) — ทำให้ rollback เป็นรายเฟสได้
5. ถ้าผู้ใช้มี GitHub account → สร้าง repo แล้ว push ไว้ (จำเป็นอยู่แล้วสำหรับ Cloudflare Pages auto-deploy)
```

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

**3. Cross-user read policy ไม่ครอบคลุมพอ (ขยายจากเดิม)**
```
❌ v2: policy "profiles: read own" → Victory Shop ไม่รู้ชื่อ partner
❌ v2 (จุดเสี่ยงที่ยังไม่ถูกแก้ในไฟล์ต้นฉบับ): แม้ profiles จะแก้แล้ว
   แต่ weekly competition และ Victory Shop ยังต้องอ่านข้ามคนจากตารางอื่นด้วย
   เช่น user_weekly_stats, workouts, diet_logs, sleep_logs — ถ้าไม่แก้ policy
   ของตารางเหล่านี้ด้วย จะเจอบั๊กแบบเดียวกันซ้ำอีกในจุดอื่น

✅ ICENA ต้องมี policy "read all authenticated" บน "ทุกตาราง" ที่ฟีเจอร์
   ต่อไปนี้ต้องอ่านข้ามคน: profiles, user_weekly_stats, workouts,
   diet_logs, sleep_logs, user_game_state (เฉพาะ field ที่ต้องโชว์ เช่น
   streak/coins ไม่ใช่ทุก field)

   ตัวอย่าง pattern (ใช้ซ้ำกับทุกตารางข้างบน โดยเปลี่ยนแค่ชื่อตาราง):
   create policy "<table>: read all authenticated" on public.<table>
     for select to authenticated using (true);
   create policy "<table>: write own only" on public.<table>
     for insert to authenticated with check (auth.uid() = user_id);
   create policy "<table>: update own only" on public.<table>
     for update to authenticated using (auth.uid() = user_id);
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

**10. Storage ไม่มีการควบคุมสิทธิ์ (ใหม่ — ป้องกันไว้ก่อนเกิดจริง)**
```
⚠️ ความเสี่ยงถ้าไม่ระบุ: bucket default เป็น public หรือไม่มี RLS
   → ใครก็ตามที่เดา URL ได้ เปิดรูปได้หมด (ไม่เกี่ยวกับ auth เลย)
✅ ICENA: bucket "user-uploads" ตั้งเป็น private
          โครงสร้าง path: {user_id}/{type}/{filename}
          RLS บน storage.objects:
            - SELECT: authenticated ทุกคนอ่านได้ (เหมือน pattern ด้านบน)
            - INSERT/DELETE: เฉพาะเจ้าของ (path prefix ตรงกับ auth.uid())
          Client แสดงรูปผ่าน supabase.storage.from('user-uploads')
            .createSignedUrl(path, 3600) ไม่ใช่ getPublicUrl()
```

---

## 🗄️ Schema ที่ต้องสร้าง (สรุปย่อ)

```sql
-- ตารางหลัก 10 ตาราง (เหมือน v2 แต่แก้ bug)
public.profiles          -- + policy "read all authenticated"
public.workouts          -- + image_url text ตั้งแต่แรก, + policy "read all authenticated"
public.sleep_logs        -- + image_url text, raw_text text, + policy "read all authenticated"
public.diet_logs         -- + image_url text, + policy "read all authenticated"
public.coin_transactions -- Append-only (ห้าม UPDATE/DELETE)
public.user_game_state   -- streak, quests, coupons, achievements, + policy "read all authenticated"
public.user_weekly_stats -- + policy "read all authenticated"
public.custom_shop_items
public.victory_redemptions  -- + week_start date ตั้งแต่แรก (ไม่ต้อง migrate)
public.doctor_reports    -- INSERT เฉพาะ service_role

-- Storage
storage bucket "user-uploads" (private) + RLS ตามหัวข้อ bug #10

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
  streak < 3   → 1.0
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
Model: gemini-3.5-flash-lite (ฟรี, ไม่มีกำหนดปลดระวางในตอนนี้)
Endpoint: https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent
ใช้เมื่อ: ผู้ใช้อัปโหลดรูปอาหาร → วิเคราะห์เมนู + ประเมินแคลอรี + คะแนนโภชนาการ

หมายเหตุ:
- Quota ฟรีเช็คได้ที่ Google AI Studio (aistudio.google.com) → API Keys
- ถ้าเจอ 429 (rate limit) บ่อย ให้เพิ่ม retry-with-backoff ใน storage.js/diet.js
  ไม่ใช่เปลี่ยนไป insert ข้อมูลปลอมแทน
```

---

## ☁️ Deployment Plan (ใหม่)

### Frontend — Cloudflare Pages
```
1. Push โปรเจคขึ้น GitHub (private repo แนะนำ เพราะมี business logic เฉพาะตัว)
2. เชื่อม Cloudflare Pages → GitHub repo
3. Build command: npm run build
4. Output directory: dist
5. Environment variables (ตั้งใน Cloudflare Pages dashboard ไม่ใช่ commit .env):
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_GEMINI_API_KEY
6. ทุก push ไป main branch → auto deploy
```

### Backend — Supabase Edge Function (weekly-reset)
```
⚠️ Edge Function รันบน infra ของ Supabase เอง ไม่เกี่ยวกับ Cloudflare Pages
1. Deploy ผ่าน Supabase CLI: supabase functions deploy weekly-reset
2. ตั้ง cron schedule ผ่าน Supabase Dashboard → Database → Cron Jobs
   (หรือ pg_cron เรียก edge function ทุกวันจันทร์)
3. Secret (service_role key) เก็บใน Supabase Edge Function secrets
   (supabase secrets set) — ห้าม hardcode ในโค้ด และห้ามอยู่ใน repo เด็ดขาด
```

---

## 📏 กฎสำคัญสำหรับ AI ที่รับไฟล์นี้ (Gemini 3.6 Flash)

1. **ทำทีละเฟสเท่านั้น** อย่ากระโดดข้ามเฟส
2. **อธิบายก่อนทำเสมอ** — บอกว่าจะทำอะไร ทำไม ผลที่จะเห็นคืออะไร
3. **ถามถ้ามีตัวเลือก** — ใช้ ask_question tool ไม่ตัดสินใจแทนผู้ใช้
4. **สรุปท้ายเฟส** — ให้ผู้ใช้ทดสอบ + อนุมัติก่อนไปต่อ
5. **ใช้ภาษาไทย** เป็นกันเอง อ่านเข้าใจง่าย อธิบาย tech term ทุกครั้ง
6. **State ต้องอยู่ใน `src/store/state.js` เท่านั้น**
7. **Coin award ผ่าน RPC เท่านั้น** ห้าม client-side fallback insert
8. **ห้ามใส่ service_role key ใน client code** ใช้ anon key + RLS เท่านั้น
9. **ห้ามใช้ getPublicUrl() กับรูปใน bucket** — ใช้ createSignedUrl() เท่านั้น (ดู bug #10)
10. **commit git ทุกจบ Phase** ก่อนขอ approve ไป Phase ถัดไป
11. **ถ้าเรียก Gemini API แล้วเจอ 404** ห้ามเดา model ใหม่เอง ให้หยุดแล้วถามผู้ใช้ พร้อมบอกว่าเช็ค https://ai.google.dev/gemini-api/docs/models แล้ว

---

## 📋 แผนเฟส (สถานะ)

| เฟส | ชื่อ | สถานะ | หมายเหตุ |
|:----|:-----|:------|:---------|
| **0** | Setup (git init, Supabase Anon Key, Gemini API Key) | ✅ สำเร็จ | `git init`, `.env`, `package.json`, `vite.config.js` ครบถ้วน |
| **1** | Database Schema (รวม Storage bucket + RLS) | ✅ สำเร็จ | 10 ตารางหลัก + Storage bucket `user-uploads` + RLS + RPC `award_workout_coins` รันแล้ว |
| **2** | Auth Module | ✅ สำเร็จ | เข้าสู่ระบบด้วย Username (`Oil`/`Ice`) + รหัสผ่าน (`170201`), แปลงเป็น `*.icena@gmail.com` เบื้องหลัง |
| **3** | State Management | ⏳ รอเริ่ม |  |
| **4** | Workout Module | ⏳ รอ Phase 3 |  |
| **5** | Health Logging (รวม storage.js + Gemini vision) | ⏳ รอ Phase 4 |  |
| **6** | Streak + Quests | ⏳ รอ Phase 5 |  |
| **7** | Shop + Victory Shop | ⏳ รอ Phase 6 |  |
| **8** | Analytics | ⏳ รอ Phase 7 |  |
| **9** | Weekly Competition + Edge Function | ⏳ รอ Phase 8 |  |
| **10** | Polish | ⏳ รอ Phase 9 |  |
| **11** | Deploy (Cloudflare Pages + Edge Function deploy) | ⏳ รอ Phase 10 |  |

---

## 🚦 สิ่งที่ต้องทำทันทีเมื่ออ่านไฟล์นี้

1. แนะนำตัวกับผู้ใช้ว่ารับไฟล์นี้มาแล้ว เข้าใจสิ่งที่ต้องสร้าง (รวมถึงการแก้ไขจาก v1.0)
2. git init โฟลเดอร์โปรเจค + สร้าง .gitignore
3. ขอ **Supabase Anon Key** จาก https://supabase.com/dashboard/project/sxmpsrlysmxuldqyridd/settings/api
4. ขอ **Gemini API Key** จาก https://aistudio.google.com
5. เมื่อได้ครบทุกอย่างแล้ว → เริ่ม Phase 0

---

*ICENA Handoff Brief v1.1 — ปรับปรุง 2026-08-09 — พร้อมส่งต่อให้ Gemini 3.6 Flash*