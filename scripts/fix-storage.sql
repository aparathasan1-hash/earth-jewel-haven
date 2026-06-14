-- ============================================
-- Storage: Avatar bucket ve politikaları
-- ============================================

-- 1. Avatar bucket'ını oluştur (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS'yi etkinleştir
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Avatar resimlerini herkes görebilir (SELECT)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 4. Kimliği doğrulanmış kullanıcılar avatar yükleyebilir (INSERT)
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- 5. Kullanıcılar kendi avatarlarını güncelleyebilir (UPDATE)
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- 6. Kullanıcılar kendi avatarlarını silebilir (DELETE)
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- ============================================
-- NOT: Eğer hala hata alıyorsanız, Supabase Dashboard'dan
-- Storage > avatars bucket > Policies bölümünden
-- yukarıdaki politikaların uygulandığını kontrol edin.
-- ============================================
