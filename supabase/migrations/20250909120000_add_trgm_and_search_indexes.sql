-- Enable trigram search and add GIN indexes for search-heavy columns

-- 1) Ensure pg_trgm is available
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2) Restaurants text search indexes (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_restaurants_name_trgm
  ON restaurants USING GIN (lower(name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_restaurants_city_trgm
  ON restaurants USING GIN (lower(city) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_restaurants_address_trgm
  ON restaurants USING GIN (lower(address) gin_trgm_ops);

-- 3) Reviews text search indexes
CREATE INDEX IF NOT EXISTS idx_reviews_review_trgm
  ON reviews USING GIN (lower(review) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_reviews_dish_trgm
  ON reviews USING GIN (lower(dish) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_reviews_tips_trgm
  ON reviews USING GIN (lower(tips) gin_trgm_ops);

-- 4) Array operator indexes
CREATE INDEX IF NOT EXISTS idx_reviews_tags_gin
  ON reviews USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_gin
  ON restaurants USING GIN (cuisine);

COMMENT ON INDEX idx_restaurants_name_trgm IS 'Trigram index for restaurants.name ILIKE';
COMMENT ON INDEX idx_reviews_review_trgm IS 'Trigram index for reviews.review ILIKE';
