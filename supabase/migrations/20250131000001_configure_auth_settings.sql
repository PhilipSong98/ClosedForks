-- Configure Auth Settings for Invite-Based Signups
-- This migration addresses email confirmation issues for invite-based signups

-- ============================================================================
-- AUTH CONFIGURATION FUNCTION
-- ============================================================================

-- Create a function to handle email confirmation bypass for invite-based signups
CREATE OR REPLACE FUNCTION confirm_signup_with_invite(
    user_id_param UUID,
    invite_code_param TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record RECORD;
    auth_user_record RECORD;
    result JSON;
BEGIN
    -- Validate invite code
    SELECT * INTO code_record
    FROM invite_codes
    WHERE code = invite_code_param
    AND is_active = true
    AND current_uses < max_uses
    AND (expires_at IS NULL OR expires_at > NOW());
    
    IF code_record IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'Invalid or expired invite code'
        );
        RETURN result;
    END IF;
    
    -- Check if user exists in auth.users and update email_confirmed_at
    UPDATE auth.users 
    SET 
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE id = user_id_param 
    AND email_confirmed_at IS NULL;
    
    -- Check if the update was successful
    IF FOUND THEN
        result := json_build_object(
            'success', true,
            'message', 'Email confirmed successfully via invite code'
        );
    ELSE
        result := json_build_object(
            'success', false,
            'message', 'User not found or email already confirmed'
        );
    END IF;
    
    RETURN result;
END;
$$;

-- ============================================================================
-- UPDATED USER CREATION FUNCTION
-- ============================================================================

-- Update the create_user_with_invite function to also confirm email
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
    
    -- Confirm the user's email in auth.users since they have a valid invite
    UPDATE auth.users 
    SET 
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = user_id_param;
    
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
        'message', 'User profile created, email confirmed, and invite code used successfully',
        'code_id', code_record.id
    );
    
    RETURN result;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION confirm_signup_with_invite IS 'Confirms email for users who signed up with valid invite codes';
COMMENT ON FUNCTION create_user_with_invite IS 'Updated version that also confirms email during invite-based signup';
