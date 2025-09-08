-- ============================================================================
-- SIMPLIFY JOIN GROUP WITH INVITE CODE FUNCTION
-- ============================================================================

-- Remove unnecessary invite_code_usage tracking from group join flow
-- This tracking was designed for signup auditing, not group joining
CREATE OR REPLACE FUNCTION join_group_with_invite_code(
    code_param TEXT,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record RECORD;
    existing_membership_count INTEGER;
    result JSON;
BEGIN
    -- Check if user is authenticated
    IF user_id_param IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'Authentication required'
        );
        RETURN result;
    END IF;
    
    -- Find the invite code
    SELECT * INTO code_record 
    FROM invite_codes 
    WHERE code = code_param 
    AND is_active = true;
    
    -- Check if code exists
    IF NOT FOUND THEN
        result := json_build_object(
            'success', false,
            'message', 'Invalid invite code'
        );
        RETURN result;
    END IF;
    
    -- Check if code has expired
    IF code_record.expires_at IS NOT NULL AND code_record.expires_at < NOW() THEN
        result := json_build_object(
            'success', false,
            'message', 'This invite code has expired'
        );
        RETURN result;
    END IF;
    
    -- Check if code has reached max uses
    IF code_record.current_uses >= code_record.max_uses THEN
        result := json_build_object(
            'success', false,
            'message', 'This invite code has reached its maximum uses'
        );
        RETURN result;
    END IF;
    
    -- Check if code is linked to a group
    IF code_record.group_id IS NULL THEN
        result := json_build_object(
            'success', false,
            'message', 'This invite code is not linked to a group'
        );
        RETURN result;
    END IF;
    
    -- Check if user is already a member of this group
    SELECT COUNT(*) INTO existing_membership_count
    FROM user_groups 
    WHERE user_id = user_id_param 
    AND group_id = code_record.group_id;
    
    IF existing_membership_count > 0 THEN
        result := json_build_object(
            'success', false,
            'message', 'You are already a member of this group'
        );
        RETURN result;
    END IF;
    
    -- Add user to the group as a member
    INSERT INTO user_groups (user_id, group_id, role)
    VALUES (user_id_param, code_record.group_id, 'member');
    
    -- Increment usage count
    UPDATE invite_codes 
    SET current_uses = current_uses + 1,
        updated_at = NOW()
    WHERE id = code_record.id;
    
    -- Get group name for success message
    result := json_build_object(
        'success', true,
        'message', 'Successfully joined the group',
        'group_id', code_record.group_id,
        'group_name', (SELECT name FROM groups WHERE id = code_record.group_id)
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION join_group_with_invite_code(TEXT, UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================