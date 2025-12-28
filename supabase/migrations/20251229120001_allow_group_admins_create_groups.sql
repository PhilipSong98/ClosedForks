-- Allow group admins/owners to create new groups (not just global admins)
-- This updates create_group_with_audit to check if user is admin/owner in any group

CREATE OR REPLACE FUNCTION create_group_with_audit(
    group_name TEXT,
    group_description TEXT DEFAULT NULL,
    owner_user_id UUID DEFAULT auth.uid(),
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_group_id UUID;
    audit_id UUID;
    result JSON;
    is_global_admin BOOLEAN;
    is_group_admin BOOLEAN;
BEGIN
    -- Check if user is a global admin
    is_global_admin := (get_user_global_role(owner_user_id) = 'admin');

    -- Check if user is admin/owner in any group
    SELECT EXISTS (
        SELECT 1 FROM user_groups
        WHERE user_id = owner_user_id
        AND role IN ('admin', 'owner')
    ) INTO is_group_admin;

    -- Allow creation if global admin OR group admin/owner
    IF NOT (is_global_admin OR is_group_admin) THEN
        RAISE EXCEPTION 'Insufficient permissions: Only administrators and group admins can create groups'
            USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Create the group
    INSERT INTO groups (name, description, created_by)
    VALUES (group_name, group_description, owner_user_id)
    RETURNING id INTO new_group_id;

    -- Add the creator as owner
    INSERT INTO user_groups (user_id, group_id, role)
    VALUES (owner_user_id, new_group_id, 'owner');

    -- Log the audit event
    audit_id := log_audit_event(
        owner_user_id,
        'group_created',
        'group',
        new_group_id,
        new_group_id,
        json_build_object(
            'group_name', group_name,
            'group_description', group_description
        )::jsonb,
        NULL,
        ip_address_param,
        user_agent_param
    );

    result := json_build_object(
        'success', true,
        'group_id', new_group_id,
        'audit_id', audit_id,
        'message', 'Group created successfully'
    );

    RETURN result;
EXCEPTION
    WHEN insufficient_privilege THEN
        RETURN json_build_object(
            'success', false,
            'message', SQLERRM
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Failed to create group: ' || SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION create_group_with_audit IS 'Create a group with audit logging. Allows global admins and group admins/owners to create groups.';
