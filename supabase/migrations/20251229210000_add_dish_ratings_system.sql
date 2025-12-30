-- Migration: Add Dish-Level Rating System
-- Description: Adds tables for individual dish ratings within reviews, with autocomplete support
-- and cached aggregations per restaurant-dish combination

-- ============================================================================
-- PHASE 1: Create dish_ratings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS dish_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    dish_name_normalized TEXT NOT NULL,  -- Lowercase, trimmed for matching/autocomplete
    rating NUMERIC(2,1) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT dish_ratings_rating_range CHECK (rating >= 1.0 AND rating <= 5.0),
    CONSTRAINT dish_ratings_rating_precision CHECK (rating * 10 = FLOOR(rating * 10)),
    CONSTRAINT dish_ratings_name_not_empty CHECK (LENGTH(TRIM(dish_name)) > 0)
);

-- Indexes for dish_ratings
CREATE INDEX IF NOT EXISTS idx_dish_ratings_review ON dish_ratings(review_id);
CREATE INDEX IF NOT EXISTS idx_dish_ratings_restaurant ON dish_ratings(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dish_ratings_restaurant_name ON dish_ratings(restaurant_id, dish_name_normalized);
CREATE INDEX IF NOT EXISTS idx_dish_ratings_created_at ON dish_ratings(created_at DESC);

-- ============================================================================
-- PHASE 2: Create restaurant_dish_aggregates table (for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS restaurant_dish_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    dish_name_normalized TEXT NOT NULL,
    avg_rating NUMERIC(2,1) NOT NULL,
    rating_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT restaurant_dish_aggregates_unique UNIQUE(restaurant_id, dish_name_normalized)
);

-- Indexes for restaurant_dish_aggregates
CREATE INDEX IF NOT EXISTS idx_dish_aggregates_restaurant ON restaurant_dish_aggregates(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_dish_aggregates_rating_count ON restaurant_dish_aggregates(restaurant_id, rating_count DESC);
CREATE INDEX IF NOT EXISTS idx_dish_aggregates_name_search ON restaurant_dish_aggregates(restaurant_id, dish_name_normalized text_pattern_ops);

-- ============================================================================
-- PHASE 3: Trigger function to maintain aggregates
-- ============================================================================

CREATE OR REPLACE FUNCTION update_dish_aggregates()
RETURNS TRIGGER AS $$
DECLARE
    target_restaurant_id UUID;
    target_dish_name_normalized TEXT;
    new_avg NUMERIC(2,1);
    new_count INTEGER;
BEGIN
    -- Determine which restaurant/dish to update
    IF TG_OP = 'DELETE' THEN
        target_restaurant_id := OLD.restaurant_id;
        target_dish_name_normalized := OLD.dish_name_normalized;
    ELSE
        target_restaurant_id := NEW.restaurant_id;
        target_dish_name_normalized := NEW.dish_name_normalized;
    END IF;

    -- Calculate new aggregates
    SELECT
        ROUND(AVG(rating)::NUMERIC, 1),
        COUNT(*)::INTEGER
    INTO new_avg, new_count
    FROM dish_ratings
    WHERE restaurant_id = target_restaurant_id
      AND dish_name_normalized = target_dish_name_normalized;

    -- If no ratings left, delete the aggregate
    IF new_count = 0 OR new_count IS NULL THEN
        DELETE FROM restaurant_dish_aggregates
        WHERE restaurant_id = target_restaurant_id
          AND dish_name_normalized = target_dish_name_normalized;
    ELSE
        -- Upsert the aggregate
        INSERT INTO restaurant_dish_aggregates (
            restaurant_id,
            dish_name,
            dish_name_normalized,
            avg_rating,
            rating_count,
            last_updated
        )
        VALUES (
            target_restaurant_id,
            COALESCE(NEW.dish_name, (
                SELECT dish_name FROM dish_ratings
                WHERE restaurant_id = target_restaurant_id
                  AND dish_name_normalized = target_dish_name_normalized
                ORDER BY created_at DESC LIMIT 1
            )),
            target_dish_name_normalized,
            new_avg,
            new_count,
            NOW()
        )
        ON CONFLICT (restaurant_id, dish_name_normalized)
        DO UPDATE SET
            dish_name = EXCLUDED.dish_name,
            avg_rating = EXCLUDED.avg_rating,
            rating_count = EXCLUDED.rating_count,
            last_updated = NOW();
    END IF;

    -- For UPDATE, also handle the old dish if it changed
    IF TG_OP = 'UPDATE' AND OLD.dish_name_normalized != NEW.dish_name_normalized THEN
        -- Recalculate for the old dish
        SELECT
            ROUND(AVG(rating)::NUMERIC, 1),
            COUNT(*)::INTEGER
        INTO new_avg, new_count
        FROM dish_ratings
        WHERE restaurant_id = OLD.restaurant_id
          AND dish_name_normalized = OLD.dish_name_normalized;

        IF new_count = 0 OR new_count IS NULL THEN
            DELETE FROM restaurant_dish_aggregates
            WHERE restaurant_id = OLD.restaurant_id
              AND dish_name_normalized = OLD.dish_name_normalized;
        ELSE
            UPDATE restaurant_dish_aggregates
            SET avg_rating = new_avg,
                rating_count = new_count,
                last_updated = NOW()
            WHERE restaurant_id = OLD.restaurant_id
              AND dish_name_normalized = OLD.dish_name_normalized;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_dish_aggregates ON dish_ratings;
CREATE TRIGGER trigger_update_dish_aggregates
    AFTER INSERT OR UPDATE OR DELETE ON dish_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_dish_aggregates();

-- ============================================================================
-- PHASE 4: RLS Policies
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE dish_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_dish_aggregates ENABLE ROW LEVEL SECURITY;

-- dish_ratings: Users can view dish ratings for reviews they can see (same group)
CREATE POLICY "dish_ratings_select_policy" ON dish_ratings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN user_groups ug ON ug.group_id = r.group_id
            WHERE r.id = dish_ratings.review_id
              AND ug.user_id = auth.uid()
        )
    );

-- dish_ratings: Users can insert dish ratings for their own reviews
CREATE POLICY "dish_ratings_insert_policy" ON dish_ratings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews r
            WHERE r.id = review_id
              AND r.author_id = auth.uid()
        )
    );

-- dish_ratings: Users can update dish ratings for their own reviews
CREATE POLICY "dish_ratings_update_policy" ON dish_ratings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM reviews r
            WHERE r.id = review_id
              AND r.author_id = auth.uid()
        )
    );

-- dish_ratings: Users can delete dish ratings for their own reviews
CREATE POLICY "dish_ratings_delete_policy" ON dish_ratings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM reviews r
            WHERE r.id = review_id
              AND r.author_id = auth.uid()
        )
    );

-- restaurant_dish_aggregates: Authenticated users can view (public data)
CREATE POLICY "dish_aggregates_select_policy" ON restaurant_dish_aggregates
    FOR SELECT USING (auth.role() = 'authenticated');

-- ============================================================================
-- PHASE 5: Function for dish autocomplete (optimized)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dish_autocomplete(
    p_restaurant_id UUID,
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    dish_name TEXT,
    avg_rating NUMERIC(2,1),
    rating_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        rda.dish_name,
        rda.avg_rating,
        rda.rating_count
    FROM restaurant_dish_aggregates rda
    WHERE rda.restaurant_id = p_restaurant_id
      AND (
          p_query IS NULL
          OR p_query = ''
          OR rda.dish_name_normalized LIKE LOWER(TRIM(p_query)) || '%'
      )
    ORDER BY
        -- Exact match first
        CASE WHEN rda.dish_name_normalized = LOWER(TRIM(p_query)) THEN 0 ELSE 1 END,
        -- Then by popularity
        rda.rating_count DESC,
        -- Then alphabetically
        rda.dish_name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 6: Function to get dish ratings for a review
-- ============================================================================

CREATE OR REPLACE FUNCTION get_review_dish_ratings(p_review_id UUID)
RETURNS TABLE (
    id UUID,
    dish_name TEXT,
    rating NUMERIC(2,1)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dr.id,
        dr.dish_name,
        dr.rating
    FROM dish_ratings dr
    WHERE dr.review_id = p_review_id
    ORDER BY dr.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PHASE 7: Migrate existing dish data
-- ============================================================================

-- Migrate existing reviews that have a dish field to the new structure
-- Use the overall rating as the dish rating for legacy data
INSERT INTO dish_ratings (review_id, restaurant_id, dish_name, dish_name_normalized, rating)
SELECT
    r.id,
    r.restaurant_id,
    r.dish,
    LOWER(TRIM(r.dish)),
    r.rating_overall
FROM reviews r
WHERE r.dish IS NOT NULL
  AND TRIM(r.dish) != ''
  AND TRIM(r.dish) != 'Quick review'
  AND TRIM(r.dish) != 'Quick review - minimal input'
  AND TRIM(r.dish) != 'Not specified'
  AND NOT EXISTS (
      -- Don't duplicate if already migrated
      SELECT 1 FROM dish_ratings dr
      WHERE dr.review_id = r.id AND dr.dish_name_normalized = LOWER(TRIM(r.dish))
  )
ON CONFLICT DO NOTHING;

-- Note: The trigger will automatically populate restaurant_dish_aggregates
-- But let's ensure all aggregates are populated (in case trigger didn't fire)
INSERT INTO restaurant_dish_aggregates (restaurant_id, dish_name, dish_name_normalized, avg_rating, rating_count, last_updated)
SELECT
    dr.restaurant_id,
    MAX(dr.dish_name),  -- Use the most recent casing
    dr.dish_name_normalized,
    ROUND(AVG(dr.rating)::NUMERIC, 1),
    COUNT(*)::INTEGER,
    NOW()
FROM dish_ratings dr
GROUP BY dr.restaurant_id, dr.dish_name_normalized
ON CONFLICT (restaurant_id, dish_name_normalized)
DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    rating_count = EXCLUDED.rating_count,
    last_updated = NOW();

-- ============================================================================
-- PHASE 8: Grant permissions
-- ============================================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_dish_autocomplete(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_dish_ratings(UUID) TO authenticated;
