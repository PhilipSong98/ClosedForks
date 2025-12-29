-- Author-Based Review Visibility
--
-- CHANGE: Reviews are now visible based on AUTHOR's group membership, not the review's group_id
-- This means: If a user is a member of a group, ALL their reviews are visible to that group
--
-- BEFORE: review visible if review.group_id matches viewer's groups
-- AFTER: review visible if review.author_id is a member of any group the viewer is in

-- ============================================================================
-- 1. UPDATE RLS POLICY
-- ============================================================================

-- Drop existing group_id based policy
DROP POLICY IF EXISTS "Users can view reviews from their groups" ON public.reviews;

-- Create new author-based visibility policy
-- A user can see a review if:
--   a) They are the author (can always see their own reviews)
--   b) The review's AUTHOR is a member of any group the viewer belongs to
CREATE POLICY "Users can view reviews from shared group members" ON public.reviews
    FOR SELECT
    USING (
        author_id = auth.uid()
        OR
        author_id IN (
            SELECT DISTINCT ug2.user_id
            FROM user_groups ug1
            JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
            WHERE ug1.user_id = auth.uid()
        )
    );

-- Add optimizing index for author-based lookups
CREATE INDEX IF NOT EXISTS idx_user_groups_group_user
    ON user_groups(group_id, user_id);

COMMENT ON POLICY "Users can view reviews from shared group members" ON public.reviews IS
    'AUTHOR-BASED VISIBILITY: Users can see reviews from anyone who shares at least one group with them';

-- ============================================================================
-- 2. UPDATE get_user_feed_optimized()
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

  is_liked_by_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Get all authors who share at least one group with the current user (AUTHOR-BASED)
  WITH visible_authors AS (
    SELECT DISTINCT ug2.user_id
    FROM user_groups ug1
    JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
    WHERE ug1.user_id = user_id_param
  ),
  accessible_reviews AS (
    -- Get reviews from visible authors (NOT based on review.group_id)
    SELECT r.*
    FROM reviews r
    WHERE r.author_id IN (SELECT user_id FROM visible_authors)
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
    WHERE r2.author_id IN (SELECT user_id FROM visible_authors)
      AND r2.restaurant_id IN (SELECT ar.restaurant_id FROM accessible_reviews ar)
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

COMMENT ON FUNCTION get_user_feed_optimized IS 'Homepage feed with AUTHOR-BASED visibility - shows reviews from all users who share groups with viewer';

-- ============================================================================
-- 3. UPDATE get_group_reviews_optimized()
-- ============================================================================

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
  -- Get all members of this group (AUTHOR-BASED visibility)
  WITH group_members AS (
    SELECT user_id FROM user_groups WHERE group_id = group_id_param
  ),
  accessible_reviews AS (
    -- Show ALL reviews from group members (not filtered by review.group_id)
    SELECT r.*
    FROM reviews r
    WHERE r.author_id IN (SELECT user_id FROM group_members)
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
    WHERE r2.author_id IN (SELECT user_id FROM group_members)
      AND r2.restaurant_id IN (SELECT ar.restaurant_id FROM accessible_reviews ar)
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
  IS 'Group reviews with AUTHOR-BASED visibility - shows ALL reviews from group members';

-- ============================================================================
-- 4. UPDATE get_user_liked_reviews_optimized()
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
  like_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Get all authors who share at least one group with the current user (AUTHOR-BASED)
  WITH visible_authors AS (
    SELECT DISTINCT ug2.user_id
    FROM user_groups ug1
    JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
    WHERE ug1.user_id = user_id_param
  ),
  user_liked_reviews AS (
    SELECT r.*, rl.created_at AS like_created_at
    FROM reviews r
    JOIN review_likes rl ON rl.review_id = r.id
    WHERE rl.user_id = user_id_param
      AND r.author_id IN (SELECT user_id FROM visible_authors)  -- AUTHOR-BASED visibility
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
    WHERE r2.author_id IN (SELECT user_id FROM visible_authors)
      AND r2.restaurant_id IN (SELECT ulr.restaurant_id FROM user_liked_reviews ulr)
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

COMMENT ON FUNCTION get_user_liked_reviews_optimized IS 'Liked reviews with AUTHOR-BASED visibility';

-- ============================================================================
-- 5. UPDATE get_restaurants_feed_optimized()
-- ============================================================================

DROP FUNCTION IF EXISTS get_restaurants_feed_optimized(UUID, BIGINT, TIMESTAMPTZ, UUID, NUMERIC, INT[], TEXT[], INT);

CREATE OR REPLACE FUNCTION get_restaurants_feed_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_review_count BIGINT DEFAULT NULL,
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  min_rating NUMERIC DEFAULT 0,
  price_levels INT[] DEFAULT NULL,
  tags_filter TEXT[] DEFAULT NULL,
  limit_param INT DEFAULT 15
)
RETURNS TABLE (
  restaurant_id UUID,
  restaurant_name TEXT,
  restaurant_address TEXT,
  restaurant_city TEXT,
  restaurant_cuisine TEXT[],
  restaurant_price_level INTEGER,
  restaurant_lat DOUBLE PRECISION,
  restaurant_lng DOUBLE PRECISION,
  restaurant_google_place_id TEXT,
  restaurant_google_maps_url TEXT,
  restaurant_google_data JSONB,
  restaurant_created_at TIMESTAMPTZ,
  avg_rating NUMERIC,
  review_count BIGINT,
  aggregated_tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Get all authors who share at least one group with the current user (AUTHOR-BASED)
  WITH visible_authors AS (
    SELECT DISTINCT ug2.user_id
    FROM user_groups ug1
    JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
    WHERE ug1.user_id = user_id_param
  ),
  restaurant_reviews AS (
    -- Get all reviews from visible authors (NOT based on review.group_id)
    SELECT DISTINCT
      r.restaurant_id,
      r.rating_overall,
      r.tags
    FROM reviews r
    WHERE r.author_id IN (SELECT user_id FROM visible_authors)
      AND r.rating_overall IS NOT NULL
      AND (min_rating = 0 OR r.rating_overall >= min_rating)
      AND (tags_filter IS NULL OR r.tags && tags_filter)
  ),
  restaurant_aggregates AS (
    SELECT
      rr.restaurant_id,
      ROUND(AVG(rr.rating_overall), 1) as avg_rating,
      COUNT(*)::BIGINT as review_count,
      ARRAY(
        SELECT DISTINCT unnest(tags)
        FROM restaurant_reviews rr2
        WHERE rr2.restaurant_id = rr.restaurant_id
          AND tags IS NOT NULL
          AND array_length(tags, 1) > 0
      ) as aggregated_tags
    FROM restaurant_reviews rr
    GROUP BY rr.restaurant_id
    HAVING COUNT(*) > 0
      AND (min_rating = 0 OR AVG(rr.rating_overall) >= min_rating)
  )
  SELECT
    rest.id as restaurant_id,
    rest.name as restaurant_name,
    rest.address as restaurant_address,
    rest.city as restaurant_city,
    rest.cuisine as restaurant_cuisine,
    rest.price_level as restaurant_price_level,
    rest.lat as restaurant_lat,
    rest.lng as restaurant_lng,
    rest.google_place_id as restaurant_google_place_id,
    rest.google_maps_url as restaurant_google_maps_url,
    rest.google_data as restaurant_google_data,
    rest.created_at as restaurant_created_at,
    ra.avg_rating,
    ra.review_count,
    ra.aggregated_tags
  FROM restaurants rest
  JOIN restaurant_aggregates ra ON ra.restaurant_id = rest.id
  WHERE (price_levels IS NULL OR rest.price_level = ANY(price_levels))
    AND (
      cursor_review_count IS NULL OR
      ra.review_count < cursor_review_count OR
      (ra.review_count = cursor_review_count AND rest.created_at < cursor_created_at) OR
      (ra.review_count = cursor_review_count AND rest.created_at = cursor_created_at AND rest.id < cursor_id)
    )
  ORDER BY ra.review_count DESC, rest.created_at DESC, rest.id DESC
  LIMIT limit_param;
END;
$$;

COMMENT ON FUNCTION get_restaurants_feed_optimized IS 'Restaurants feed with AUTHOR-BASED visibility - aggregates from visible authors reviews';
