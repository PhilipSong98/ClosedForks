-- Make review fields optional for lazy users
-- Allow users to create reviews with just restaurant selection + rating
-- This removes constraints that were forcing dish and review to be non-empty

-- Remove the NOT NULL constraints on dish and review fields
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_dish_not_empty,
DROP CONSTRAINT IF EXISTS reviews_review_not_empty;

-- Allow empty strings and NULL values for these fields
-- This enables "lazy" reviews with just restaurant + rating

-- Update column comments to reflect new optional nature
COMMENT ON COLUMN reviews.dish IS 'What dish/food item was ordered - OPTIONAL for lazy users';
COMMENT ON COLUMN reviews.review IS 'Main review text - OPTIONAL for lazy users';

-- Ensure existing data remains valid (no data changes needed)
-- Users can now post with just restaurant_id + rating_overall