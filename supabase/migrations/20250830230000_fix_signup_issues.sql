-- Fix Signup Issues Migration
-- Addresses RLS policies, foreign key constraints, and signup flow issues

-- ============================================================================
-- FIX USERS TABLE RLS POLICIES
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create new policy that allows both authenticated users and system inserts during signup
CREATE POLICY "Users can insert profile during signup" ON users
    FOR INSERT WITH CHECK (
        auth.uid() = id OR 
        auth.uid() IS NULL  -- Allow system inserts during signup process
    );

-- ============================================================================
-- FIX INVITE CODE USAGE CONSTRAINTS
-- ============================================================================

-- Create a function that can insert user profile and record invite usage atomically
CREATE OR REPLACE FUNCTION create_user_with_invite(
    user_id_param UUID,
    email_param TEXT,
    name_param TEXT,
    full_name_param TEXT,
    invite_code_param TEXT,
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
    -- First, validate the invite code
    SELECT * INTO code_record
    FROM invite_codes
    WHERE code = invite_code_param
    AND is_active = true
    AND current_uses < max_uses
    AND (expires_at IS NULL OR expires_at > NOW())
    FOR UPDATE;
    
    IF code_record IS NULL THEN
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
    
    -- Insert user profile (with elevated privileges due to SECURITY DEFINER)
    INSERT INTO users (id, email, name, full_name, role, password_set, first_login_completed)
    VALUES (user_id_param, email_param, name_param, full_name_param, 'user', true, true);
    
    -- Record invite code usage
    INSERT INTO invite_code_usage (invite_code_id, user_id, ip_address, user_agent)
    VALUES (code_record.id, user_id_param, ip_address_param, user_agent_param);
    
    -- Update invite code usage count
    UPDATE invite_codes 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = code_record.id;
    
    result := json_build_object(
        'success', true,
        'message', 'User profile created and invite code used successfully',
        'code_id', code_record.id
    );
    
    RETURN result;
END;
$$;

-- ============================================================================
-- ADDITIONAL SAFETY POLICIES
-- ============================================================================

-- Allow system to read user data during signup process
CREATE POLICY "System can read users during signup" ON users
    FOR SELECT USING (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION create_user_with_invite IS 'Atomically creates user profile and records invite code usage to prevent foreign key constraint violations';
