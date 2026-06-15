// Kullanım: node scripts/_runsql.mjs <dosya.sql>
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.resolve(__dirname, "../.env"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("SUPABASE_DB_URL=")).slice("SUPABASE_DB_URL=".length).trim();
const m = url.match(/^postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/(.+)$/);
const [, user, password, host, port, database] = m;

const file = process.argv[2];
if (!file) { console.error("SQL dosyası belirt: node scripts/_runsql.mjs <dosya.sql>"); process.exit(1); }
const sql = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");

const client = new pg.Client({ user, password, host, port: +port, database, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query(sql);
  await client.query("COMMIT");
  console.log(`✅ Uygulandı: ${file}`);
} catch (e) {
  await client.query("ROLLBACK");
  console.error(`❌ HATA (rollback yapıldı): ${e.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
