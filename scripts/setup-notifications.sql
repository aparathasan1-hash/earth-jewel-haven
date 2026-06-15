-- ============================================================
-- EARTH JEWEL HAVEN — Uygulama içi Bildirim Merkezi
-- Idempotent. notifications + RLS (okuma/işaretleme own-only) + realtime.
-- INSERT yalnız service_role (sunucu fn) tarafından yapılır → spam engellenir.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,   -- alıcı
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,          -- tetikleyen
  type text NOT NULL CHECK (type IN ('friend_request','friend_accept','room_message','live_started')),
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- Alıcı kendi bildirimlerini görür
DROP POLICY IF EXISTS "View own notifications" ON public.notifications;
CREATE POLICY "View own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Alıcı okundu işaretler / siler (INSERT politikası YOK → istemci ekleyemez; service_role RLS'i bypass eder)
DROP POLICY IF EXISTS "Update own notifications" ON public.notifications;
CREATE POLICY "Update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Delete own notifications" ON public.notifications;
CREATE POLICY "Delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Realtime: zil canlı güncellensin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
