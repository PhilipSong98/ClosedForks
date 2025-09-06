-- Fix the oversized restaurant search index
-- The original index exceeded btree maximum size due to including large google_data JSONB column

-- 1. Drop the problematic index
DROP INDEX IF EXISTS idx_restaurants_city_name_search;

-- 2. Create a fixed version without the large google_data column
-- This keeps the most essential columns for restaurant search optimization
CREATE INDEX IF NOT EXISTS idx_restaurants_city_name_search 
ON restaurants(city, name) 
INCLUDE (id, address, cuisine, price_level, google_place_id);

-- 3. Create a separate index for google_data access if needed
-- Using a GIN index which is better for JSONB anyway
CREATE INDEX IF NOT EXISTS idx_restaurants_google_data 
ON restaurants USING GIN (google_data)
WHERE google_data IS NOT NULL;

-- 4. Add comments explaining the optimization
COMMENT ON INDEX idx_restaurants_city_name_search IS 'Optimized restaurant search index without oversized google_data column to stay under btree limit';
COMMENT ON INDEX idx_restaurants_google_data IS 'GIN index for efficient google_data JSONB queries, created separately to avoid size issues';