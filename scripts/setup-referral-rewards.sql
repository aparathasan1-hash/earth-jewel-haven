-- ============================================================
-- EARTH JEWEL HAVEN — Davet Ödülü (kilometre taşı rozetleri)
-- Idempotent. referrals'a yeni davet eklenince davet edene, eşik
-- sayılarında otomatik auto_badges (badge_type='referral') verir.
-- auto_badges UNIQUE(user_id,badge_type,badge_name) → tekrar vermez.
-- Trigger SECURITY DEFINER → auto_badges INSERT politikası gerektirmez.
-- ============================================================

CREATE OR REPLACE FUNCTION public.award_referral_badges()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count int;
BEGIN
  SELECT count(*) INTO v_count FROM public.referrals WHERE referrer_id = NEW.referrer_id;

  IF v_count >= 1 THEN
    INSERT INTO public.auto_badges (user_id, badge_type, badge_name, badge_icon)
    VALUES (NEW.referrer_id, 'referral', 'first_invite', '🌱')
    ON CONFLICT (user_id, badge_type, badge_name) DO NOTHING;
  END IF;
  IF v_count >= 3 THEN
    INSERT INTO public.auto_badges (user_id, badge_type, badge_name, badge_icon)
    VALUES (NEW.referrer_id, 'referral', 'village_builder', '🏡')
    ON CONFLICT (user_id, badge_type, badge_name) DO NOTHING;
  END IF;
  IF v_count >= 5 THEN
    INSERT INTO public.auto_badges (user_id, badge_type, badge_name, badge_icon)
    VALUES (NEW.referrer_id, 'referral', 'village_founder', '🌟')
    ON CONFLICT (user_id, badge_type, badge_name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_award_referral_badges ON public.referrals;
CREATE TRIGGER trg_award_referral_badges
  AFTER INSERT ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.award_referral_badges();

-- Mevcut davetler için geriye dönük rozet ver (eşiği zaten geçmiş olanlara).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT referrer_id, count(*) AS n FROM public.referrals GROUP BY referrer_id LOOP
    IF r.n >= 1 THEN
      INSERT INTO public.auto_badges (user_id, badge_type, badge_name, badge_icon)
      VALUES (r.referrer_id, 'referral', 'first_invite', '🌱')
      ON CONFLICT (user_id, badge_type, badge_name) DO NOTHING;
    END IF;
    IF r.n >= 3 THEN
      INSERT INTO public.auto_badges (user_id, badge_type, badge_name, badge_icon)
      VALUES (r.referrer_id, 'referral', 'village_builder', '🏡')
      ON CONFLICT (user_id, badge_type, badge_name) DO NOTHING;
    END IF;
    IF r.n >= 5 THEN
      INSERT INTO public.auto_badges (user_id, badge_type, badge_name, badge_icon)
      VALUES (r.referrer_id, 'referral', 'village_founder', '🌟')
      ON CONFLICT (user_id, badge_type, badge_name) DO NOTHING;
    END IF;
  END LOOP;
END $$;
