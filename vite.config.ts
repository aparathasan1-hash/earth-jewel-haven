import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";

// Standart TanStack Start kurulumu (Lovable sarmalayıcısı kaldırıldı).
// Giriş dosyaları konvansiyonla otomatik algılanır:
//   src/server.ts (SSR), src/start.ts (middleware), src/router.tsx, src/client.tsx (varsa).
// @ path alias'ı tsconfig'ten vite-tsconfig-paths sağlar.
// VITE_* ortam değişkenleri Vite tarafından import.meta.env'e otomatik enjekte edilir.
export default defineConfig({
  server: {
    host: true, // LAN'dan erişim (telefon testi vb.)
  },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});
