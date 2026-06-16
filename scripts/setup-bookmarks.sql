-- Bookmarks: Users' saved vault items
-- ============================================

-- 1. Create saved_vault_items table
CREATE TABLE IF NOT EXISTS saved_vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vault_item_id UUID NOT NULL REFERENCES vault_items(id) ON DELETE CASCADE,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vault_item_id)
);

-- 2. Enable RLS
ALTER TABLE saved_vault_items ENABLE ROW LEVEL SECURITY;

-- 3. Users can only view their own bookmarks
DROP POLICY IF EXISTS "Users can view own bookmarks" ON saved_vault_items;
CREATE POLICY "Users can view own bookmarks" ON saved_vault_items
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Authenticated users can save bookmarks
DROP POLICY IF EXISTS "Users can save bookmarks" ON saved_vault_items;
CREATE POLICY "Users can save bookmarks" ON saved_vault_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Users can remove their own bookmarks
DROP POLICY IF EXISTS "Users can remove own bookmarks" ON saved_vault_items;
CREATE POLICY "Users can remove own bookmarks" ON saved_vault_items
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- NOTE: Run this migration in Supabase Dashboard
-- SQL Editor → Paste and execute
-- ============================================
