-- Optimized group reviews and atomic like toggle

-- 1) Optimized group reviews with keyset pagination and optional restaurant filter
DROP FUNCTION IF EXISTS get_group_reviews_optimized(UUID, UUID, TIMESTAMPTZ, UUID, INT, UUID);
CREATE OR REPLACE FUNCTION get_group_reviews_optimized(
  group_id_param UUID,
  user_id_param UUID DEFAULT auth.uid(),
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_param INT DEFAULT 15,
  restaurant_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  review_id UUID,
  restaurant_id UUID,
  author_id UUID,
  rating_overall NUMERIC,
  dish TEXT,
  review_text TEXT,
  recommend BOOLEAN,
  tips TEXT,
  tags TEXT[],
  visit_date DATE,
  price_per_person NUMERIC,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  like_count INTEGER,
  group_id UUID,

  author_name TEXT,
  author_full_name TEXT,
  author_email TEXT,
  author_avatar_url TEXT,

  restaurant_name TEXT,
  restaurant_city TEXT,
  restaurant_address TEXT,
  restaurant_price_level INTEGER,
  restaurant_cuisine TEXT[],
  restaurant_google_place_id TEXT,
  restaurant_google_maps_url TEXT,
  restaurant_google_data JSONB,
  restaurant_lat DOUBLE PRECISION,
  restaurant_lng DOUBLE PRECISION,

  restaurant_avg_rating NUMERIC,
  restaurant_review_count BIGINT,

  is_liked_by_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Access control: require membership in the group
  IF NOT EXISTS (
    SELECT 1 FROM user_groups ug
    WHERE ug.user_id = user_id_param
      AND ug.group_id = group_id_param
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH accessible_reviews AS (
    SELECT r.*
    FROM reviews r
    WHERE r.group_id = group_id_param
      AND (restaurant_id_filter IS NULL OR r.restaurant_id = restaurant_id_filter)
      AND (
        cursor_created_at IS NULL OR
        r.created_at < cursor_created_at OR
        (r.created_at = cursor_created_at AND r.id < cursor_id)
      )
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT limit_param
  ),
  restaurant_stats AS (
    SELECT 
      r2.restaurant_id,
      ROUND(AVG(r2.rating_overall), 1) AS avg_rating,
      COUNT(*)::BIGINT AS review_count
    FROM reviews r2
    WHERE r2.restaurant_id IN (SELECT ar.restaurant_id FROM accessible_reviews ar)
      AND r2.rating_overall IS NOT NULL
    GROUP BY r2.restaurant_id
  ),
  user_likes_cte AS (
    SELECT rl.review_id
    FROM review_likes rl
    WHERE rl.user_id = user_id_param
      AND rl.review_id IN (SELECT ar.id FROM accessible_reviews ar)
  )
  SELECT 
    ar.id AS review_id,
    ar.restaurant_id,
    ar.author_id,
    ar.rating_overall,
    ar.dish,
    ar.review AS review_text,
    ar.recommend,
    ar.tips,
    ar.tags,
    ar.visit_date,
    ar.price_per_person,
    ar.created_at,
    ar.updated_at,
    ar.like_count,
    ar.group_id,

    u.name AS author_name,
    u.full_name AS author_full_name,
    u.email AS author_email,
    u.avatar_url AS author_avatar_url,

    rest.name AS restaurant_name,
    rest.city AS restaurant_city,
    rest.address AS restaurant_address,
    rest.price_level AS restaurant_price_level,
    rest.cuisine AS restaurant_cuisine,
    rest.google_place_id AS restaurant_google_place_id,
    rest.google_maps_url AS restaurant_google_maps_url,
    rest.google_data AS restaurant_google_data,
    rest.lat AS restaurant_lat,
    rest.lng AS restaurant_lng,

    COALESCE(rs.avg_rating, 0) AS restaurant_avg_rating,
    COALESCE(rs.review_count, 0) AS restaurant_review_count,

    (ulc.review_id IS NOT NULL) AS is_liked_by_user
  FROM accessible_reviews ar
  JOIN users u ON u.id = ar.author_id
  JOIN restaurants rest ON rest.id = ar.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ar.restaurant_id
  LEFT JOIN user_likes_cte ulc ON ulc.review_id = ar.id
  ORDER BY ar.created_at DESC, ar.id DESC;
END;
$$;

COMMENT ON FUNCTION get_group_reviews_optimized(UUID, UUID, TIMESTAMPTZ, UUID, INT, UUID)
  IS 'Optimized group reviews with denormalized author/restaurant data and keyset pagination with optional restaurant filter.';

-- 2) Atomic like toggle function
DROP FUNCTION IF EXISTS toggle_review_like(UUID, UUID);
CREATE OR REPLACE FUNCTION toggle_review_like(
  review_id_param UUID,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  is_liked BOOLEAN,
  like_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted BOOLEAN := FALSE;
BEGIN
  -- Ensure the review exists
  IF NOT EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id_param) THEN
    RETURN QUERY SELECT FALSE, 0; -- caller should handle not found separately
    RETURN;
  END IF;

  -- Try to insert a like
  BEGIN
    INSERT INTO review_likes (review_id, user_id) VALUES (review_id_param, user_id_param);
    inserted := TRUE;
  EXCEPTION WHEN unique_violation THEN
    -- Already liked: remove like
    DELETE FROM review_likes WHERE review_id = review_id_param AND user_id = user_id_param;
    inserted := FALSE;
  END;

  -- Return current like state and count from reviews.like_count (maintained by trigger)
  RETURN QUERY
  SELECT inserted AS is_liked,
         (SELECT like_count FROM reviews WHERE id = review_id_param) AS like_count;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_review_like(UUID, UUID) TO authenticated;
COMMENT ON FUNCTION toggle_review_like(UUID, UUID) IS 'Atomically toggles a like for a review and returns new state + like_count';
