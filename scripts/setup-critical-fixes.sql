-- ============================================================
-- EARTH JEWEL HAVEN — Kritik Düzeltmeler (Aşama A)
-- Idempotent: tekrar tekrar çalıştırılabilir, çakışma yapmaz.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Admin sistemi: profiles.is_admin kolonu + admin atama
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Test admini: fatihese-@outlook.com
UPDATE public.profiles
SET is_admin = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'fatihese-@outlook.com');

-- RLS içinde güvenli admin kontrolü (recursion'ı önlemek için SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- ------------------------------------------------------------
-- 2) Realtime: room_messages (ve rooms) canlı yayına eklensin
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3) Vault items: admin yazma politikaları (eksikti)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can insert vault items" ON public.vault_items;
CREATE POLICY "Admins can insert vault items" ON public.vault_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update vault items" ON public.vault_items;
CREATE POLICY "Admins can update vault items" ON public.vault_items
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete vault items" ON public.vault_items;
CREATE POLICY "Admins can delete vault items" ON public.vault_items
  FOR DELETE TO authenticated USING (public.is_admin());

-- ------------------------------------------------------------
-- 4) Rozetler: admin verebilsin + rozetler herkese görünür
--    (public profilde rozet gösterimi için)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON public.user_badges;
CREATE POLICY "Badges are viewable by everyone" ON public.user_badges
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can award badges" ON public.user_badges;
CREATE POLICY "Admins can award badges" ON public.user_badges
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can remove badges" ON public.user_badges;
CREATE POLICY "Admins can remove badges" ON public.user_badges
  FOR DELETE TO authenticated USING (public.is_admin());

-- Admin üyelik tipi değiştirebilsin (profiles UPDATE şu an sadece kendi profili)
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- 5) Odalar: sahibi düzenleyebilsin/silebilsin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Owners can update rooms" ON public.rooms;
CREATE POLICY "Owners can update rooms" ON public.rooms
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can delete rooms" ON public.rooms;
CREATE POLICY "Owners can delete rooms" ON public.rooms
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 6) Performans: foreign key kolonlarına index
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id    ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_user_id    ON public.room_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_breath_sessions_user_id  ON public.breath_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_babies_user_id           ON public.babies(user_id);
CREATE INDEX IF NOT EXISTS idx_baby_milestones_baby_id  ON public.baby_milestones(baby_id);
CREATE INDEX IF NOT EXISTS idx_saved_vault_items_user_id ON public.saved_vault_items(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_badges_user_id      ON public.auto_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id      ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id     ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_rooms_user_id            ON public.rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_vault_items_created_by   ON public.vault_items(created_by);
