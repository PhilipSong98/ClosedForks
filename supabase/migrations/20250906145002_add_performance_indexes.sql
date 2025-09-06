-- Add critical composite indexes for performance optimization
-- These indexes will dramatically improve query performance for the main feed and restaurant pages

-- 1. Keyset pagination index for reviews feed (most critical)
-- This enables O(1) pagination instead of O(n) with OFFSET
CREATE INDEX IF NOT EXISTS idx_reviews_keyset_pagination 
ON reviews(created_at DESC, id DESC);

-- 2. Group-based review access with pagination support
-- Critical for group-scoped queries with time-based ordering
CREATE INDEX IF NOT EXISTS idx_reviews_group_keyset 
ON reviews(group_id, created_at DESC, id DESC);

-- 3. Author-based queries with pagination (for profile pages)
CREATE INDEX IF NOT EXISTS idx_reviews_author_keyset 
ON reviews(author_id, created_at DESC, id DESC);

-- 4. Restaurant-based queries with pagination (for restaurant detail pages)
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_keyset 
ON reviews(restaurant_id, created_at DESC, id DESC);

-- 5. Optimize user likes lookup (currently does IN query on review_ids)
-- This covers the common pattern: user_id + review_id lookup
CREATE INDEX IF NOT EXISTS idx_review_likes_user_review 
ON review_likes(user_id, review_id);

-- 6. Optimize review stats calculation queries
-- This covers queries that calculate avg rating per restaurant
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_rating 
ON reviews(restaurant_id, rating_overall) 
WHERE rating_overall IS NOT NULL;

-- 7. Covering index for the main reviews query to avoid table lookups
-- This includes the most frequently selected columns
CREATE INDEX IF NOT EXISTS idx_reviews_feed_covering 
ON reviews(created_at DESC, id, group_id) 
INCLUDE (
  restaurant_id, 
  author_id, 
  rating_overall, 
  dish, 
  review, 
  recommend, 
  tips, 
  tags, 
  visit_date, 
  price_per_person, 
  like_count
);

-- 8. User groups lookup optimization for security functions
-- Critical for get_user_visible_reviews performance
CREATE INDEX IF NOT EXISTS idx_user_groups_user_group_composite 
ON user_groups(user_id, group_id);

-- 9. Restaurant search optimization 
CREATE INDEX IF NOT EXISTS idx_restaurants_city_name_search 
ON restaurants(city, name) 
INCLUDE (id, address, cuisine, price_level, google_place_id, google_data);

-- 10. Optimize to-eat list queries
CREATE INDEX IF NOT EXISTS idx_to_eat_list_user_created 
ON to_eat_list(user_id, created_at DESC);

-- Add comments for future reference
COMMENT ON INDEX idx_reviews_keyset_pagination IS 'Enables O(1) keyset pagination for main feed';
COMMENT ON INDEX idx_reviews_group_keyset IS 'Optimizes group-scoped review queries with pagination';
COMMENT ON INDEX idx_reviews_feed_covering IS 'Covering index to avoid table lookups for common queries';
COMMENT ON INDEX idx_review_likes_user_review IS 'Optimizes user like status checks';
COMMENT ON INDEX idx_reviews_restaurant_rating IS 'Optimizes restaurant rating calculations';