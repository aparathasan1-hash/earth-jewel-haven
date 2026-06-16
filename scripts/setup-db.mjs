import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sql = `
-- Kullanıcı profilleri (auth.users ile bağlantılı)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'gold')),
  baby_name TEXT,
  baby_birth_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rozetler
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kullanıcı rozetleri
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Kullanıcı odaları
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Oda mesajları
CREATE TABLE IF NOT EXISTS room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vault içerikleri (admin paneli için)
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

-- Nefes seansları
CREATE TABLE IF NOT EXISTS breath_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_seconds INTEGER NOT NULL,
  cycles INTEGER NOT NULL DEFAULT 0,
  pattern TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE breath_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Badges are viewable by everyone" ON badges;
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
CREATE POLICY "Users can view own badges" ON user_badges FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON rooms;
CREATE POLICY "Rooms are viewable by everyone" ON rooms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create rooms" ON rooms;
CREATE POLICY "Users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Messages are viewable by everyone" ON room_messages;
CREATE POLICY "Messages are viewable by everyone" ON room_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON room_messages;
CREATE POLICY "Users can send messages" ON room_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Vault items are viewable by everyone" ON vault_items;
CREATE POLICY "Vault items are viewable by everyone" ON vault_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own breath sessions" ON breath_sessions;
CREATE POLICY "Users can insert own breath sessions" ON breath_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own breath sessions" ON breath_sessions;
CREATE POLICY "Users can view own breath sessions" ON breath_sessions FOR SELECT USING (auth.uid() = user_id);
`;

async function main() {
  console.log("🔧 Veritabanı tabloları oluşturuluyor...");

  // SQL'i çalıştırmak için Supabase Management API kullanıyoruz
  const response = await fetch(
    `${supabaseUrl}/rest/v1/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
      },
    },
  );

  // Aslında doğrudan SQL çalıştıramayız, bunun için Supabase Management API'yi kullanmalıyız
  // Alternatif: her tabloyu tek tek oluşturalım
  console.log("📦 Tablolar oluşturuluyor...");

  // Tabloları tek tek oluştur
  const tables = [
    "profiles",
    "badges",
    "user_badges",
    "rooms",
    "room_messages",
    "vault_items",
    "breath_sessions",
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).select("id").limit(1);
    if (error && error.code === "42P01") {
      console.log(`  ${table} → oluşturulacak (henüz yok)`);
    } else if (error) {
      console.log(`  ${table} → ${error.message}`);
    } else {
      console.log(`  ${table} → zaten var ✅`);
    }
  }

  console.log("");
  console.log("⚠️  Tabloları oluşturmak için lütfen şu adımları izleyin:");
  console.log("1. https://supabase.com adresine gidin");
  console.log("2. Projenize tıklayın");
  console.log("3. Sol menüden SQL Editor'a tıklayın");
  console.log("4. scripts/setup-db.sql dosyasını açıp içindeki SQL'i yapıştırın");
  console.log("5. Run butonuna tıklayın");
}

main().catch(console.error);
