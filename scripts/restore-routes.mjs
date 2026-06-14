/**
 * Build sonrası route dosyalarını geri yükler.
 * @tanstack/router-plugin build sırasında route dosyalarını sıfırladığı için,
 * bu script özel route dosyalarını (bebek profili gibi) tekrar yazar.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const routesDir = path.resolve(__dirname, "../src/routes");
const backupDir = path.resolve(__dirname, "../.route-backups");

// Yedek dizini yoksa oluştur
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Yedekleme modu: route dosyalarını yedekle
if (process.argv.includes("--backup")) {
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith(".tsx"));
  for (const file of files) {
    const src = path.join(routesDir, file);
    const dest = path.join(backupDir, file);
    fs.copyFileSync(src, dest);
    console.log(`  Yedeklendi: ${file}`);
  }
  console.log(`\n✅ ${files.length} route dosyası yedeklendi`);
  process.exit(0);
}

// Geri yükleme modu: yedeklenen route dosyalarını geri yükle
if (fs.existsSync(backupDir)) {
  const files = fs.readdirSync(backupDir).filter(f => f.endsWith(".tsx"));
  let restored = 0;
  for (const file of files) {
    const src = path.join(backupDir, file);
    const dest = path.join(routesDir, file);
    fs.copyFileSync(src, dest);
    console.log(`  Geri yüklendi: ${file}`);
    restored++;
  }
  console.log(`\n✅ ${restored} route dosyası geri yüklendi`);
} else {
  console.log("⚠️  Yedek bulunamadı. Önce --backup ile yedekleyin.");
}
