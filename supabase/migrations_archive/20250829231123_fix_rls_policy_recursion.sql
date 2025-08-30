-- Fix RLS policy infinite recursion issue
-- The admin policy was causing recursion by querying users table within the users table policy

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage everything" ON users;

-- Create safe RLS policies that don't cause recursion
-- Allow all authenticated users to view all profiles
CREATE POLICY "Authenticated users can view profiles" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Authenticated users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Simple admin policy without recursion
-- For now, we'll handle admin permissions at the application level
-- Later we can implement a security definer function if needed
CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- Add comment explaining the approach
COMMENT ON TABLE users IS 'User profiles with safe RLS policies. Admin permissions handled at application level to avoid recursion.';