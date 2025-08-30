-- Add tags field to reviews table for filtering and categorization
-- Tags will be stored as an array of strings (TEXT[])

-- Add tags column to reviews table
ALTER TABLE reviews 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add a check constraint to limit the number of tags (max 5 for UI cleanliness)
ALTER TABLE reviews 
ADD CONSTRAINT reviews_tags_limit CHECK (array_length(tags, 1) <= 5);

-- Add a comment to document the new field
COMMENT ON COLUMN reviews.tags IS 'Array of tags for categorizing reviews (cuisine, experience, atmosphere, dietary)';

-- Create an index on tags for efficient filtering queries (using GIN index for array operations)
CREATE INDEX idx_reviews_tags ON reviews USING GIN (tags);