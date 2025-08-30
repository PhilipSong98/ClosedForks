-- Fix users table to reference auth.users properly
-- This migration fixes the authentication issue by ensuring users.id matches auth.users.id

-- Drop existing users table and recreate with proper foreign key
DROP TABLE IF EXISTS users CASCADE;

-- Create custom types (if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate users table with proper auth.users reference
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    home_city TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policies (bypass RLS)
CREATE POLICY "Admins can manage everything" ON users
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Add helpful comment
COMMENT ON TABLE users IS 'User profiles that reference auth.users for authentication';