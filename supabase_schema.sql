-- ============================================================
-- ARNO — Supabase Schema
-- Run this entirely in: Supabase Dashboard → SQL Editor
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE)
-- ============================================================

-- 1. Create the `profiles` table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  age INTEGER,
  current_weight NUMERIC,
  height NUMERIC,
  fitness_goal TEXT,
  gym_experience TEXT,
  preferred_split TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the `chat_messages` table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row-Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop old policies before recreating (avoids "already exists" errors)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;

-- 5. Profiles RLS policies
-- SELECT
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- INSERT (used when upsert creates a new row)
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- UPDATE (used when upsert updates an existing row)
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id )
  WITH CHECK ( auth.uid() = id );

-- 6. Chat Messages RLS policies
CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- 7. Auto-Profile Creation Trigger
-- Fires every time a new user signs up — creates a blank profiles row automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING; -- safe to re-run
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Backfill: create profile rows for any existing auth users that don't have one yet
INSERT INTO public.profiles (id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 9. Realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- 10. Conversation ID support
-- Safe to run multiple times.
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID DEFAULT gen_random_uuid();

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON public.chat_messages(conversation_id);

-- 11. Calorie Logs
CREATE TABLE IF NOT EXISTS public.calorie_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_name TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g FLOAT DEFAULT 0,
  carbs_g FLOAT DEFAULT 0,
  fat_g FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.calorie_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own calorie logs" ON public.calorie_logs;
CREATE POLICY "Users can manage own calorie logs"
  ON public.calorie_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 12. Personal Records
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  exercise TEXT NOT NULL,
  weight_kg FLOAT NOT NULL,
  reps INTEGER,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own PRs" ON public.personal_records;
CREATE POLICY "Users can manage own PRs"
  ON public.personal_records FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
