-- Update reviews table to match Lovable UI design
-- This migration transforms the multi-dimensional rating system to a simplified format

-- Add new columns for Lovable design
ALTER TABLE reviews 
ADD COLUMN dish TEXT,
ADD COLUMN review TEXT,
ADD COLUMN recommend BOOLEAN DEFAULT true,
ADD COLUMN tips TEXT;

-- Create a single rating column (we'll keep rating_overall and rename it in next step)
-- First, let's migrate existing data if any exists
UPDATE reviews 
SET 
    review = COALESCE(text, ''),
    dish = 'Not specified',
    recommend = CASE WHEN rating_overall >= 4 THEN true ELSE false END,
    tips = ''
WHERE review IS NULL;

-- Make the old multi-dimensional fields optional by removing NOT NULL constraints
-- and set defaults for existing records
ALTER TABLE reviews 
ALTER COLUMN food DROP NOT NULL,
ALTER COLUMN service DROP NOT NULL,
ALTER COLUMN vibe DROP NOT NULL,
ALTER COLUMN value DROP NOT NULL,
ALTER COLUMN text DROP NOT NULL;

-- For new simplified schema, we'll use rating_overall as the main rating
-- and make other fields optional for backward compatibility

-- Add constraints for new fields
ALTER TABLE reviews 
ADD CONSTRAINT reviews_dish_not_empty CHECK (dish IS NOT NULL AND dish != ''),
ADD CONSTRAINT reviews_review_not_empty CHECK (review IS NOT NULL AND review != '');

-- Add comment to document the schema change
COMMENT ON COLUMN reviews.dish IS 'What dish/food item was ordered - new simplified format';
COMMENT ON COLUMN reviews.review IS 'Main review text - replaces old text field';
COMMENT ON COLUMN reviews.recommend IS 'Whether user recommends this restaurant to friends';
COMMENT ON COLUMN reviews.tips IS 'Optional pro tips for other diners';
COMMENT ON COLUMN reviews.rating_overall IS 'Main rating 1-5, used as primary rating in simplified format';

-- Legacy fields kept for backward compatibility
COMMENT ON COLUMN reviews.food IS 'Legacy: Food rating - optional in new format';
COMMENT ON COLUMN reviews.service IS 'Legacy: Service rating - optional in new format';
COMMENT ON COLUMN reviews.vibe IS 'Legacy: Vibe rating - optional in new format';
COMMENT ON COLUMN reviews.value IS 'Legacy: Value rating - optional in new format';
COMMENT ON COLUMN reviews.text IS 'Legacy: Old review text field - use review field instead';