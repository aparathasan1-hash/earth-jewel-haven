-- ============================================================
-- EARTH JEWEL HAVEN — Davet / Referral Sistemi (büyüme)
-- Idempotent. user_preferences.referral_code (benzersiz) +
-- referrals tablosu + SECURITY DEFINER redeem/kod fonksiyonları.
-- Davet kaydı YALNIZ güvenilir redeem_referral fn ile (auth.uid temelli)
-- oluşur → istemci sahte atfı yapamaz.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Her kullanıcıya benzersiz davet kodu
-- ------------------------------------------------------------
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS referral_code text;

-- Karışık karakterler (0/O, 1/I) hariç 7 haneli kod üretir (çakışmasız)
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text
LANGUAGE plpgsql AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..7 LOOP
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.user_preferences WHERE referral_code = code
    );
  END LOOP;
  RETURN code;
END;
$$;

-- Mevcut tüm tercih satırlarına kod ata (kodu olmayanlara)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT user_id FROM public.user_preferences WHERE referral_code IS NULL LOOP
    UPDATE public.user_preferences
      SET referral_code = public.gen_referral_code()
      WHERE user_id = r.user_id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_preferences_referral_code
  ON public.user_preferences(referral_code);

-- Giriş yapan kullanıcının kodunu döndürür; yoksa üretip kaydeder.
CREATE OR REPLACE FUNCTION public.get_or_create_my_referral_code()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.user_preferences (user_id) VALUES (v_uid)
    ON CONFLICT (user_id) DO NOTHING;
  SELECT referral_code INTO v_code FROM public.user_preferences WHERE user_id = v_uid;
  IF v_code IS NULL THEN
    v_code := public.gen_referral_code();
    UPDATE public.user_preferences SET referral_code = v_code WHERE user_id = v_uid;
  END IF;
  RETURN v_code;
END;
$$;
REVOKE ALL ON FUNCTION public.get_or_create_my_referral_code() FROM public;
GRANT EXECUTE ON FUNCTION public.get_or_create_my_referral_code() TO authenticated;

-- ------------------------------------------------------------
-- 2) referrals tablosu (kim kimi getirdi). referred_id UNIQUE:
--    bir kullanıcı yalnız bir kez davetli sayılır.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals(referrer_id, created_at DESC);

-- Davet eden VE davet edilen kendi satırlarını görebilir.
DROP POLICY IF EXISTS "View own referrals" ON public.referrals;
CREATE POLICY "View own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
-- INSERT/UPDATE/DELETE politikası YOK → istemci yazamaz; redeem fn (definer) yazar.

-- Davet kodunu kullan: çağıran = davet edilen. Davet edeni döndürür (veya NULL).
-- Korumalar: kimlik var, kendini davet edemez, zaten davetli ise no-op.
CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_referrer uuid;
  v_code text := upper(trim(p_code));
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  -- Zaten davetli → tekrar atfetme
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_id = v_uid) THEN
    RETURN NULL;
  END IF;
  SELECT user_id INTO v_referrer FROM public.user_preferences WHERE referral_code = v_code;
  IF v_referrer IS NULL OR v_referrer = v_uid THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.referrals (referrer_id, referred_id, code)
  VALUES (v_referrer, v_uid, v_code)
  ON CONFLICT (referred_id) DO NOTHING;
  RETURN v_referrer;
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_referral(text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_referral(text) TO authenticated;

-- ------------------------------------------------------------
-- 3) Bildirim tipi: 'referral_joined' ekle
-- ------------------------------------------------------------
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('friend_request','friend_accept','room_message','live_started','referral_joined'));
