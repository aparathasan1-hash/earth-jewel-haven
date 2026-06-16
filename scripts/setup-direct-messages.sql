-- ============================================================
-- EARTH JEWEL HAVEN — Birebir Özel Mesajlaşma (1:1 DM)
-- Idempotent. direct_messages + RLS (yalnız ARKADAŞLAR yazar) +
-- realtime + thread listesi fn + notifications 'direct_message' tipi.
-- Medya için mevcut chat_media bucket'ı kullanılır (uploadChatMedia).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text CHECK (media_type IN ('image','audio','video')),
  media_duration int,
  read_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT dm_not_self CHECK (sender_id <> recipient_id),
  CONSTRAINT dm_has_body CHECK (content IS NOT NULL OR media_url IS NOT NULL)
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Bir konuşmayı (iki yön) ve okunmamışları hızlı çekmek için indeksler
CREATE INDEX IF NOT EXISTS idx_dm_pair ON public.direct_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_recipient_unread ON public.direct_messages(recipient_id, read_at);

-- SELECT: yalnız katılımcılar
DROP POLICY IF EXISTS "View own DMs" ON public.direct_messages;
CREATE POLICY "View own DMs" ON public.direct_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- INSERT: gönderen ben + alıcıyla ARKADAŞIZ (taciz önlemi)
DROP POLICY IF EXISTS "Send DM to friend" ON public.direct_messages;
CREATE POLICY "Send DM to friend" ON public.direct_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND public.are_friends(sender_id, recipient_id)
  );

-- UPDATE: yalnız alıcı (okundu işaretleme)
DROP POLICY IF EXISTS "Mark DM read" ON public.direct_messages;
CREATE POLICY "Mark DM read" ON public.direct_messages
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);

-- DELETE: gönderen kendi mesajını siler
DROP POLICY IF EXISTS "Delete own DM" ON public.direct_messages;
CREATE POLICY "Delete own DM" ON public.direct_messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Realtime: canlı sohbet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='direct_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
  END IF;
END $$;

-- Konuşma listesi: her partner için son mesaj + okunmamış sayısı
CREATE OR REPLACE FUNCTION public.get_dm_threads(p_viewer uuid)
RETURNS TABLE (
  partner_id uuid,
  username text,
  full_name text,
  avatar_url text,
  last_content text,
  last_media_type text,
  last_sender uuid,
  last_at timestamptz,
  unread int
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  WITH msgs AS (
    SELECT dm.*,
      CASE WHEN dm.sender_id = p_viewer THEN dm.recipient_id ELSE dm.sender_id END AS partner
    FROM public.direct_messages dm
    WHERE dm.sender_id = p_viewer OR dm.recipient_id = p_viewer
  ),
  last AS (
    SELECT DISTINCT ON (partner)
      partner, content, media_type, sender_id, created_at
    FROM msgs
    ORDER BY partner, created_at DESC
  )
  SELECT
    l.partner,
    p.username,
    p.full_name,
    p.avatar_url,
    l.content,
    l.media_type,
    l.sender_id,
    l.created_at,
    (SELECT count(*)::int FROM msgs m
       WHERE m.partner = l.partner AND m.recipient_id = p_viewer AND m.read_at IS NULL) AS unread
  FROM last l
  JOIN public.profiles p ON p.id = l.partner
  ORDER BY l.created_at DESC;
$$;
REVOKE ALL ON FUNCTION public.get_dm_threads(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_dm_threads(uuid) TO authenticated;

-- Bildirim tipi: 'direct_message' ekle
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('friend_request','friend_accept','room_message','live_started','referral_joined','direct_message'));
