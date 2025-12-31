-- Migration: Add dish_ratings to feed functions
-- Description: Updates get_user_feed_optimized and get_user_liked_reviews_optimized
-- to return dish_ratings as a JSONB array for displaying multiple dishes per review

-- ============================================================================
-- 1) Update get_user_feed_optimized to include dish_ratings
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_feed_optimized(UUID, TIMESTAMPTZ, UUID, INT, UUID);
CREATE OR REPLACE FUNCTION get_user_feed_optimized(
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

  is_liked_by_user BOOLEAN,

  -- NEW: dish_ratings as JSONB array
  dish_ratings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_groups_cte AS (
    SELECT ug.group_id
    FROM user_groups ug
    WHERE ug.user_id = user_id_param
  ),
  accessible_reviews AS (
    SELECT r.*
    FROM reviews r
    JOIN user_groups_cte ugc ON ugc.group_id = r.group_id
    WHERE (restaurant_id_filter IS NULL OR r.restaurant_id = restaurant_id_filter)
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
    JOIN user_groups_cte ugc ON ugc.group_id = r2.group_id
    WHERE r2.restaurant_id IN (SELECT ar.restaurant_id FROM accessible_reviews ar)
      AND r2.rating_overall IS NOT NULL
    GROUP BY r2.restaurant_id
  ),
  user_likes_cte AS (
    SELECT rl.review_id
    FROM review_likes rl
    WHERE rl.user_id = user_id_param
      AND rl.review_id IN (SELECT ar.id FROM accessible_reviews ar)
  ),
  -- NEW: Aggregate dish ratings for each review
  review_dish_ratings AS (
    SELECT
      dr.review_id,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', dr.id,
            'dish_name', dr.dish_name,
            'rating', dr.rating
          ) ORDER BY dr.created_at
        ),
        '[]'::jsonb
      ) AS dish_ratings
    FROM dish_ratings dr
    WHERE dr.review_id IN (SELECT ar.id FROM accessible_reviews ar)
    GROUP BY dr.review_id
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

    (ulc.review_id IS NOT NULL) AS is_liked_by_user,

    -- NEW: Include dish ratings (empty array if none)
    COALESCE(rdr.dish_ratings, '[]'::jsonb) AS dish_ratings
  FROM accessible_reviews ar
  JOIN users u ON u.id = ar.author_id
  JOIN restaurants rest ON rest.id = ar.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ar.restaurant_id
  LEFT JOIN user_likes_cte ulc ON ulc.review_id = ar.id
  LEFT JOIN review_dish_ratings rdr ON rdr.review_id = ar.id
  ORDER BY ar.created_at DESC, ar.id DESC;
END;
$$;

COMMENT ON FUNCTION get_user_feed_optimized IS 'Homepage feed with optional restaurant filter, keyset pagination, and dish ratings';

-- ============================================================================
-- 2) Update get_user_liked_reviews_optimized to include dish_ratings
-- ============================================================================

DROP FUNCTION IF EXISTS get_user_liked_reviews_optimized(UUID, TIMESTAMPTZ, UUID, INT);
CREATE OR REPLACE FUNCTION get_user_liked_reviews_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_param INT DEFAULT 15
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

  is_liked_by_user BOOLEAN,
  like_created_at TIMESTAMPTZ,

  -- NEW: dish_ratings as JSONB array
  dish_ratings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_groups_cte AS (
    SELECT ug.group_id FROM user_groups ug WHERE ug.user_id = user_id_param
  ),
  user_liked_reviews AS (
    SELECT r.*, rl.created_at AS like_created_at
    FROM reviews r
    JOIN review_likes rl ON rl.review_id = r.id
    JOIN user_groups_cte ugc ON ugc.group_id = r.group_id
    WHERE rl.user_id = user_id_param
      AND (
        cursor_created_at IS NULL OR
        rl.created_at < cursor_created_at OR
        (rl.created_at = cursor_created_at AND r.id < cursor_id)
      )
    ORDER BY rl.created_at DESC, r.id DESC
    LIMIT limit_param
  ),
  restaurant_stats AS (
    SELECT r2.restaurant_id,
           ROUND(AVG(r2.rating_overall), 1) AS avg_rating,
           COUNT(*)::BIGINT AS review_count
    FROM reviews r2
    JOIN user_groups_cte ugc ON ugc.group_id = r2.group_id
    WHERE r2.restaurant_id IN (SELECT ulr.restaurant_id FROM user_liked_reviews ulr)
      AND r2.rating_overall IS NOT NULL
    GROUP BY r2.restaurant_id
  ),
  -- NEW: Aggregate dish ratings for each review
  review_dish_ratings AS (
    SELECT
      dr.review_id,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', dr.id,
            'dish_name', dr.dish_name,
            'rating', dr.rating
          ) ORDER BY dr.created_at
        ),
        '[]'::jsonb
      ) AS dish_ratings
    FROM dish_ratings dr
    WHERE dr.review_id IN (SELECT ulr.id FROM user_liked_reviews ulr)
    GROUP BY dr.review_id
  )
  SELECT
    ulr.id AS review_id,
    ulr.restaurant_id,
    ulr.author_id,
    ulr.rating_overall,
    ulr.dish,
    ulr.review AS review_text,
    ulr.recommend,
    ulr.tips,
    ulr.tags,
    ulr.visit_date,
    ulr.price_per_person,
    ulr.created_at,
    ulr.updated_at,
    ulr.like_count,
    ulr.group_id,

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

    TRUE AS is_liked_by_user,
    ulr.like_created_at,

    -- NEW: Include dish ratings (empty array if none)
    COALESCE(rdr.dish_ratings, '[]'::jsonb) AS dish_ratings
  FROM user_liked_reviews ulr
  JOIN users u ON u.id = ulr.author_id
  JOIN restaurants rest ON rest.id = ulr.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ulr.restaurant_id
  LEFT JOIN review_dish_ratings rdr ON rdr.review_id = ulr.id
  ORDER BY ulr.like_created_at DESC, ulr.id DESC;
END;
$$;

COMMENT ON FUNCTION get_user_liked_reviews_optimized IS 'Optimized liked reviews with like timestamp, keyset pagination, and dish ratings';
