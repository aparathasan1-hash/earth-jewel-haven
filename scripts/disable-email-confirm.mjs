// Supabase'de email confirmation'ı kapatmak için
// Bu script, Supabase Management API'yi kullanarak tüm kullanıcıları onaylar

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
  console.log("🔍 Mevcut kullanıcılar taranıyor...");

  const { data: users, error } = await supabase.auth.admin.listUsers();

  if (error) {
    console.error("❌ Kullanıcılar alınamadı:", error.message);
    console.log("");
    console.log("⚠️  Service Role Key'in doğru olduğundan emin olun.");
    console.log("   .env dosyasındaki SUPABASE_SERVICE_ROLE_KEY'i kontrol edin.");
    return;
  }

  console.log(`📋 Toplam ${users.users.length} kullanıcı bulundu.`);

  let confirmed = 0;
  for (const user of users.users) {
    if (!user.email_confirmed_at) {
      console.log(`  ✅ ${user.email} onaylanıyor...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      if (updateError) {
        console.error(`  ❌ ${user.email} onaylanamadı: ${updateError.message}`);
      } else {
        confirmed++;
      }
    } else {
      console.log(`  ✓ ${user.email} zaten onaylı`);
    }
  }

  console.log("");
  console.log(`✅ ${confirmed} kullanıcı onaylandı.`);
  console.log("Artık giriş yapmayı deneyebilirsiniz!");
}

main().catch(console.error);
