-- Optimized database functions to eliminate N+1 queries
-- This migration adds functions that return complete, denormalized data in a single query

-- 1. Optimized homepage reviews feed function
-- Replaces the current pattern of: get reviews -> get authors -> get restaurants -> get likes
-- With a single query that returns everything needed for the homepage
CREATE OR REPLACE FUNCTION get_user_feed_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_param INT DEFAULT 15
)
RETURNS TABLE (
  -- Review fields
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
  
  -- Author fields (denormalized to avoid separate query)
  author_name TEXT,
  author_full_name TEXT,
  author_email TEXT,
  author_avatar_url TEXT,
  
  -- Restaurant fields (denormalized to avoid separate query)
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
  
  -- Pre-calculated restaurant stats (avoids expensive recalculation)
  restaurant_avg_rating NUMERIC,
  restaurant_review_count BIGINT,
  
  -- User-specific data
  is_liked_by_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_groups_cte AS (
    -- Get all groups this user belongs to (cached for reuse)
    SELECT group_id 
    FROM user_groups 
    WHERE user_id = user_id_param
  ),
  accessible_reviews AS (
    -- Get reviews from user's groups with keyset pagination
    SELECT DISTINCT r.*
    FROM reviews r
    JOIN user_groups_cte ugc ON ugc.group_id = r.group_id
    WHERE (
      cursor_created_at IS NULL OR 
      r.created_at < cursor_created_at OR 
      (r.created_at = cursor_created_at AND r.id < cursor_id)
    )
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT limit_param
  ),
  restaurant_stats AS (
    -- Pre-calculate restaurant statistics for all restaurants in this batch
    -- This avoids the expensive recalculation happening in the current endpoint
    SELECT 
      restaurant_id,
      ROUND(AVG(rating_overall), 1) as avg_rating,
      COUNT(*)::BIGINT as review_count
    FROM reviews r2
    JOIN user_groups_cte ugc ON ugc.group_id = r2.group_id  -- Only count reviews user can see
    WHERE r2.restaurant_id IN (SELECT restaurant_id FROM accessible_reviews)
      AND r2.rating_overall IS NOT NULL
    GROUP BY restaurant_id
  ),
  user_likes_cte AS (
    -- Get user's like status for all reviews in this batch
    SELECT review_id
    FROM review_likes 
    WHERE user_id = user_id_param 
      AND review_id IN (SELECT id FROM accessible_reviews)
  )
  -- Main query with all joins done once
  SELECT 
    -- Review fields
    ar.id as review_id,
    ar.restaurant_id,
    ar.author_id,
    ar.rating_overall,
    ar.dish,
    ar.review as review_text,
    ar.recommend,
    ar.tips,
    ar.tags,
    ar.visit_date,
    ar.price_per_person,
    ar.created_at,
    ar.updated_at,
    ar.like_count,
    ar.group_id,
    
    -- Author fields (joined once)
    u.name as author_name,
    u.full_name as author_full_name,
    u.email as author_email,
    u.avatar_url as author_avatar_url,
    
    -- Restaurant fields (joined once)
    rest.name as restaurant_name,
    rest.city as restaurant_city,
    rest.address as restaurant_address,
    rest.price_level as restaurant_price_level,
    rest.cuisine as restaurant_cuisine,
    rest.google_place_id as restaurant_google_place_id,
    rest.google_maps_url as restaurant_google_maps_url,
    rest.google_data as restaurant_google_data,
    rest.lat as restaurant_lat,
    rest.lng as restaurant_lng,
    
    -- Pre-calculated restaurant stats
    COALESCE(rs.avg_rating, 0) as restaurant_avg_rating,
    COALESCE(rs.review_count, 0) as restaurant_review_count,
    
    -- User-specific data
    (ulc.review_id IS NOT NULL) as is_liked_by_user
    
  FROM accessible_reviews ar
  JOIN users u ON u.id = ar.author_id
  JOIN restaurants rest ON rest.id = ar.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ar.restaurant_id
  LEFT JOIN user_likes_cte ulc ON ulc.review_id = ar.id
  ORDER BY ar.created_at DESC, ar.id DESC;
END;
$$;

-- 2. Optimized restaurants with reviews function (for restaurants page)
-- This improves the existing function by adding better filtering and pagination
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
AS $$
BEGIN
  RETURN QUERY
  WITH user_groups_cte AS (
    -- Get all groups this user belongs to
    SELECT group_id 
    FROM user_groups 
    WHERE user_id = user_id_param
  ),
  restaurant_reviews AS (
    -- Get all reviews for restaurants from user's groups with filtering
    SELECT DISTINCT
      r.restaurant_id,
      r.rating_overall,
      r.tags
    FROM reviews r
    JOIN user_groups_cte ugc ON ugc.group_id = r.group_id
    WHERE r.rating_overall IS NOT NULL
      AND (min_rating = 0 OR r.rating_overall >= min_rating)
      AND (tags_filter IS NULL OR r.tags && tags_filter)  -- Array overlap operator
  ),
  restaurant_aggregates AS (
    -- Calculate aggregates per restaurant with proper filtering
    SELECT 
      rr.restaurant_id,
      ROUND(AVG(rr.rating_overall), 1) as avg_rating,
      COUNT(*)::BIGINT as review_count,
      -- Efficient tag aggregation
      ARRAY(
        SELECT DISTINCT unnest(tags)
        FROM restaurant_reviews rr2
        WHERE rr2.restaurant_id = rr.restaurant_id 
          AND tags IS NOT NULL 
          AND array_length(tags, 1) > 0
      ) as aggregated_tags
    FROM restaurant_reviews rr
    GROUP BY rr.restaurant_id
    HAVING COUNT(*) > 0  -- Only restaurants with reviews
      AND (min_rating = 0 OR AVG(rr.rating_overall) >= min_rating)
  )
  -- Join with restaurant data and apply keyset pagination
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

-- 3. Optimized function for user's liked reviews (for profile page)
CREATE OR REPLACE FUNCTION get_user_liked_reviews_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_param INT DEFAULT 15
)
RETURNS TABLE (
  -- Same structure as main feed for consistency
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
  
  is_liked_by_user BOOLEAN  -- Always true for this function
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_groups_cte AS (
    SELECT group_id 
    FROM user_groups 
    WHERE user_id = user_id_param
  ),
  user_liked_reviews AS (
    -- Get liked reviews with group filtering and keyset pagination
    SELECT DISTINCT r.*, rl.created_at as like_created_at
    FROM reviews r
    JOIN review_likes rl ON rl.review_id = r.id
    JOIN user_groups_cte ugc ON ugc.group_id = r.group_id  -- Only show likes for accessible reviews
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
    SELECT 
      restaurant_id,
      ROUND(AVG(rating_overall), 1) as avg_rating,
      COUNT(*)::BIGINT as review_count
    FROM reviews r2
    JOIN user_groups_cte ugc ON ugc.group_id = r2.group_id
    WHERE r2.restaurant_id IN (SELECT restaurant_id FROM user_liked_reviews)
      AND r2.rating_overall IS NOT NULL
    GROUP BY restaurant_id
  )
  SELECT 
    ulr.id as review_id,
    ulr.restaurant_id,
    ulr.author_id,
    ulr.rating_overall,
    ulr.dish,
    ulr.review as review_text,
    ulr.recommend,
    ulr.tips,
    ulr.tags,
    ulr.visit_date,
    ulr.price_per_person,
    ulr.created_at,
    ulr.updated_at,
    ulr.like_count,
    ulr.group_id,
    
    u.name as author_name,
    u.full_name as author_full_name,
    u.email as author_email,
    u.avatar_url as author_avatar_url,
    
    rest.name as restaurant_name,
    rest.city as restaurant_city,
    rest.address as restaurant_address,
    rest.price_level as restaurant_price_level,
    rest.cuisine as restaurant_cuisine,
    rest.google_place_id as restaurant_google_place_id,
    rest.google_maps_url as restaurant_google_maps_url,
    rest.google_data as restaurant_google_data,
    rest.lat as restaurant_lat,
    rest.lng as restaurant_lng,
    
    COALESCE(rs.avg_rating, 0) as restaurant_avg_rating,
    COALESCE(rs.review_count, 0) as restaurant_review_count,
    
    TRUE as is_liked_by_user
    
  FROM user_liked_reviews ulr
  JOIN users u ON u.id = ulr.author_id
  JOIN restaurants rest ON rest.id = ulr.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ulr.restaurant_id
  ORDER BY ulr.like_created_at DESC, ulr.id DESC;
END;
$$;

-- Add helpful comments
COMMENT ON FUNCTION get_user_feed_optimized IS 'Single-query function for homepage feed, eliminates N+1 queries by returning all needed data denormalized';
COMMENT ON FUNCTION get_restaurants_feed_optimized IS 'Optimized restaurants feed with server-side filtering and keyset pagination';
COMMENT ON FUNCTION get_user_liked_reviews_optimized IS 'Single-query function for user liked reviews with full denormalized data';