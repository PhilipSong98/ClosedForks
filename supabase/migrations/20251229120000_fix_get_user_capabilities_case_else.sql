-- Fix get_user_capabilities function: Add ELSE clause to CASE statement
-- The CASE statement was missing an ELSE clause, causing "case not found" error
-- when group_role is 'none' (no group context)

CREATE OR REPLACE FUNCTION get_user_capabilities(
    user_id_param UUID DEFAULT auth.uid(),
    group_id_param UUID DEFAULT NULL
)
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    global_role TEXT;
    group_role TEXT;
    capabilities TEXT[] := '{}';
BEGIN
    IF user_id_param IS NULL THEN
        RETURN capabilities;
    END IF;

    -- Get global role
    global_role := get_user_global_role(user_id_param);

    -- Get group role if group specified
    IF group_id_param IS NOT NULL THEN
        group_role := get_user_group_role(user_id_param, group_id_param);
    ELSE
        group_role := 'none';
    END IF;

    -- Admin gets all capabilities
    IF global_role = 'admin' THEN
        capabilities := ARRAY[
            'create_group',
            'manage_any_group',
            'view_audit_log',
            'manage_invites',
            'post_review',
            'manage_roles',
            'invite_member',
            'remove_member',
            'edit_group',
            'delete_group'
        ];
        RETURN capabilities;
    END IF;

    -- Base capabilities for authenticated users
    capabilities := ARRAY['post_review'];

    -- Group-specific capabilities
    CASE group_role
        WHEN 'owner' THEN
            capabilities := capabilities || ARRAY[
                'manage_roles',
                'invite_member',
                'remove_member',
                'edit_group',
                'delete_group',
                'transfer_ownership'
            ];
        WHEN 'admin' THEN
            capabilities := capabilities || ARRAY[
                'manage_roles',
                'invite_member',
                'remove_member',
                'edit_group'
            ];
        WHEN 'member' THEN
            capabilities := capabilities || ARRAY[
                'invite_member'
            ];
        ELSE
            -- No additional capabilities for 'none' or unrecognized roles
            NULL;
    END CASE;

    RETURN capabilities;
END;
$$;

COMMENT ON FUNCTION get_user_capabilities IS 'Returns array of capabilities for a user, with ELSE clause fix for non-group context';
