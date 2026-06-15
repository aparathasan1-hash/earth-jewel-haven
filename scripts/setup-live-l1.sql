-- ============================================================
-- EARTH JEWEL HAVEN — Canlı Yayın L1 (Yayın + İzleme + Sohbet)
-- Idempotent. Para YOK. Yalnız Gold/uzman yayın açabilir.
-- ============================================================

-- ------------------------------------------------------------
-- 0) profiles: uzman doğrulama alanları (RLS politikaları bunlara dayanır)
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified_expert boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS expert_title text;

-- ------------------------------------------------------------
-- 1) LIVE_STREAMS — canlı yayın oturumları
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'live' CHECK (status IN ('live','ended')),
  viewer_count int NOT NULL DEFAULT 0,
  is_private boolean NOT NULL DEFAULT false,
  ended_reason text,                          -- 'host' | 'admin' (kill-switch)
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_live_streams_status     ON public.live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_host       ON public.live_streams(host_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_started_at ON public.live_streams(started_at DESC);

-- SELECT: canlı + public herkese; sahibi her zaman; admin her şeyi
DROP POLICY IF EXISTS "View live streams" ON public.live_streams;
CREATE POLICY "View live streams" ON public.live_streams
  FOR SELECT USING (
    (status = 'live' AND is_private = false)
    OR auth.uid() = host_id
    OR public.is_admin()
  );

-- INSERT: yalnızca Gold üye veya admin/uzman yayın açabilir; host kendisi olmalı
DROP POLICY IF EXISTS "Start own stream" ON public.live_streams;
CREATE POLICY "Start own stream" ON public.live_streams
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = host_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND (p.membership_type = 'gold' OR p.is_admin = true
             OR COALESCE(p.is_verified_expert, false) = true)
    )
  );

-- UPDATE: sahibi kendi yayınını (bitir/izleyici sayısı); admin her yayını (kill-switch)
DROP POLICY IF EXISTS "Update own or admin stream" ON public.live_streams;
CREATE POLICY "Update own or admin stream" ON public.live_streams
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id OR public.is_admin())
  WITH CHECK (auth.uid() = host_id OR public.is_admin());

DROP POLICY IF EXISTS "Delete own stream" ON public.live_streams;
CREATE POLICY "Delete own stream" ON public.live_streams
  FOR DELETE TO authenticated
  USING (auth.uid() = host_id OR public.is_admin());

-- ------------------------------------------------------------
-- 2) STREAM_MESSAGES — yayın içi canlı sohbet
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.stream_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stream_messages_stream ON public.stream_messages(stream_id, created_at);

-- SELECT: yayını görebilen herkes sohbeti görür (canlı public veya sahibi/admin)
DROP POLICY IF EXISTS "View stream messages" ON public.stream_messages;
CREATE POLICY "View stream messages" ON public.stream_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.live_streams s
      WHERE s.id = stream_id
        AND ((s.status = 'live' AND s.is_private = false)
             OR s.host_id = auth.uid() OR public.is_admin())
    )
  );

-- INSERT: kimliği doğrulanmış kullanıcı, yalnız canlı yayına, kendi adına
DROP POLICY IF EXISTS "Send stream message" ON public.stream_messages;
CREATE POLICY "Send stream message" ON public.stream_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.live_streams s WHERE s.id = stream_id AND s.status = 'live')
  );

-- DELETE: kendi mesajı; admin moderasyon için her mesajı
DROP POLICY IF EXISTS "Delete stream message" ON public.stream_messages;
CREATE POLICY "Delete stream message" ON public.stream_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- ------------------------------------------------------------
-- 3) STREAM_REPORTS — izleyici bildirimi (moderasyon)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stream_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (stream_id, reporter_id)
);
ALTER TABLE public.stream_reports ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stream_reports_stream ON public.stream_reports(stream_id);

DROP POLICY IF EXISTS "Create own report" ON public.stream_reports;
CREATE POLICY "Create own report" ON public.stream_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "View reports (admin/self)" ON public.stream_reports;
CREATE POLICY "View reports (admin/self)" ON public.stream_reports
  FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());

-- ------------------------------------------------------------
-- 5) Realtime: canlı keşif + sohbet
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='live_streams') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='stream_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_messages;
  END IF;
END $$;
