-- ============================================================
-- EARTH JEWEL HAVEN — Aşama B: Sosyal & Gizlilik Temeli
-- Idempotent. Arkadaşlık + Paylaşımlar + Gizlilik (RLS zorunlu).
-- ============================================================

-- ------------------------------------------------------------
-- 1) CONNECTIONS (arkadaşlık: karşılıklı istek-kabul)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee ON public.connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status    ON public.connections(status);

DROP POLICY IF EXISTS "View own connections" ON public.connections;
CREATE POLICY "View own connections" ON public.connections
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Send connection request" ON public.connections;
CREATE POLICY "Send connection request" ON public.connections
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Respond to connection request" ON public.connections;
CREATE POLICY "Respond to connection request" ON public.connections
  FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id)
  WITH CHECK (auth.uid() = addressee_id);

DROP POLICY IF EXISTS "Remove connection" ON public.connections;
CREATE POLICY "Remove connection" ON public.connections
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- ------------------------------------------------------------
-- 2) Yardımcı fonksiyonlar (RLS içinde güvenli kullanım)
-- ------------------------------------------------------------
-- İki kişi arkadaş mı? (SECURITY DEFINER -> RLS'i bypass eder)
CREATE OR REPLACE FUNCTION public.are_friends(a uuid, b uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connections
    WHERE status = 'accepted'
      AND ((requester_id = a AND addressee_id = b)
        OR (requester_id = b AND addressee_id = a))
  );
$$;

-- Bir alanı (show_baby_info / show_mood / show_activity) bakan kişi görebilir mi?
-- Sahibin user_preferences ayarını DEFINER ile okur (RLS bypass), kuralı uygular.
CREATE OR REPLACE FUNCTION public.can_view_field(p_owner uuid, p_viewer uuid, p_field text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE AS $$
DECLARE v text; d text;
BEGIN
  IF p_owner = p_viewer THEN RETURN true; END IF;
  d := CASE p_field WHEN 'show_mood' THEN 'none' ELSE 'friends' END;
  EXECUTE format('SELECT %I::text FROM public.user_preferences WHERE user_id = $1', p_field)
    INTO v USING p_owner;
  v := COALESCE(v, d);
  IF v = 'everyone' THEN RETURN true; END IF;
  IF v = 'friends'  THEN RETURN public.are_friends(p_owner, p_viewer); END IF;
  RETURN false; -- 'none'
END; $$;

-- ------------------------------------------------------------
-- 3) GİZLİLİK TERCİHLERİ (user_preferences genişletme)
-- ------------------------------------------------------------
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS profile_visibility text NOT NULL DEFAULT 'public'
    CHECK (profile_visibility IN ('public','friends','private'));
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_baby_info text NOT NULL DEFAULT 'friends'
    CHECK (show_baby_info IN ('everyone','friends','none'));
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_mood text NOT NULL DEFAULT 'none'
    CHECK (show_mood IN ('everyone','friends','none'));
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_activity text NOT NULL DEFAULT 'friends'
    CHECK (show_activity IN ('everyone','friends','none'));
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS show_online_status boolean NOT NULL DEFAULT true;

-- Mevcut tüm profillere bir tercih satırı garanti et (ayarlar UI'ı için)
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ------------------------------------------------------------
-- 4) Mahrem veri tablolarının RLS'ini gizlilik kuralına bağla
--    (sahip her zaman görür; başkaları ayara göre)
-- ------------------------------------------------------------
-- Bebekler
DROP POLICY IF EXISTS "Users can view own babies" ON public.babies;
DROP POLICY IF EXISTS "View babies per privacy" ON public.babies;
CREATE POLICY "View babies per privacy" ON public.babies
  FOR SELECT USING (public.can_view_field(user_id, auth.uid(), 'show_baby_info'));

-- Ruh hali
DROP POLICY IF EXISTS "Users can view own mood entries" ON public.mood_entries;
DROP POLICY IF EXISTS "View mood per privacy" ON public.mood_entries;
CREATE POLICY "View mood per privacy" ON public.mood_entries
  FOR SELECT USING (public.can_view_field(user_id, auth.uid(), 'show_mood'));

-- Nefes/aktivite
DROP POLICY IF EXISTS "Users can view own breath sessions" ON public.breath_sessions;
DROP POLICY IF EXISTS "View breath per privacy" ON public.breath_sessions;
CREATE POLICY "View breath per privacy" ON public.breath_sessions
  FOR SELECT USING (public.can_view_field(user_id, auth.uid(), 'show_activity'));

-- ------------------------------------------------------------
-- 5) POSTS (paylaşım akışı) — her paylaşımda görünürlük
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  image_url text,
  visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','friends','private')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON public.posts(visibility);

DROP POLICY IF EXISTS "View posts per visibility" ON public.posts;
CREATE POLICY "View posts per visibility" ON public.posts
  FOR SELECT USING (
    visibility = 'public'
    OR auth.uid() = user_id
    OR (visibility = 'friends' AND public.are_friends(auth.uid(), user_id))
  );

DROP POLICY IF EXISTS "Create own posts" ON public.posts;
CREATE POLICY "Create own posts" ON public.posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update own posts" ON public.posts;
CREATE POLICY "Update own posts" ON public.posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete own posts" ON public.posts;
CREATE POLICY "Delete own posts" ON public.posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Paylaşımlar canlı akış için realtime'a eklensin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;
END $$;
