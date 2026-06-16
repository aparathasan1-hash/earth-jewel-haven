-- ============================================================
-- EARTH JEWEL HAVEN — Faz 2.4: Birth Club (doğum-ayı kohort grupları)
-- Idempotent. rooms.group_type/cohort (setup-phase2-onboarding.sql'de eklendi)
-- üzerine kohort başına TEK birth_club odası garantisi + güvenli oluşturma.
-- ============================================================

-- Kohort başına tek birth_club odası (yarış/duplikasyon önler)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_birth_club_cohort
  ON public.rooms(cohort) WHERE group_type = 'birth_club';

-- Kohort odasını bul; yoksa oluştur. SECURITY DEFINER:
-- rooms INSERT RLS'i yalnızca kendi user_id'sine izin verse de bu fonksiyon
-- komünal odayı güvenle (sahip = ilk giren) oluşturur ve uuid döndürür.
CREATE OR REPLACE FUNCTION public.get_or_create_birth_club(
  p_owner uuid,
  p_cohort text,
  p_title text
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rid uuid;
BEGIN
  SELECT id INTO rid
  FROM public.rooms
  WHERE group_type = 'birth_club' AND cohort = p_cohort
  LIMIT 1;
  IF rid IS NOT NULL THEN RETURN rid; END IF;

  INSERT INTO public.rooms (user_id, title, description, is_private, group_type, cohort)
  VALUES (
    p_owner, p_title,
    'Aynı dönemde doğum yapan annelerin sıcak grubu.',
    false, 'birth_club', p_cohort
  )
  ON CONFLICT (cohort) WHERE group_type = 'birth_club' DO NOTHING
  RETURNING id INTO rid;

  -- Yarış: başka biri aynı anda oluşturduysa tekrar oku
  IF rid IS NULL THEN
    SELECT id INTO rid
    FROM public.rooms
    WHERE group_type = 'birth_club' AND cohort = p_cohort
    LIMIT 1;
  END IF;

  RETURN rid;
END; $$;

REVOKE ALL ON FUNCTION public.get_or_create_birth_club(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_birth_club(uuid, text, text) TO authenticated;
