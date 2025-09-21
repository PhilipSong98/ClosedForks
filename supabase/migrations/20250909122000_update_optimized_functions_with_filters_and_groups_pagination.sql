-- Extend optimized functions to support additional filters and keyset where needed

-- 1) Update get_user_feed_optimized to accept optional restaurant filter
DROP FUNCTION IF EXISTS get_user_feed_optimized(UUID, TIMESTAMPTZ, UUID, INT);
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

  is_liked_by_user BOOLEAN
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

COMMENT ON FUNCTION get_user_feed_optimized IS 'Homepage feed with optional restaurant filter and keyset pagination';

-- 2) Update liked reviews optimized to return liked timestamp
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
  like_created_at TIMESTAMPTZ
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
    ulr.like_created_at
  FROM user_liked_reviews ulr
  JOIN users u ON u.id = ulr.author_id
  JOIN restaurants rest ON rest.id = ulr.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ulr.restaurant_id
  ORDER BY ulr.like_created_at DESC, ulr.id DESC;
END;
$$;

COMMENT ON FUNCTION get_user_liked_reviews_optimized IS 'Optimized liked reviews with like timestamp and keyset pagination';

-- 3) Optional: add limit/offset to get_user_groups for server-side pagination (backward compatible)
DROP FUNCTION IF EXISTS get_user_groups(UUID);
CREATE OR REPLACE FUNCTION get_user_groups(
  user_id_param UUID DEFAULT auth.uid(),
  limit_param INT DEFAULT NULL,
  offset_param INT DEFAULT NULL,
  cursor_joined_at TIMESTAMPTZ DEFAULT NULL,
  cursor_group_id UUID DEFAULT NULL
)
RETURNS TABLE (
  group_id UUID,
  group_name TEXT,
  group_description TEXT,
  user_role group_role,
  member_count BIGINT,
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      g.id AS group_id,
      g.name AS group_name,
      g.description AS group_description,
      ug.role AS user_role,
      (SELECT COUNT(*) FROM user_groups ug2 WHERE ug2.group_id = g.id) AS member_count,
      ug.joined_at,
      g.created_at
    FROM groups g
    JOIN user_groups ug ON g.id = ug.group_id
    WHERE ug.user_id = user_id_param
  ),
  paged AS (
    SELECT * FROM base
    WHERE (
      cursor_joined_at IS NULL OR
      joined_at < cursor_joined_at OR
      (joined_at = cursor_joined_at AND group_id < cursor_group_id)
    )
    ORDER BY joined_at DESC, group_id DESC
    LIMIT COALESCE(limit_param, 100000000)
    OFFSET COALESCE(offset_param, 0)
  )
  SELECT * FROM paged;
END;
$$;

COMMENT ON FUNCTION get_user_groups IS 'User groups with optional limit/offset or keyset pagination';
