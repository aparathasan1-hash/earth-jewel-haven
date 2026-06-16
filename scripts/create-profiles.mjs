// Mevcut kullanıcılar için profil oluşturma script'i
// ÖNCE: create-trigger.sql'i Supabase SQL Editor'da çalıştırın
// SONRA: bu script'i çalıştırın

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

async function main() {
  console.log("🔍 Kullanıcılar taranıyor...");

  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("❌ Kullanıcılar alınamadı:", error.message);
    return;
  }

  console.log(`📋 Toplam ${users.users.length} kullanıcı bulundu.`);

  let created = 0;
  let skipped = 0;

  for (const user of users.users) {
    // Profil var mı kontrol et
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (profile) {
      console.log(`  ✓ ${user.email} → profil zaten var`);
      skipped++;
      continue;
    }

    // Profil oluştur
    const fullName = user.user_metadata?.full_name || "";
    const username = user.user_metadata?.username || user.email?.split("@")[0] || "user";

    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      full_name: fullName,
      username: username,
    });

    if (insertError) {
      console.error(`  ❌ ${user.email} → profil oluşturulamadı: ${insertError.message}`);
    } else {
      console.log(`  ✅ ${user.email} → profil oluşturuldu (${username})`);
      created++;
    }
  }

  console.log("");
  console.log(`✅ ${created} profil oluşturuldu, ${skipped} zaten vardı.`);
  console.log("Artık giriş yapıp profilinizi görebilirsiniz!");
}

main().catch(console.error);
