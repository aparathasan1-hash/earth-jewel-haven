-- ============================================================
-- EARTH JEWEL HAVEN — Faz 2: Onboarding + Keşif temeli
-- Idempotent. user_preferences genişletme + rooms grup alanları.
-- ============================================================

-- ------------------------------------------------------------
-- 1) user_preferences: onboarding + keşif alanları
-- ------------------------------------------------------------
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- Mevcut tüm profillere bir tercih satırı garanti et
INSERT INTO public.user_preferences (user_id)
SELECT id FROM public.profiles
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Mevcut (zaten içerik üretmiş) kullanıcılar onboarding'e takılmasın:
-- bir bebeği veya en az bir mesajı/paylaşımı olanı onboarded say.
UPDATE public.user_preferences up
SET onboarded = true
WHERE onboarded = false
  AND (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.user_id = up.user_id)
    OR EXISTS (SELECT 1 FROM public.posts p WHERE p.user_id = up.user_id)
    OR EXISTS (SELECT 1 FROM public.room_messages m WHERE m.user_id = up.user_id)
  );

-- Keşifte şehir/ilgi alanı filtrelemesi için indeksler
CREATE INDEX IF NOT EXISTS idx_user_preferences_city ON public.user_preferences(city);
CREATE INDEX IF NOT EXISTS idx_user_preferences_interests ON public.user_preferences USING gin(interests);

-- ------------------------------------------------------------
-- 2) rooms: Birth Club / konu grubu alanları (UI sonraki turda)
--    Mevcut 6 çekirdek oda 'core' kalır; yeni gruplar 'topic'/'birth_club'.
-- ------------------------------------------------------------
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS group_type text NOT NULL DEFAULT 'core'
    CHECK (group_type IN ('core','topic','birth_club'));
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS cohort text;  -- örn. doğum ayı '2026-03'

CREATE INDEX IF NOT EXISTS idx_rooms_group_type ON public.rooms(group_type);
CREATE INDEX IF NOT EXISTS idx_rooms_cohort ON public.rooms(cohort);

-- ------------------------------------------------------------
-- 3) Arkadaş keşfi (SECURITY DEFINER — başkalarının tercih satırını
--    güvenle okur; gizlilik kuralını uygular). İstemci RLS'i
--    user_preferences'ta yalnızca kendi satırına izin verdiği için
--    eşleştirme sunucu tarafında bu fonksiyonla yapılır.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.discover_profiles(p_viewer uuid, p_limit int DEFAULT 30)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  avatar_url text,
  bio text,
  baby_birth_date date,
  city text,
  shared_interests int,
  same_city boolean,
  baby_age_days_diff int
)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  WITH me AS (
    SELECT up.city AS my_city, up.interests AS my_interests, p.baby_birth_date AS my_bbd
    FROM public.profiles p
    LEFT JOIN public.user_preferences up ON up.user_id = p.id
    WHERE p.id = p_viewer
  )
  SELECT
    p.id,
    p.username,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.baby_birth_date::date,
    up.city,
    COALESCE(array_length(ARRAY(
      SELECT unnest(COALESCE(up.interests, '{}')) INTERSECT SELECT unnest(COALESCE(me.my_interests, '{}'))
    ), 1), 0) AS shared_interests,
    (up.city IS NOT NULL AND up.city = me.my_city) AS same_city,
    CASE
      WHEN p.baby_birth_date IS NOT NULL AND me.my_bbd IS NOT NULL
      THEN ABS(p.baby_birth_date::date - me.my_bbd::date)
      ELSE NULL
    END AS baby_age_days_diff
  FROM public.profiles p
  CROSS JOIN me
  LEFT JOIN public.user_preferences up ON up.user_id = p.id
  WHERE p.id <> p_viewer
    -- private profiller keşifte görünmez (varsayılan 'public')
    AND COALESCE(up.profile_visibility, 'public') <> 'private'
    -- zaten bağlantı (istek/arkadaş) olanları hariç tut
    AND NOT EXISTS (
      SELECT 1 FROM public.connections c
      WHERE (c.requester_id = p_viewer AND c.addressee_id = p.id)
         OR (c.requester_id = p.id AND c.addressee_id = p_viewer)
    )
  ORDER BY same_city DESC, shared_interests DESC,
           baby_age_days_diff ASC NULLS LAST, p.created_at DESC
  LIMIT p_limit;
$$;

REVOKE ALL ON FUNCTION public.discover_profiles(uuid, int) FROM public;
GRANT EXECUTE ON FUNCTION public.discover_profiles(uuid, int) TO authenticated;
