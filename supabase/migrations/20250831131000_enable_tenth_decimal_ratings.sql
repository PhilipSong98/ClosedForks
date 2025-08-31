-- Enable tenth-decimal precision ratings (0.1 increments)
-- Change from half-star (0.5) to tenth-decimal (0.1) precision
-- This allows ratings like 4.1, 4.2, 4.3, 4.4, etc.

-- Update the check constraint to allow 0.1 increments instead of 0.5
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_rating_overall_check;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_rating_overall_check 
CHECK (rating_overall >= 1.0 AND rating_overall <= 5.0 AND (rating_overall * 10) = floor(rating_overall * 10));

-- The new constraint ensures:
-- 1. Rating is between 1.0 and 5.0
-- 2. Only allows tenth-decimal increments (1.0, 1.1, 1.2, 1.3, ..., 4.8, 4.9, 5.0)
--    This is done by checking that (rating * 10) equals its floor value
-- 3. Provides 10x more precision than the previous half-star system

-- Update any existing averages or functions that depend on rating_overall
-- The restaurants_with_avg_rating view should automatically handle the increased precision