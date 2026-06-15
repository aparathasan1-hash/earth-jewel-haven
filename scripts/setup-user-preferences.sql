-- User Notification Preferences Table
-- Stores notification settings for each user (email reminders, push notifications)

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_daily_reminder BOOLEAN DEFAULT true,
  email_weekly_summary BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON user_preferences;
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: Users can update their own preferences
DROP POLICY IF EXISTS "Users can update own preferences" ON user_preferences;
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS: Users can create their own preferences (on first access)
DROP POLICY IF EXISTS "Users can create own preferences" ON user_preferences;
CREATE POLICY "Users can create own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
