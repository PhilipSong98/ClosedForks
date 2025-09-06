-- Add denormalized aggregate columns and triggers for better performance
-- This eliminates the need for expensive real-time calculations

-- Step 1: Add denormalized columns to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS cached_avg_rating NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cached_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_review_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS aggregates_updated_at TIMESTAMPTZ DEFAULT now();

-- Add index for sorting by cached data
CREATE INDEX IF NOT EXISTS idx_restaurants_cached_rating 
ON restaurants(cached_avg_rating DESC, cached_review_count DESC, id);

CREATE INDEX IF NOT EXISTS idx_restaurants_cached_review_count 
ON restaurants(cached_review_count DESC, created_at DESC, id);

-- Step 2: Create function to update restaurant aggregates
CREATE OR REPLACE FUNCTION update_restaurant_aggregates(restaurant_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  avg_rating NUMERIC;
  review_count INTEGER;
  aggregated_tags TEXT[];
  last_review TIMESTAMPTZ;
BEGIN
  -- Calculate aggregates for this restaurant across all groups
  SELECT 
    COALESCE(ROUND(AVG(rating_overall), 1), 0),
    COUNT(*)::INTEGER,
    ARRAY(
      SELECT DISTINCT unnest(tags)
      FROM reviews 
      WHERE restaurant_id = restaurant_id_param
        AND tags IS NOT NULL 
        AND array_length(tags, 1) > 0
    ),
    MAX(created_at)
  INTO avg_rating, review_count, aggregated_tags, last_review
  FROM reviews 
  WHERE restaurant_id = restaurant_id_param
    AND rating_overall IS NOT NULL;

  -- Update the restaurant with cached aggregates
  UPDATE restaurants 
  SET 
    cached_avg_rating = avg_rating,
    cached_review_count = review_count,
    cached_tags = COALESCE(aggregated_tags, '{}'),
    last_review_at = last_review,
    aggregates_updated_at = now()
  WHERE id = restaurant_id_param;
END;
$$;

-- Step 3: Create trigger function for review changes
CREATE OR REPLACE FUNCTION trigger_update_restaurant_aggregates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Update aggregates for the new/updated restaurant
    PERFORM update_restaurant_aggregates(NEW.restaurant_id);
    
    -- If restaurant_id changed in update, also update the old restaurant
    IF TG_OP = 'UPDATE' AND OLD.restaurant_id != NEW.restaurant_id THEN
      PERFORM update_restaurant_aggregates(OLD.restaurant_id);
    END IF;
    
    RETURN NEW;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    PERFORM update_restaurant_aggregates(OLD.restaurant_id);
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Step 4: Create triggers
DROP TRIGGER IF EXISTS trigger_reviews_update_aggregates ON reviews;
CREATE TRIGGER trigger_reviews_update_aggregates
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_restaurant_aggregates();

-- Step 5: Create function to refresh all aggregates (for maintenance)
CREATE OR REPLACE FUNCTION refresh_all_restaurant_aggregates()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
  restaurant_record RECORD;
BEGIN
  -- Update aggregates for all restaurants
  FOR restaurant_record IN SELECT id FROM restaurants LOOP
    PERFORM update_restaurant_aggregates(restaurant_record.id);
    updated_count := updated_count + 1;
  END LOOP;
  
  RETURN updated_count;
END;
$$;

-- Step 6: Initial population of cached data
SELECT refresh_all_restaurant_aggregates();

-- Step 7: Add denormalized author names to reviews (optional for future optimization)
-- This would eliminate the need to join with users table
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS cached_author_name TEXT,
ADD COLUMN IF NOT EXISTS cached_restaurant_name TEXT;

-- Create function to update denormalized names
CREATE OR REPLACE FUNCTION update_review_denormalized_data(review_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE reviews 
  SET 
    cached_author_name = u.name,
    cached_restaurant_name = r.name
  FROM users u, restaurants r
  WHERE reviews.id = review_id_param
    AND reviews.author_id = u.id
    AND reviews.restaurant_id = r.id;
END;
$$;

-- Trigger function for review denormalized data
CREATE OR REPLACE FUNCTION trigger_update_review_denormalized_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    PERFORM update_review_denormalized_data(NEW.id);
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create trigger for review denormalized data
DROP TRIGGER IF EXISTS trigger_reviews_update_denormalized_data ON reviews;
CREATE TRIGGER trigger_reviews_update_denormalized_data
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_review_denormalized_data();

-- Step 8: Create triggers for user and restaurant name changes
CREATE OR REPLACE FUNCTION trigger_update_user_name_in_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
    UPDATE reviews 
    SET cached_author_name = NEW.name
    WHERE author_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION trigger_update_restaurant_name_in_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.name != NEW.name THEN
    UPDATE reviews 
    SET cached_restaurant_name = NEW.name
    WHERE restaurant_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for name updates
DROP TRIGGER IF EXISTS trigger_users_update_name_in_reviews ON users;
CREATE TRIGGER trigger_users_update_name_in_reviews
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION trigger_update_user_name_in_reviews();

DROP TRIGGER IF EXISTS trigger_restaurants_update_name_in_reviews ON restaurants;
CREATE TRIGGER trigger_restaurants_update_name_in_reviews
  AFTER UPDATE ON restaurants
  FOR EACH ROW
  WHEN (OLD.name IS DISTINCT FROM NEW.name)
  EXECUTE FUNCTION trigger_update_restaurant_name_in_reviews();

-- Step 9: Initial population of denormalized names
-- Temporarily disable triggers to avoid recursion during bulk update
-- Only disable if they exist (they were created above)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reviews_update_denormalized_data') THEN
    ALTER TABLE reviews DISABLE TRIGGER trigger_reviews_update_denormalized_data;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reviews_update_aggregates') THEN
    ALTER TABLE reviews DISABLE TRIGGER trigger_reviews_update_aggregates;
  END IF;
END
$$;

UPDATE reviews 
SET 
  cached_author_name = u.name,
  cached_restaurant_name = r.name
FROM users u, restaurants r
WHERE reviews.author_id = u.id
  AND reviews.restaurant_id = r.id;

-- Re-enable triggers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reviews_update_denormalized_data') THEN
    ALTER TABLE reviews ENABLE TRIGGER trigger_reviews_update_denormalized_data;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_reviews_update_aggregates') THEN
    ALTER TABLE reviews ENABLE TRIGGER trigger_reviews_update_aggregates;
  END IF;
END
$$;

-- Add helpful comments
COMMENT ON COLUMN restaurants.cached_avg_rating IS 'Denormalized average rating, updated via trigger';
COMMENT ON COLUMN restaurants.cached_review_count IS 'Denormalized review count, updated via trigger';
COMMENT ON COLUMN restaurants.cached_tags IS 'Denormalized aggregated tags, updated via trigger';
COMMENT ON COLUMN restaurants.last_review_at IS 'Timestamp of most recent review, used for sorting';
COMMENT ON COLUMN reviews.cached_author_name IS 'Denormalized author name, updated via trigger';
COMMENT ON COLUMN reviews.cached_restaurant_name IS 'Denormalized restaurant name, updated via trigger';

COMMENT ON FUNCTION update_restaurant_aggregates(UUID) IS 'Updates cached aggregates for a single restaurant';
COMMENT ON FUNCTION refresh_all_restaurant_aggregates() IS 'Refreshes cached aggregates for all restaurants, returns count updated';
COMMENT ON FUNCTION trigger_update_restaurant_aggregates() IS 'Trigger function to maintain restaurant aggregates';

-- Create index on new denormalized columns
CREATE INDEX IF NOT EXISTS idx_reviews_cached_names 
ON reviews(cached_author_name, cached_restaurant_name) 
INCLUDE (created_at, rating_overall, like_count);

-- Performance monitoring view
CREATE OR REPLACE VIEW restaurant_performance_stats AS
SELECT 
  r.id,
  r.name,
  r.cached_avg_rating,
  r.cached_review_count,
  r.last_review_at,
  r.aggregates_updated_at,
  CASE 
    WHEN r.cached_review_count > 0 THEN 'active'
    ELSE 'no_reviews'
  END as status,
  array_length(r.cached_tags, 1) as tag_count
FROM restaurants r
ORDER BY r.cached_review_count DESC, r.cached_avg_rating DESC;

COMMENT ON VIEW restaurant_performance_stats IS 'View for monitoring cached aggregate performance and data freshness';