-- ============================================================
-- EARTH JEWEL HAVEN — Canlı Yayın L2: Uzman Doğrulama
-- Idempotent. Belge yükleme → admin onayı → is_verified_expert.
-- profiles.is_verified_expert / expert_title L1'de eklendi.
-- ============================================================

-- ------------------------------------------------------------
-- 1) EXPERT_APPLICATIONS — başvurular
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expert_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  profession text NOT NULL,                 -- örn. 'Kadın Doğum Uzmanı'
  expert_title text,                        -- onayda profiles.expert_title'a yazılır
  document_path text NOT NULL,              -- expert_docs bucket'ında yol (private)
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  review_note text,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id)                          -- kullanıcı başına tek aktif başvuru
);
ALTER TABLE public.expert_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_expert_apps_status ON public.expert_applications(status);

-- SELECT: sahibi kendi başvurusunu; admin hepsini
DROP POLICY IF EXISTS "View own or admin applications" ON public.expert_applications;
CREATE POLICY "View own or admin applications" ON public.expert_applications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- INSERT: kendi adına başvuru
DROP POLICY IF EXISTS "Create own application" ON public.expert_applications;
CREATE POLICY "Create own application" ON public.expert_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- UPDATE: yalnız admin inceler (status/not). (Sahibi yeniden başvuru için DELETE yapar.)
DROP POLICY IF EXISTS "Admin reviews application" ON public.expert_applications;
CREATE POLICY "Admin reviews application" ON public.expert_applications
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DELETE: sahibi (yeniden başvuru için) veya admin
DROP POLICY IF EXISTS "Delete own or admin application" ON public.expert_applications;
CREATE POLICY "Delete own or admin application" ON public.expert_applications
  FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------
-- 2) Onay fonksiyonu (SECURITY DEFINER): başvuruyu onayla →
--    profiles.is_verified_expert=true + expert_title. RLS-güvenli tek işlem.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.approve_expert_application(p_app_id uuid, p_note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid; v_title text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'yetkisiz';
  END IF;
  SELECT user_id, COALESCE(expert_title, profession) INTO v_user, v_title
  FROM public.expert_applications WHERE id = p_app_id;
  IF v_user IS NULL THEN RAISE EXCEPTION 'başvuru yok'; END IF;

  UPDATE public.expert_applications
    SET status='approved', review_note=p_note, reviewed_by=auth.uid(), reviewed_at=now()
    WHERE id = p_app_id;
  UPDATE public.profiles
    SET is_verified_expert=true, expert_title=v_title
    WHERE id = v_user;
END; $$;

REVOKE ALL ON FUNCTION public.approve_expert_application(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.approve_expert_application(uuid, text) TO authenticated;

-- ------------------------------------------------------------
-- 3) expert_docs — ÖZEL storage bucket (hassas PII: diploma/lisans)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('expert_docs', 'expert_docs', false)
ON CONFLICT (id) DO NOTHING;

-- Yükleme: kimliği doğrulanmış kullanıcı, yalnız kendi klasörüne ({uid}/...)
DROP POLICY IF EXISTS "Upload own expert doc" ON storage.objects;
CREATE POLICY "Upload own expert doc" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'expert_docs'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Okuma: yalnız sahibi veya admin (public DEĞİL)
DROP POLICY IF EXISTS "Read own or admin expert doc" ON storage.objects;
CREATE POLICY "Read own or admin expert doc" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'expert_docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );

-- Silme: sahibi veya admin
DROP POLICY IF EXISTS "Delete own or admin expert doc" ON storage.objects;
CREATE POLICY "Delete own or admin expert doc" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'expert_docs'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
  );
