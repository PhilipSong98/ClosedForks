-- Enable half-star ratings by changing rating_overall from INTEGER to DECIMAL
-- This allows values like 4.5, 3.5, etc.

-- First, alter the reviews table to use DECIMAL(2,1) for rating_overall
-- DECIMAL(2,1) allows values from 0.0 to 9.9 with one decimal place
ALTER TABLE reviews 
ALTER COLUMN rating_overall TYPE DECIMAL(2,1);

-- Update the check constraint to allow half values
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_rating_overall_check;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_rating_overall_check 
CHECK (rating_overall >= 1.0 AND rating_overall <= 5.0 AND (rating_overall * 2) = floor(rating_overall * 2));

-- The constraint ensures:
-- 1. Rating is between 1.0 and 5.0
-- 2. Only allows half-step increments (1.0, 1.5, 2.0, 2.5, etc.)
--    This is done by checking that (rating * 2) equals its floor value

-- Update any existing averages or functions that depend on rating_overall
-- The restaurants_with_avg_rating view should automatically handle decimal values