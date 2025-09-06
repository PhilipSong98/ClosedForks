-- Fix infinite recursion in review triggers causing stack depth limit exceeded
-- The issue: update_review_denormalized_data UPDATE triggers both triggers again

-- Step 1: Drop the problematic triggers
DROP TRIGGER IF EXISTS trigger_reviews_update_denormalized_data ON reviews;
DROP FUNCTION IF EXISTS trigger_update_review_denormalized_data();
DROP FUNCTION IF EXISTS update_review_denormalized_data(UUID);

-- Step 2: Create a BEFORE trigger that sets denormalized data during INSERT
-- This avoids the UPDATE that causes recursion
CREATE OR REPLACE FUNCTION trigger_set_review_denormalized_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  author_name_val TEXT;
  restaurant_name_val TEXT;
BEGIN
  -- Only run on INSERT, and only if cached fields are not already set
  IF TG_OP = 'INSERT' AND (NEW.cached_author_name IS NULL OR NEW.cached_restaurant_name IS NULL) THEN
    -- Get author name
    SELECT name INTO author_name_val 
    FROM users 
    WHERE id = NEW.author_id;
    
    -- Get restaurant name  
    SELECT name INTO restaurant_name_val
    FROM restaurants 
    WHERE id = NEW.restaurant_id;
    
    -- Set the cached values directly (no UPDATE needed, avoiding recursion)
    NEW.cached_author_name = COALESCE(author_name_val, '');
    NEW.cached_restaurant_name = COALESCE(restaurant_name_val, '');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create BEFORE trigger (fires before INSERT, sets values directly)
CREATE TRIGGER trigger_reviews_set_denormalized_data
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_review_denormalized_data();

-- Step 4: Create simpler UPDATE functions for name changes that avoid recursion
CREATE OR REPLACE FUNCTION trigger_update_user_name_in_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only update if name actually changed
  IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
    -- Update cached author names directly, no additional triggers
    UPDATE reviews 
    SET cached_author_name = NEW.name
    WHERE author_id = NEW.id
      AND cached_author_name != NEW.name; -- Avoid unnecessary updates
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
  -- Only update if name actually changed
  IF TG_OP = 'UPDATE' AND OLD.name IS DISTINCT FROM NEW.name THEN
    -- Update cached restaurant names directly, no additional triggers
    UPDATE reviews 
    SET cached_restaurant_name = NEW.name
    WHERE restaurant_id = NEW.id
      AND cached_restaurant_name != NEW.name; -- Avoid unnecessary updates
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Recreate the user and restaurant name change triggers (these were working)
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

-- Step 6: Backfill any existing reviews that don't have cached names
-- This is safe because we're using the BEFORE trigger now
UPDATE reviews 
SET 
  cached_author_name = COALESCE(u.name, ''),
  cached_restaurant_name = COALESCE(r.name, '')
FROM users u, restaurants r
WHERE reviews.author_id = u.id
  AND reviews.restaurant_id = r.id
  AND (reviews.cached_author_name IS NULL OR reviews.cached_restaurant_name IS NULL);

-- Add helpful comments
COMMENT ON FUNCTION trigger_set_review_denormalized_data IS 'BEFORE trigger that sets cached names during INSERT, avoiding recursion from UPDATE operations';
COMMENT ON TRIGGER trigger_reviews_set_denormalized_data ON reviews IS 'Sets denormalized author and restaurant names during INSERT to avoid trigger recursion';

-- Note: The trigger_reviews_update_aggregates trigger remains unchanged as it doesn't cause recursion
-- It only calls update_restaurant_aggregates which updates the restaurants table, not reviews