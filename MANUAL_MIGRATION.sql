-- Manual Migration for Invite Code System
-- Run this in Supabase SQL Editor if the automatic migration fails

-- ============================================================================
-- STEP 1: UPDATE USERS TABLE - ADD FULL_NAME
-- ============================================================================

-- Add full_name field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Update existing users to use name as full_name temporarily
UPDATE users 
SET full_name = name 
WHERE full_name IS NULL;

-- ============================================================================
-- STEP 2: CREATE INVITE_CODES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invite_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL CHECK (LENGTH(code) = 6 AND code ~ '^[0-9]{6}$'),
    description TEXT,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to ensure current_uses doesn't exceed max_uses
ALTER TABLE invite_codes 
ADD CONSTRAINT IF NOT EXISTS check_uses_not_exceeded 
CHECK (current_uses <= max_uses);

-- ============================================================================
-- STEP 3: CREATE INVITE_CODE_USAGE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS invite_code_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invite_code_id UUID REFERENCES invite_codes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    used_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    UNIQUE(invite_code_id, user_id)
);

-- ============================================================================
-- STEP 4: CREATE INDEXES
-- ============================================================================

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON invite_codes(code);

-- Index for active codes
CREATE INDEX IF NOT EXISTS idx_invite_codes_active ON invite_codes(is_active) WHERE is_active = true;

-- Index for expiration dates
CREATE INDEX IF NOT EXISTS idx_invite_codes_expires_at ON invite_codes(expires_at);

-- Index for usage lookups
CREATE INDEX IF NOT EXISTS idx_invite_code_usage_code_id ON invite_code_usage(invite_code_id);
CREATE INDEX IF NOT EXISTS idx_invite_code_usage_user_id ON invite_code_usage(user_id);

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on invite_codes table
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Enable RLS on invite_code_usage table
ALTER TABLE invite_code_usage ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES
-- ============================================================================

-- Policy: Anyone can view active, non-expired codes (for validation)
DROP POLICY IF EXISTS "Anyone can view valid invite codes" ON invite_codes;
CREATE POLICY "Anyone can view valid invite codes" ON invite_codes
    FOR SELECT 
    USING (
        is_active = true 
        AND current_uses < max_uses 
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Policy: Admins can manage all invite codes
DROP POLICY IF EXISTS "Admins can manage invite codes" ON invite_codes;
CREATE POLICY "Admins can manage invite codes" ON invite_codes
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR is_admin_user = true)
        )
    );

-- Policy: Users can see their own usage
DROP POLICY IF EXISTS "Users can see their own invite code usage" ON invite_code_usage;
CREATE POLICY "Users can see their own invite code usage" ON invite_code_usage
    FOR SELECT 
    USING (user_id = auth.uid());

-- Policy: System can insert usage records
DROP POLICY IF EXISTS "System can insert invite code usage" ON invite_code_usage;
CREATE POLICY "System can insert invite code usage" ON invite_code_usage
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Admins can see all usage
DROP POLICY IF EXISTS "Admins can see all invite code usage" ON invite_code_usage;
CREATE POLICY "Admins can see all invite code usage" ON invite_code_usage
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR is_admin_user = true)
        )
    );

-- ============================================================================
-- STEP 7: CREATE FUNCTIONS
-- ============================================================================

-- Function to validate invite code
CREATE OR REPLACE FUNCTION validate_invite_code(code_to_check TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record RECORD;
    result JSON;
BEGIN
    -- Check if code exists and is valid
    SELECT * INTO code_record
    FROM invite_codes
    WHERE code = code_to_check
    AND is_active = true
    AND current_uses < max_uses
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF code_record IS NULL THEN
        result := json_build_object(
            'valid', false,
            'message', 'Invalid or expired invite code'
        );
    ELSE
        result := json_build_object(
            'valid', true,
            'code_id', code_record.id,
            'description', code_record.description,
            'uses_remaining', code_record.max_uses - code_record.current_uses
        );
    END IF;
    
    RETURN result;
END;
$$;

-- Function to use invite code
CREATE OR REPLACE FUNCTION use_invite_code(
    code_to_use TEXT,
    user_id_param UUID,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record RECORD;
    result JSON;
BEGIN
    -- Lock the code record to prevent race conditions
    SELECT * INTO code_record
    FROM invite_codes
    WHERE code = code_to_use
    FOR UPDATE;
    
    -- Validate code
    IF code_record IS NULL OR 
       code_record.is_active = false OR
       code_record.current_uses >= code_record.max_uses OR
       (code_record.expires_at IS NOT NULL AND code_record.expires_at <= NOW()) THEN
        result := json_build_object(
            'success', false,
            'message', 'Invalid or expired invite code'
        );
        RETURN result;
    END IF;
    
    -- Check if user already used this code
    IF EXISTS (
        SELECT 1 FROM invite_code_usage 
        WHERE invite_code_id = code_record.id 
        AND user_id = user_id_param
    ) THEN
        result := json_build_object(
            'success', false,
            'message', 'You have already used this invite code'
        );
        RETURN result;
    END IF;
    
    -- Record the usage
    INSERT INTO invite_code_usage (invite_code_id, user_id, ip_address, user_agent)
    VALUES (code_record.id, user_id_param, ip_address_param, user_agent_param);
    
    -- Increment usage count
    UPDATE invite_codes 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = code_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'Invite code successfully used',
        'code_id', code_record.id
    );
    
    RETURN result;
END;
$$;

-- ============================================================================
-- STEP 8: CREATE TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create trigger for updated_at on invite_codes (if update_updated_at_column function exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_invite_codes_updated_at ON invite_codes;
        CREATE TRIGGER update_invite_codes_updated_at
            BEFORE UPDATE ON invite_codes
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- STEP 9: INSERT TEST INVITE CODE
-- ============================================================================

-- Insert a hardcoded invite code for initial access
INSERT INTO invite_codes (code, description, max_uses, is_active)
VALUES ('123456', 'Initial access code for testing and family', 50, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if everything was created successfully
SELECT 
    'invite_codes table' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invite_codes') 
         THEN 'Created' ELSE 'Missing' END as status
UNION ALL
SELECT 
    'invite_code_usage table' as item,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invite_code_usage') 
         THEN 'Created' ELSE 'Missing' END as status
UNION ALL
SELECT 
    'validate_invite_code function' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'validate_invite_code') 
         THEN 'Created' ELSE 'Missing' END as status
UNION ALL
SELECT 
    'use_invite_code function' as item,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'use_invite_code') 
         THEN 'Created' ELSE 'Missing' END as status
UNION ALL
SELECT 
    'Test code 123456' as item,
    CASE WHEN EXISTS (SELECT 1 FROM invite_codes WHERE code = '123456') 
         THEN 'Inserted' ELSE 'Missing' END as status;

-- Test the validation function
SELECT 'Testing validation function:' as test;
SELECT validate_invite_code('123456') as validation_result;
SELECT validate_invite_code('000000') as invalid_code_test;