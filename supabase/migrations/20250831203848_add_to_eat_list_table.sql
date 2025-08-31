-- Create to_eat_list table for user wishlist functionality
-- Users can save restaurants they want to visit to their personal to-eat list

-- Create the to_eat_list table
CREATE TABLE to_eat_list (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Composite primary key to prevent duplicates
  PRIMARY KEY (user_id, restaurant_id)
);

-- Create index for performance when querying user's to-eat list
CREATE INDEX idx_to_eat_list_user_id ON to_eat_list(user_id);
CREATE INDEX idx_to_eat_list_restaurant_id ON to_eat_list(restaurant_id);
CREATE INDEX idx_to_eat_list_created_at ON to_eat_list(created_at DESC);

-- Enable Row Level Security
ALTER TABLE to_eat_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own to-eat list
CREATE POLICY "Users can view own to-eat list" ON to_eat_list
FOR SELECT USING (auth.uid() = user_id);

-- Users can add restaurants to their own to-eat list
CREATE POLICY "Users can add to own to-eat list" ON to_eat_list
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove restaurants from their own to-eat list
CREATE POLICY "Users can remove from own to-eat list" ON to_eat_list
FOR DELETE USING (auth.uid() = user_id);

-- Create function to check if restaurant is in user's to-eat list
CREATE OR REPLACE FUNCTION is_restaurant_in_to_eat_list(restaurant_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM to_eat_list 
    WHERE restaurant_id = restaurant_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_restaurant_in_to_eat_list(UUID, UUID) TO authenticated;