-- ============================================
-- Earth Jewel Haven - Bebek Profili Sistemi
-- ============================================

-- 1. Bebekler tablosu
CREATE TABLE IF NOT EXISTS babies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  photo_url TEXT,
  gender TEXT CHECK (gender IN ('girl', 'boy', 'other')),
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bebek kilometre taşları
CREATE TABLE IF NOT EXISTS baby_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id UUID REFERENCES babies(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Yıldönümü rozetleri (admin tarafından tanımlanacak)
CREATE TABLE IF NOT EXISTS anniversary_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  years_required INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Otomatik kazanılan rozetler (trigger ile)
CREATE TABLE IF NOT EXISTS auto_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'baby_age', 'membership', 'milestone'
  badge_name TEXT NOT NULL,
  badge_icon TEXT,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type, badge_name)
);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE baby_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE anniversary_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_badges ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies
-- ============================================

-- Babies
DROP POLICY IF EXISTS "Users can view own babies" ON babies;
CREATE POLICY "Users can view own babies" ON babies
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own babies" ON babies;
CREATE POLICY "Users can insert own babies" ON babies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own babies" ON babies;
CREATE POLICY "Users can update own babies" ON babies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own babies" ON babies;
CREATE POLICY "Users can delete own babies" ON babies
  FOR DELETE USING (auth.uid() = user_id);

-- Baby Milestones
DROP POLICY IF EXISTS "Users can view own baby milestones" ON baby_milestones;
CREATE POLICY "Users can view own baby milestones" ON baby_milestones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = baby_milestones.baby_id AND babies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own baby milestones" ON baby_milestones;
CREATE POLICY "Users can insert own baby milestones" ON baby_milestones
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = baby_milestones.baby_id AND babies.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own baby milestones" ON baby_milestones;
CREATE POLICY "Users can delete own baby milestones" ON baby_milestones
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM babies WHERE babies.id = baby_milestones.baby_id AND babies.user_id = auth.uid())
  );

-- Anniversary Badges (herkes görebilir)
DROP POLICY IF EXISTS "Anniversary badges are viewable by everyone" ON anniversary_badges;
CREATE POLICY "Anniversary badges are viewable by everyone" ON anniversary_badges
  FOR SELECT USING (true);

-- Auto Badges
DROP POLICY IF EXISTS "Users can view own auto badges" ON auto_badges;
CREATE POLICY "Users can view own auto badges" ON auto_badges
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Örnek yıldönümü rozetleri
-- ============================================
INSERT INTO anniversary_badges (name, description, icon, years_required) VALUES
  ('1 Yıllık Anne', '1 yıldır annelik yolculuğunda', '🌟', 1),
  ('2 Yıllık Anne', '2 yıldır annelik yolculuğunda', '🌟', 2),
  ('3 Yıllık Anne', '3 yıldır annelik yolculuğunda', '🌟', 3),
  ('5 Yıllık Anne', '5 yıldır annelik yolculuğunda', '🌟', 5),
  ('10 Yıllık Anne', '10 yıldır annelik yolculuğunda', '🌟', 10)
ON CONFLICT DO NOTHING;

-- ============================================
-- Storage: Baby photos bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('baby_photos', 'baby_photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Baby photos are publicly accessible" ON storage.objects;
CREATE POLICY "Baby photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'baby_photos');

DROP POLICY IF EXISTS "Users can upload baby photos" ON storage.objects;
CREATE POLICY "Users can upload baby photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'baby_photos' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update baby photos" ON storage.objects;
CREATE POLICY "Users can update baby photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'baby_photos' AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can delete baby photos" ON storage.objects;
CREATE POLICY "Users can delete baby photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'baby_photos' AND auth.role() = 'authenticated'
  );
