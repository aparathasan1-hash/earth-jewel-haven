-- ============================================================
-- EARTH JEWEL HAVEN — Vault Birleştirme (statik + DB tek kaynak)
-- Idempotent. İki bug'ı çözer:
--  1) "Kaydet" butonu: saved_vault_items.vault_item_id UUID+FK idi →
--     public vault statik id ("1".."15") gönderince cast/FK hatası.
--     → vault_item_id'i TEXT yap, FK'yi kaldır (statik + DB id birlikte).
--  2) Admin Vault CRUD boşa çalışıyordu → public vault DB öğelerini de
--     gösterecek; premium işaretleme için is_premium kolonu eklendi.
-- ============================================================

-- 1) Bookmark id'sini TEXT'e çevir (statik string id + DB uuid birlikte saklanır)
ALTER TABLE public.saved_vault_items
  DROP CONSTRAINT IF EXISTS saved_vault_items_vault_item_id_fkey;
ALTER TABLE public.saved_vault_items
  ALTER COLUMN vault_item_id TYPE text USING vault_item_id::text;

-- 2) DB vault_items'a premium bayrağı
ALTER TABLE public.vault_items
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
