-- Add profile fields to users table for profile page functionality
-- Adds favorites functionality only

-- Add profile-related columns to users table
ALTER TABLE users 
ADD COLUMN favorite_restaurants UUID[] DEFAULT '{}';

-- Create index for favorites array for performance
CREATE INDEX idx_users_favorite_restaurants ON users USING GIN(favorite_restaurants);

-- Update RLS policy for users table to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);