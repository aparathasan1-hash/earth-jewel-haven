// Supabase'de trigger'ı çalıştırmak için script
// NOT: Supabase Management API ile SQL çalıştırmak mümkün değil
// Bu script sadece talimatları gösterir

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { readFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kuffihtncrcyvmhciaej.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("🔧 Trigger SQL çalıştırılıyor...");

  const sql = readFileSync(resolve(__dirname, "create-trigger.sql"), "utf-8");

  // Supabase Management API ile SQL çalıştır
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (response.ok) {
    console.log("✅ Trigger başarıyla oluşturuldu!");
  } else {
    const text = await response.text();
    console.error("❌ Hata:", text);
    console.log("");
    console.log("⚠️  Alternatif: SQL'i manuel çalıştırın:");
    console.log("1. https://supabase.com/dashboard/project/kuffihtncrcyvmhciaej");
    console.log("2. Sol menü → SQL Editor");
    console.log("3. scripts/create-trigger.sql içindeki SQL'i yapıştırın");
    console.log("4. Run butonuna tıklayın");
  }
}

main().catch(console.error);
