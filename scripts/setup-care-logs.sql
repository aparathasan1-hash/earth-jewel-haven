-- ============================================================
-- EARTH JEWEL HAVEN — Faz 4B: Beslenme & Uyku takibi
-- Idempotent. Owner-only RLS (bebeğin user_id'si).
-- ============================================================

-- ------------------------------------------------------------
-- 1) BESLENME LOGLARI
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.baby_feeding_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  logged_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (kind IN ('breast','bottle','solid')),
  amount_ml int CHECK (amount_ml IS NULL OR (amount_ml >= 0 AND amount_ml < 2000)),
  duration_min int CHECK (duration_min IS NULL OR (duration_min >= 0 AND duration_min < 600)),
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.baby_feeding_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_feeding_logs_baby ON public.baby_feeding_logs(baby_id, logged_at DESC);

-- ------------------------------------------------------------
-- 2) UYKU LOGLARI
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.baby_sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  start_at timestamptz NOT NULL DEFAULT now(),
  end_at timestamptz,
  note text,
  created_at timestamptz DEFAULT now(),
  CHECK (end_at IS NULL OR end_at >= start_at)
);
ALTER TABLE public.baby_sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sleep_logs_baby ON public.baby_sleep_logs(baby_id, start_at DESC);

-- ------------------------------------------------------------
-- 3) Owner-only RLS (her iki tablo için aynı desen)
-- ------------------------------------------------------------
DO $$
DECLARE tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['baby_feeding_logs','baby_sleep_logs'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "View own %1$s" ON public.%1$s', tbl);
    EXECUTE format($f$CREATE POLICY "View own %1$s" ON public.%1$s
      FOR SELECT USING (EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid()))$f$, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Insert own %1$s" ON public.%1$s', tbl);
    EXECUTE format($f$CREATE POLICY "Insert own %1$s" ON public.%1$s
      FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid()))$f$, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Update own %1$s" ON public.%1$s', tbl);
    EXECUTE format($f$CREATE POLICY "Update own %1$s" ON public.%1$s
      FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid()))$f$, tbl);

    EXECUTE format('DROP POLICY IF EXISTS "Delete own %1$s" ON public.%1$s', tbl);
    EXECUTE format($f$CREATE POLICY "Delete own %1$s" ON public.%1$s
      FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid()))$f$, tbl);
  END LOOP;
END $$;
