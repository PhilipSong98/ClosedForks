-- Add Google Places integration fields to restaurants table
-- This enables caching of Google Places data and linking to Google Maps

-- Add Google Places fields to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
ADD COLUMN IF NOT EXISTS google_data JSONB,
ADD COLUMN IF NOT EXISTS last_google_sync TIMESTAMPTZ;

-- Create index for efficient lookups by Google Place ID
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id 
ON restaurants(google_place_id) 
WHERE google_place_id IS NOT NULL;

-- Add comment to explain the Google data structure
COMMENT ON COLUMN restaurants.google_data IS 'Cached Google Places data including formatted_address, phone, hours, website, photos, and types';
COMMENT ON COLUMN restaurants.google_place_id IS 'Google Places unique identifier for this restaurant';
COMMENT ON COLUMN restaurants.google_maps_url IS 'Direct Google Maps URL for directions and view';
COMMENT ON COLUMN restaurants.last_google_sync IS 'When Google Places data was last refreshed';