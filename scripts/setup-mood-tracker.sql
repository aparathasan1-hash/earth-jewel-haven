-- Mood Tracker: Daily mood entries for emotional well-being tracking
-- ============================================

-- 1. Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  emoji TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entry_date)
);

-- 2. Enable RLS
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- 3. Users can only view their own mood entries
DROP POLICY IF EXISTS "Users can view own mood entries" ON mood_entries;
CREATE POLICY "Users can view own mood entries" ON mood_entries
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Users can create mood entries
DROP POLICY IF EXISTS "Users can create mood entries" ON mood_entries;
CREATE POLICY "Users can create mood entries" ON mood_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Users can update their own mood entries
DROP POLICY IF EXISTS "Users can update own mood entries" ON mood_entries;
CREATE POLICY "Users can update own mood entries" ON mood_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. Users can delete their own mood entries
DROP POLICY IF EXISTS "Users can delete own mood entries" ON mood_entries;
CREATE POLICY "Users can delete own mood entries" ON mood_entries
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- NOTE: Run this migration in Supabase Dashboard
-- SQL Editor → Paste and execute
-- ============================================
