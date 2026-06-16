-- ============================================================
-- EARTH JEWEL HAVEN — Faz 4A: Bebek Büyüme Takibi (zaman serisi)
-- Idempotent. baby_measurements + owner-only RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.baby_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  weight_kg numeric(5,2),
  height_cm numeric(5,1),
  head_circumference_cm numeric(4,1),
  note text,
  created_at timestamptz DEFAULT now(),
  CHECK (weight_kg IS NULL OR (weight_kg > 0 AND weight_kg < 60)),
  CHECK (height_cm IS NULL OR (height_cm > 0 AND height_cm < 200)),
  CHECK (head_circumference_cm IS NULL OR (head_circumference_cm > 0 AND head_circumference_cm < 80))
);
ALTER TABLE public.baby_measurements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_baby_measurements_baby ON public.baby_measurements(baby_id, date);

-- Sahip = bebeğin user_id'si. Tüm işlemler yalnız bebeğin sahibine.
DROP POLICY IF EXISTS "View own baby measurements" ON public.baby_measurements;
CREATE POLICY "View own baby measurements" ON public.baby_measurements
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Insert own baby measurements" ON public.baby_measurements;
CREATE POLICY "Insert own baby measurements" ON public.baby_measurements
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Update own baby measurements" ON public.baby_measurements;
CREATE POLICY "Update own baby measurements" ON public.baby_measurements
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Delete own baby measurements" ON public.baby_measurements;
CREATE POLICY "Delete own baby measurements" ON public.baby_measurements
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = baby_id AND b.user_id = auth.uid())
  );
