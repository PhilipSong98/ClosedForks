-- Add review likes system - Instagram-style likes for reviews
-- Users can like/unlike reviews, with one like per user per review

-- Create the review_likes table
CREATE TABLE review_likes (
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Composite primary key to prevent duplicate likes
  PRIMARY KEY (review_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_review_likes_review_id ON review_likes(review_id);
CREATE INDEX idx_review_likes_user_id ON review_likes(user_id);
CREATE INDEX idx_review_likes_created_at ON review_likes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE review_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_likes
-- Users can view all likes (to see like counts)
CREATE POLICY "Anyone can view likes" ON review_likes
FOR SELECT USING (true);

-- Users can only like reviews as themselves
CREATE POLICY "Users can like reviews as themselves" ON review_likes
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only unlike their own likes
CREATE POLICY "Users can unlike their own likes" ON review_likes
FOR DELETE USING (auth.uid() = user_id);

-- Add like_count column to reviews table for performance
ALTER TABLE reviews ADD COLUMN like_count INT NOT NULL DEFAULT 0;

-- Create index on like_count for sorting by popularity
CREATE INDEX idx_reviews_like_count ON reviews(like_count DESC);

-- Function to update like count when likes are added/removed
CREATE OR REPLACE FUNCTION update_review_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count
    UPDATE reviews 
    SET like_count = like_count + 1 
    WHERE id = NEW.review_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count
    UPDATE reviews 
    SET like_count = GREATEST(0, like_count - 1) 
    WHERE id = OLD.review_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to automatically update like counts
CREATE TRIGGER trigger_update_like_count_on_insert
  AFTER INSERT ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_like_count();

CREATE TRIGGER trigger_update_like_count_on_delete
  AFTER DELETE ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_review_like_count();

-- Function to check if a user has liked a specific review
CREATE OR REPLACE FUNCTION user_has_liked_review(review_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM review_likes 
    WHERE review_id = review_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION user_has_liked_review(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_review_like_count() TO authenticated;

-- Initialize like_count for existing reviews
UPDATE reviews SET like_count = (
  SELECT COUNT(*)::INT 
  FROM review_likes 
  WHERE review_likes.review_id = reviews.id
) WHERE like_count = 0;