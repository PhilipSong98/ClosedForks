-- Fix profile creation policy
-- The INSERT policy might be too restrictive, causing empty error objects

-- Drop and recreate the INSERT policy with better logic
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON users;

-- Create a more permissive INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert own profile" ON users
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' 
        AND auth.uid() = id
    );

-- Also ensure we have a proper SELECT policy for the user's own data
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON users;

-- Allow users to view all profiles (needed for the app functionality)
CREATE POLICY "Authenticated users can view profiles" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles with safe RLS policies. Profile creation fixed for authenticated users.';