-- ========================================================
-- ICENA — Database Schema v1.1
-- Project ID: sxmpsrlysmxuldqyridd
-- Single Source of Truth for Supabase Setup
-- ========================================================

-- Enable UUID Extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. PROFILES TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL DEFAULT 'Member',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read all authenticated" 
    ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles: update own profile" 
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "profiles: insert own profile" 
    ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------
-- 2. WORKOUTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- e.g., 'cardio', 'weight', 'yoga', 'running', 'cycling'
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    intensity TEXT NOT NULL CHECK (intensity IN ('low', 'medium', 'high')),
    coins_earned INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    note TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workouts: read all authenticated" 
    ON public.workouts FOR SELECT TO authenticated USING (true);

CREATE POLICY "workouts: insert own only" 
    ON public.workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "workouts: update own only" 
    ON public.workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "workouts: delete own only" 
    ON public.workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 3. SLEEP LOGS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sleep_time TIMESTAMPTZ NOT NULL,
    wake_time TIMESTAMPTZ NOT NULL,
    duration_hours NUMERIC(4,2) NOT NULL CHECK (duration_hours >= 0),
    quality TEXT CHECK (quality IN ('poor', 'fair', 'good', 'excellent')),
    image_url TEXT,
    raw_text TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sleep_logs: read all authenticated" 
    ON public.sleep_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "sleep_logs: insert own only" 
    ON public.sleep_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sleep_logs: update own only" 
    ON public.sleep_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "sleep_logs: delete own only" 
    ON public.sleep_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 4. DIET LOGS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.diet_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    food_name TEXT NOT NULL,
    calories INTEGER DEFAULT 0 CHECK (calories >= 0),
    score TEXT CHECK (score IN ('A', 'B', 'C', 'D')),
    image_url TEXT,
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diet_logs: read all authenticated" 
    ON public.diet_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "diet_logs: insert own only" 
    ON public.diet_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "diet_logs: update own only" 
    ON public.diet_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "diet_logs: delete own only" 
    ON public.diet_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 5. COIN TRANSACTIONS TABLE (Append-Only)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coin_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for rewards, Negative for purchases
    source TEXT NOT NULL, -- 'workout', 'milestone', 'quest', 'shop_purchase', 'admin_grant'
    reference_id TEXT, -- e.g. workout_id or quest_id
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coin_transactions: read all authenticated" 
    ON public.coin_transactions FOR SELECT TO authenticated USING (true);

CREATE POLICY "coin_transactions: insert own only" 
    ON public.coin_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- NO UPDATE or DELETE policy to enforce Append-Only integrity

-- --------------------------------------------------------
-- 6. USER GAME STATE TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_game_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak INTEGER NOT NULL DEFAULT 0,
    last_workout_date DATE,
    coins INTEGER NOT NULL DEFAULT 0,
    milestone_claims JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_quests JSONB NOT NULL DEFAULT '[]'::jsonb,
    coupons JSONB NOT NULL DEFAULT '[]'::jsonb,
    achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_game_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_game_state: read all authenticated" 
    ON public.user_game_state FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_game_state: insert own only" 
    ON public.user_game_state FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_game_state: update own only" 
    ON public.user_game_state FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 7. USER WEEKLY STATS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_weekly_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    weekly_score INTEGER NOT NULL DEFAULT 0,
    total_weekly_losses INTEGER NOT NULL DEFAULT 0,
    total_weekly_wins INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_weekly_stats_user_week_unique UNIQUE (user_id, week_start)
);

ALTER TABLE public.user_weekly_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_weekly_stats: read all authenticated" 
    ON public.user_weekly_stats FOR SELECT TO authenticated USING (true);

CREATE POLICY "user_weekly_stats: insert own only" 
    ON public.user_weekly_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_weekly_stats: update own only" 
    ON public.user_weekly_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 8. CUSTOM SHOP ITEMS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.custom_shop_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🎁',
    price INTEGER NOT NULL CHECK (price > 0),
    kcal INTEGER DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.custom_shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "custom_shop_items: read all authenticated" 
    ON public.custom_shop_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "custom_shop_items: insert own only" 
    ON public.custom_shop_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "custom_shop_items: update own only" 
    ON public.custom_shop_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "custom_shop_items: delete own only" 
    ON public.custom_shop_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 9. VICTORY REDEMPTIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.victory_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    item_emoji TEXT DEFAULT '🏆',
    price_paid INTEGER NOT NULL,
    week_start DATE NOT NULL, -- Included from Day 1
    is_fulfilled BOOLEAN NOT NULL DEFAULT false,
    redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.victory_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "victory_redemptions: read all authenticated" 
    ON public.victory_redemptions FOR SELECT TO authenticated USING (true);

CREATE POLICY "victory_redemptions: insert own only" 
    ON public.victory_redemptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "victory_redemptions: update own only" 
    ON public.victory_redemptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 10. DOCTOR REPORTS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.doctor_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    grade TEXT NOT NULL CHECK (grade IN ('A', 'B', 'C', 'D')),
    summary TEXT NOT NULL,
    recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_note TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.doctor_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "doctor_reports: read own only" 
    ON public.doctor_reports FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- NO INSERT POLICY for authenticated users -> Only service_role (AI doctor Edge Function) can INSERT.
CREATE POLICY "doctor_reports: update own note only" 
    ON public.doctor_reports FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- --------------------------------------------------------
-- 11. STORAGE BUCKET & RLS (user-uploads)
-- --------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-uploads', 'user-uploads', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policies
CREATE POLICY "storage: read all authenticated" 
    ON storage.objects FOR SELECT TO authenticated 
    USING (bucket_id = 'user-uploads');

CREATE POLICY "storage: insert own prefix" 
    ON storage.objects FOR INSERT TO authenticated 
    WITH CHECK (
        bucket_id = 'user-uploads' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "storage: delete own prefix" 
    ON storage.objects FOR DELETE TO authenticated 
    USING (
        bucket_id = 'user-uploads' AND 
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- --------------------------------------------------------
-- 12. PROFILES & GAME STATE CREATION
-- Handled cleanly by client application on login
-- --------------------------------------------------------

-- --------------------------------------------------------
-- 13. RPC FUNCTION: award_workout_coins (Server-Side Only)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.award_workout_coins(p_workout_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_duration INT;
    v_intensity TEXT;
    v_streak INT;
    v_rate NUMERIC;
    v_multiplier NUMERIC;
    v_calculated_coins INT;
    v_new_coin_balance INT;
    v_already_awarded BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if workout exists and belongs to current user
    SELECT duration_minutes, intensity 
    INTO v_duration, v_intensity
    FROM public.workouts
    WHERE id = p_workout_id AND user_id = v_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Workout record not found or unauthorized';
    END IF;

    -- Check if coins already awarded for this workout
    SELECT EXISTS (
        SELECT 1 FROM public.coin_transactions 
        WHERE user_id = v_user_id AND reference_id = p_workout_id::text AND source = 'workout'
    ) INTO v_already_awarded;

    IF v_already_awarded THEN
        RAISE EXCEPTION 'Coins already awarded for this workout';
    END IF;

    -- Fetch user streak
    SELECT streak INTO v_streak
    FROM public.user_game_state
    WHERE user_id = v_user_id;

    IF v_streak IS NULL THEN
        v_streak := 0;
    END IF;

    -- Determine Rate
    IF v_intensity = 'low' THEN v_rate := 1.5;
    ELSIF v_intensity = 'medium' THEN v_rate := 2.25;
    ELSIF v_intensity = 'high' THEN v_rate := 2.75;
    ELSE v_rate := 1.5;
    END IF;

    -- Determine Streak Multiplier
    IF v_streak >= 30 THEN v_multiplier := 2.5;
    ELSIF v_streak >= 14 THEN v_multiplier := 2.0;
    ELSIF v_streak >= 7 THEN v_multiplier := 1.5;
    ELSIF v_streak >= 3 THEN v_multiplier := 1.2;
    ELSE v_multiplier := 1.0;
    END IF;

    -- Calculate Coins
    v_calculated_coins := ROUND(v_duration * v_rate * v_multiplier);

    -- Update Workout record
    UPDATE public.workouts
    SET coins_earned = v_calculated_coins
    WHERE id = p_workout_id;

    -- Insert Coin Transaction (Append-only)
    INSERT INTO public.coin_transactions (user_id, amount, source, reference_id, description)
    VALUES (
        v_user_id,
        v_calculated_coins,
        'workout',
        p_workout_id::text,
        'Coins for workout (' || v_duration || ' min, ' || v_intensity || ' intensity)'
    );

    -- Update User Game State Balance
    UPDATE public.user_game_state
    SET coins = coins + v_calculated_coins,
        updated_at = NOW()
    WHERE user_id = v_user_id
    RETURNING coins INTO v_new_coin_balance;

    RETURN jsonb_build_object(
        'success', true,
        'workout_id', p_workout_id,
        'coins_earned', v_calculated_coins,
        'new_total_coins', v_new_coin_balance,
        'streak_multiplier', v_multiplier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------
-- 14. RPC FUNCTION: redeem_victory_shop_item (Server-Side Only)
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_victory_shop_item(
    p_item_id TEXT,
    p_item_name TEXT,
    p_item_emoji TEXT,
    p_price INT,
    p_loser_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_winner_id UUID;
    v_week_start DATE;
    v_loser_coins INT;
    v_already_redeemed BOOLEAN;
BEGIN
    v_winner_id := auth.uid();
    IF v_winner_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF v_winner_id = p_loser_id THEN
        RAISE EXCEPTION 'Cannot redeem victory shop item against yourself';
    END IF;

    -- Calculate current week start (Monday)
    v_week_start := (DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC'))::DATE;

    -- Check if already redeemed in this week
    SELECT EXISTS (
        SELECT 1 FROM public.victory_redemptions
        WHERE user_id = v_winner_id AND week_start = v_week_start
    ) INTO v_already_redeemed;

    IF v_already_redeemed THEN
        RAISE EXCEPTION 'คุณใช้สิทธิ์ Victory Shop ประจำสัปดาห์นี้ไปแล้วค่ะ (1/1 ครั้ง)';
    END IF;

    -- Check loser coins
    SELECT coins INTO v_loser_coins
    FROM public.user_game_state
    WHERE user_id = p_loser_id;

    IF v_loser_coins IS NULL OR v_loser_coins < p_price THEN
        RAISE EXCEPTION 'เหรียญของฝ่ายแพ้ไม่พอสำหรับแลกสินค้านี้';
    END IF;

    -- Deduct coins from loser
    UPDATE public.user_game_state
    SET coins = coins - p_price,
        updated_at = NOW()
    WHERE user_id = p_loser_id;

    -- Log coin transaction for loser
    INSERT INTO public.coin_transactions (user_id, amount, source, reference_id, description)
    VALUES (
        p_loser_id,
        -p_price,
        'victory_shop_redeem',
        p_item_id,
        'ถูกผู้ชนะแลกซื้อรางวัล ' || p_item_name
    );

    -- Record victory redemption for winner
    INSERT INTO public.victory_redemptions (user_id, item_id, item_name, item_emoji, price_paid, week_start, is_fulfilled)
    VALUES (
        v_winner_id,
        p_item_id,
        p_item_name,
        p_item_emoji,
        p_price,
        v_week_start,
        false
    );

    RETURN jsonb_build_object(
        'success', true,
        'item_name', p_item_name,
        'price_paid', p_price,
        'week_start', v_week_start
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------
-- 15. WEEKLY COMPETITIONS TABLE
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    week_start DATE NOT NULL,
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user1_score INTEGER NOT NULL DEFAULT 0,
    user2_score INTEGER NOT NULL DEFAULT 0,
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_finalized BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT weekly_competitions_week_unique UNIQUE (week_start)
);

ALTER TABLE public.weekly_competitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_competitions: read all authenticated"
    ON public.weekly_competitions FOR SELECT TO authenticated USING (true);

CREATE POLICY "weekly_competitions: insert authenticated"
    ON public.weekly_competitions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "weekly_competitions: update authenticated"
    ON public.weekly_competitions FOR UPDATE TO authenticated USING (true);


