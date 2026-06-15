-- ============================================================
-- EARTH JEWEL HAVEN — Sohbet Medyası (resim / ses / video)
-- Idempotent. room_messages medya alanları + public 'chat_media'
-- bucket'ı + RLS (okuma herkese açık, yazma/silme yalnız sahip klasörü).
-- ============================================================

-- ------------------------------------------------------------
-- 1) room_messages: medya alanları
-- ------------------------------------------------------------
ALTER TABLE public.room_messages
  ADD COLUMN IF NOT EXISTS media_url text;
ALTER TABLE public.room_messages
  ADD COLUMN IF NOT EXISTS media_type text
    CHECK (media_type IN ('image','audio','video'));
ALTER TABLE public.room_messages
  ADD COLUMN IF NOT EXISTS media_duration int;  -- saniye (ses/video için)

-- content artık boş olabilir (yalnız-medya mesajı). NOT NULL ise kaldır.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='room_messages'
      AND column_name='content' AND is_nullable='NO'
  ) THEN
    ALTER TABLE public.room_messages ALTER COLUMN content DROP NOT NULL;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2) Storage bucket: chat_media (public okuma)
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO NOTHING;

-- (storage.objects'te RLS zaten etkin — sahibi supabase_storage_admin olduğu
--  için ALTER edilmez; yalnız politika eklenir.)

-- Okuma: herkese açık (mesajlar zaten oda içinde paylaşılır)
DROP POLICY IF EXISTS "Chat media public read" ON storage.objects;
CREATE POLICY "Chat media public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat_media');

-- Yükleme: yalnız kimliği doğrulanmış + kendi {uid}/ klasörüne
DROP POLICY IF EXISTS "Chat media owner insert" ON storage.objects;
CREATE POLICY "Chat media owner insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'chat_media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Silme: yalnız kendi klasöründeki dosya
DROP POLICY IF EXISTS "Chat media owner delete" ON storage.objects;
CREATE POLICY "Chat media owner delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'chat_media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
