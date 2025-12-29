-- Enhanced Authentication System Migration - SIMPLIFIED
-- Keep it simple: just add the essentials

-- ============================================================================
-- ADD NEW COLUMNS TO USERS
-- ============================================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_set BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_admin_user BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT false;

-- ============================================================================
-- MAGIC LINK REQUESTS TABLE (SIMPLE)
-- ============================================================================

CREATE TABLE IF NOT EXISTS magic_link_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simple spam prevention: one pending request per email
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_email 
ON magic_link_requests (email) 
WHERE status = 'pending';

-- Enable basic RLS
ALTER TABLE magic_link_requests ENABLE ROW LEVEL SECURITY;

-- Simple policy: anyone can request access
CREATE POLICY "Anyone can request access" ON magic_link_requests
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- DONE - KEEP IT SIMPLE
-- ============================================================================
-- This migration only adds what's essential:
-- - New auth columns for users
-- - Simple magic link requests table
-- - Basic spam prevention
-- Everything else can be added later if needed