-- ============================================================
-- EARTH JEWEL HAVEN — Feed Moderasyonu
-- Idempotent. post_reports (raporlama) + posts.is_hidden (admin gizler) +
-- RLS güncellemesi (gizli paylaşımlar sahibi/admin dışında görünmez) +
-- admin moderasyon politikaları.
-- ============================================================

-- ------------------------------------------------------------
-- 1) posts: gizleme bayrağı
-- ------------------------------------------------------------
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false;

-- Görünürlük politikasını gizli paylaşımları saklayacak şekilde güncelle:
-- gizli paylaşım yalnız sahibine ve admin'e görünür.
DROP POLICY IF EXISTS "View posts per visibility" ON public.posts;
CREATE POLICY "View posts per visibility" ON public.posts
  FOR SELECT USING (
    (NOT is_hidden OR auth.uid() = user_id OR public.is_admin())
    AND (
      visibility = 'public'
      OR auth.uid() = user_id
      OR (visibility = 'friends' AND public.are_friends(auth.uid(), user_id))
    )
  );

-- Admin paylaşımları gizleyebilir/açabilir (is_hidden güncelle)
DROP POLICY IF EXISTS "Admin moderate posts" ON public.posts;
CREATE POLICY "Admin moderate posts" ON public.posts
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin uygunsuz paylaşımı silebilir
DROP POLICY IF EXISTS "Admin delete posts" ON public.posts;
CREATE POLICY "Admin delete posts" ON public.posts
  FOR DELETE TO authenticated USING (public.is_admin());

-- ------------------------------------------------------------
-- 2) post_reports (stream_reports deseni)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, reporter_id)
);
ALTER TABLE public.post_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_post_reports_post ON public.post_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reports_created ON public.post_reports(created_at DESC);

-- Kullanıcı kendi raporunu oluşturur
DROP POLICY IF EXISTS "Create own post report" ON public.post_reports;
CREATE POLICY "Create own post report" ON public.post_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Rapor eden kendi raporunu, admin tümünü görür
DROP POLICY IF EXISTS "View post reports (admin/self)" ON public.post_reports;
CREATE POLICY "View post reports (admin/self)" ON public.post_reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());

-- Admin raporu çözünce silebilir (kapatma)
DROP POLICY IF EXISTS "Admin delete post report" ON public.post_reports;
CREATE POLICY "Admin delete post report" ON public.post_reports
  FOR DELETE TO authenticated USING (public.is_admin());
