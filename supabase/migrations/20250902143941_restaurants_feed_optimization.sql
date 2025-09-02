-- Restaurants Feed Optimization
-- Adds database function for efficient restaurant queries with review aggregations

-- ============================================================================
-- FUNCTION: GET USER RESTAURANTS WITH REVIEW AGGREGATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_restaurants_with_reviews(
    user_id_param UUID DEFAULT auth.uid(),
    limit_param INTEGER DEFAULT 15,
    offset_param INTEGER DEFAULT 0
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
        -- Get all reviews for restaurants from user's groups
        SELECT DISTINCT
            r.restaurant_id,
            r.rating_overall,
            r.tags
        FROM reviews r
        JOIN user_groups ug ON ug.group_id = r.group_id
        WHERE ug.user_id = user_id_param
    ),
    restaurant_aggregates AS (
        -- Calculate aggregates per restaurant with proper tag handling
        SELECT 
            rr.restaurant_id,
            ROUND(AVG(rr.rating_overall), 1) as avg_rating,
            COUNT(*)::BIGINT as review_count,
            -- Safe tag aggregation that handles empty arrays
            ARRAY(
                SELECT DISTINCT unnest(tags)
                FROM restaurant_reviews rr2
                WHERE rr2.restaurant_id = rr.restaurant_id 
                AND tags IS NOT NULL 
                AND array_length(tags, 1) > 0
            ) as aggregated_tags
        FROM restaurant_reviews rr
        GROUP BY rr.restaurant_id
    )
    -- Join with restaurant data and return results
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
        COALESCE(ra.avg_rating, 0) as avg_rating,
        COALESCE(ra.review_count, 0) as review_count,
        COALESCE(ra.aggregated_tags, ARRAY[]::TEXT[]) as aggregated_tags
    FROM restaurants rest
    LEFT JOIN restaurant_aggregates ra ON ra.restaurant_id = rest.id
    -- Only include restaurants that have reviews from user's groups or are in the database
    WHERE ra.restaurant_id IS NOT NULL OR EXISTS (
        SELECT 1 FROM user_groups_cte ugc 
        LIMIT 1 -- At least user is in one group
    )
    ORDER BY 
        COALESCE(ra.review_count, 0) DESC, -- Restaurants with more reviews first
        rest.created_at DESC -- Then by creation date
    LIMIT limit_param OFFSET offset_param;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_restaurants_with_reviews(UUID, INTEGER, INTEGER) TO authenticated;