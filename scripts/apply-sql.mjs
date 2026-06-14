// Supabase'de SQL çalıştırmak için script
// Kullanım: node scripts/apply-sql.mjs
// Bu script, Supabase Management API'yi kullanarak SQL çalıştırır

import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Supabase Management API SQL endpoint
// https://supabase.com/docs/reference/api/querying-with-sql
const MANAGEMENT_API_URL = "https://api.supabase.com";

async function main() {
  const args = process.argv.slice(2);
  const sqlFile = args[0] || "setup-db.sql";
  
  console.log(`🔧 SQL dosyası çalıştırılıyor: ${sqlFile}`);
  
  const sqlPath = resolve(__dirname, sqlFile);
  let sql;
  
  try {
    sql = readFileSync(sqlPath, "utf-8");
  } catch (err) {
    console.error(`❌ Dosya bulunamadı: ${sqlPath}`);
    console.log("");
    console.log("📋 Kullanılabilir SQL dosyaları:");
    console.log("  - setup-db.sql (tüm tablolar, RLS, storage)")
    console.log("  - create-trigger.sql (otomatik profil oluşturma trigger'ı)")
    return;
  }
  
  console.log(`📄 SQL boyutu: ${sql.length} karakter`);
  
  // Supabase Management API ile SQL çalıştır
  // NOT: Bu endpoint sadece Supabase Pro planında çalışır
  // Ücretsiz planda SQL Editor'u manuel kullanmanız gerekir
  
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
  console.log(`📋 Proje referansı: ${projectRef}`);
  
  try {
    const response = await fetch(
      `${MANAGEMENT_API_URL}/v1/projects/${projectRef}/database/query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: sql }),
      }
    );
    
    if (response.ok) {
      console.log("✅ SQL başarıyla çalıştırıldı!");
      const result = await response.json();
      console.log("📊 Sonuç:", JSON.stringify(result, null, 2));
    } else {
      const text = await response.text();
      console.error("❌ Hata:", text);
      console.log("");
      console.log("⚠️  Management API çalışmadı. SQL'i manuel çalıştırın:");
      console.log(`1. https://supabase.com/dashboard/project/${projectRef}/sql/new`);
      console.log(`2. scripts/${sqlFile} dosyasını açıp içindeki SQL'i kopyalayın`);
      console.log("3. SQL Editor'a yapıştırın ve Run butonuna tıklayın");
    }
  } catch (err) {
    console.error("❌ Bağlantı hatası:", err.message);
    console.log("");
    console.log("⚠️  SQL'i manuel çalıştırmanız gerekiyor:");
    console.log(`1. https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log(`2. scripts/${sqlFile} dosyasını açıp içindeki SQL'i kopyalayın`);
    console.log("3. SQL Editor'a yapıştırın ve Run butonuna tıklayın");
  }
}

main().catch(console.error);
