import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.resolve(__dirname, "../.env"), "utf8");
const url = env.split(/\r?\n/).find((l) => l.startsWith("SUPABASE_DB_URL=")).slice("SUPABASE_DB_URL=".length).trim();
const m = url.match(/^postgresql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/(.+)$/);
const c = new pg.Client({ user: m[1], password: m[2], host: m[3], port: +m[4], database: m[5], ssl: { rejectUnauthorized: false } });
await c.connect();

// İki test kullanıcısı al
const users = (await c.query(`SELECT id, email FROM auth.users ORDER BY created_at LIMIT 2`)).rows;
const A = users[0], B = users[1];
console.log(`A = ${A.email}\nB = ${B.email}\n`);

// RLS'i A kimliğiyle çalıştıran yardımcı
async function asUser(uid, sql) {
  await c.query("BEGIN");
  await c.query(`SELECT set_config('request.jwt.claims', json_build_object('sub', $1::text, 'role','authenticated')::text, true)`, [uid]);
  await c.query("SET LOCAL role authenticated");
  const r = await c.query(sql);
  await c.query("ROLLBACK");
  return r.rows;
}

const ok = (cond) => (cond ? "✅ GEÇTİ" : "❌ KALDI");

// Temizlik: önceki test verisi
await c.query(`DELETE FROM public.connections WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`, [A.id, B.id]);
await c.query(`DELETE FROM public.posts WHERE user_id=$1 AND content LIKE 'RLS-TEST%'`, [B.id]);

// B 'friends' görünürlüklü bir paylaşım yapsın (service role ile)
await c.query(`INSERT INTO public.posts (user_id, content, visibility) VALUES ($1, 'RLS-TEST friends-only', 'friends')`, [B.id]);
await c.query(`INSERT INTO public.posts (user_id, content, visibility) VALUES ($1, 'RLS-TEST public', 'public')`, [B.id]);

console.log("--- ARKADAŞ DEĞİLKEN ---");
let r;
r = await asUser(A.id, `SELECT public.can_view_field('${B.id}','${A.id}','show_mood') AS v`);
console.log(`A, B'nin mood'unu görebilir mi? ${r[0].v} -> ${ok(r[0].v === false)} (beklenen: false/none)`);

r = await asUser(A.id, `SELECT public.can_view_field('${B.id}','${A.id}','show_baby_info') AS v`);
console.log(`A, B'nin bebek bilgisini görebilir mi? ${r[0].v} -> ${ok(r[0].v === false)} (beklenen: false, varsayılan friends)`);

r = await asUser(A.id, `SELECT count(*)::int n FROM public.posts WHERE user_id='${B.id}' AND content LIKE 'RLS-TEST%'`);
console.log(`A, B'nin paylaşımlarından kaçını görüyor? ${r[0].n} -> ${ok(r[0].n === 1)} (beklenen: 1, sadece public)`);

// Arkadaş yap
await c.query(`INSERT INTO public.connections (requester_id, addressee_id, status) VALUES ($1,$2,'accepted')`, [A.id, B.id]);

console.log("\n--- ARKADAŞ OLUNCA ---");
r = await asUser(A.id, `SELECT public.are_friends('${A.id}','${B.id}') AS v`);
console.log(`A ve B arkadaş mı? ${r[0].v} -> ${ok(r[0].v === true)}`);

r = await asUser(A.id, `SELECT public.can_view_field('${B.id}','${A.id}','show_baby_info') AS v`);
console.log(`A, B'nin bebek bilgisini görebilir mi? ${r[0].v} -> ${ok(r[0].v === true)} (beklenen: true)`);

r = await asUser(A.id, `SELECT public.can_view_field('${B.id}','${A.id}','show_mood') AS v`);
console.log(`A, B'nin mood'unu görebilir mi? ${r[0].v} -> ${ok(r[0].v === false)} (beklenen: false, mood varsayılanı none)`);

r = await asUser(A.id, `SELECT count(*)::int n FROM public.posts WHERE user_id='${B.id}' AND content LIKE 'RLS-TEST%'`);
console.log(`A, B'nin paylaşımlarından kaçını görüyor? ${r[0].n} -> ${ok(r[0].n === 2)} (beklenen: 2, public + friends)`);

// Temizlik
await c.query(`DELETE FROM public.connections WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)`, [A.id, B.id]);
await c.query(`DELETE FROM public.posts WHERE user_id=$1 AND content LIKE 'RLS-TEST%'`, [B.id]);
console.log("\n🧹 Test verisi temizlendi");
await c.end();
