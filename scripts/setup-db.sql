-- ============================================
-- Earth Jewel Haven - Veritabanı Kurulumu
-- ============================================

-- 1. Kullanıcı profilleri
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'gold')),
  baby_name TEXT,
  baby_birth_date DATE,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Rozetler
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Kullanıcı rozetleri
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- 4. Kullanıcı odaları
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Oda mesajları
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Vault içerikleri
CREATE TABLE IF NOT EXISTS vault_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Essay', 'Printable', 'Audio', 'Course')),
  tags TEXT[] DEFAULT '{}',
  blurb TEXT,
  body TEXT[] DEFAULT '{}',
  printable TEXT[] DEFAULT '{}',
  audio_note TEXT,
  coming_soon BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Nefes seansları
CREATE TABLE IF NOT EXISTS breath_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INTEGER NOT NULL,
  cycles INTEGER NOT NULL DEFAULT 0,
  pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE breath_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies (Güvenlik Kuralları)
-- ============================================

-- Profiller
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Rozetler
DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges
  FOR SELECT USING (true);

-- Kullanıcı rozetleri
DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Odalar
DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
CREATE POLICY "Rooms are viewable by everyone" ON rooms
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mesajlar
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON room_messages;
CREATE POLICY "Messages are viewable by everyone" ON room_messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON room_messages;
CREATE POLICY "Users can send messages" ON room_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Vault
DROP POLICY IF EXISTS "Vault items are viewable by everyone" ON vault_items;
CREATE POLICY "Vault items are viewable by everyone" ON vault_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can insert vault items" ON vault_items;
CREATE POLICY "Admins can insert vault items" ON vault_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can update vault items" ON vault_items;
CREATE POLICY "Admins can update vault items" ON vault_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

DROP POLICY IF EXISTS "Admins can delete vault items" ON vault_items;
CREATE POLICY "Admins can delete vault items" ON vault_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Nefes seansları
DROP POLICY IF EXISTS "Users can insert own breath sessions" ON breath_sessions;
CREATE POLICY "Users can insert own breath sessions" ON breath_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own breath sessions" ON breath_sessions;
CREATE POLICY "Users can view own breath sessions" ON breath_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Storage: Avatar bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND auth.role() = 'authenticated'
  );

-- ============================================
-- Örnek rozetler
-- ============================================
INSERT INTO badges (name, description, icon) VALUES
  ('Bebek 2026', '2026 yılında bebek sahibi olan anneler', '👶'),
  ('Anne 1. Yıl', '1 yıldır annelik yolculuğunda', '🌟'),
  ('Kedi Annesi', 'Kedi sahibi anneler', '🐱'),
  ('Köpek Annesi', 'Köpek sahibi anneler', '🐶'),
  ('Altın Üye', 'Topluluğa destek olan altın üyeler', '⭐'),
  ('İlk Gün', 'Topluluğa katılan ilk üyeler', '🌅')
ON CONFLICT DO NOTHING;
