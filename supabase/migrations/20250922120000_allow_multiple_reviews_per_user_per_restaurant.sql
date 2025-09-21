-- ============================================================================
-- Allow multiple reviews per restaurant from the same user
-- ============================================================================

-- Drop the old unique constraint that enforced one review per restaurant/user pair
ALTER TABLE reviews
DROP CONSTRAINT IF EXISTS reviews_restaurant_id_author_id_key;

-- Drop the supporting index that assumed uniqueness
DROP INDEX IF EXISTS idx_reviews_unique_per_user;

-- Add a new index optimized for fetching a user's reviews for a restaurant chronologically
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_author_created
  ON reviews(restaurant_id, author_id, created_at DESC);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
