-- RBAC Audit System Migration
-- Implements audit logging and permission checking functions for comprehensive access control

-- ============================================================================
-- 1. CREATE AUDIT LOG TABLE
-- ============================================================================

-- Define audit action types
CREATE TYPE audit_action AS ENUM (
    'group_created',
    'group_updated',
    'group_deleted',
    'role_assigned',
    'role_changed',
    'role_revoked',
    'member_added',
    'member_removed',
    'invite_code_generated',
    'ownership_transferred'
);

-- Define target types for audit actions
CREATE TYPE audit_target_type AS ENUM (
    'group',
    'user',
    'invite_code'
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action audit_action NOT NULL,
    target_type audit_target_type NOT NULL,
    target_id UUID NOT NULL,
    group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient audit queries
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_group_id ON audit_log(group_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON audit_log
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin_user = true
        )
    );

-- Policy: System can insert audit log entries
CREATE POLICY "System can insert audit log entries" ON audit_log
    FOR INSERT 
    WITH CHECK (true);

-- ============================================================================
-- 2. CAPABILITY DEFINITIONS
-- ============================================================================

-- Function to get user's global role (admin/user)
CREATE OR REPLACE FUNCTION get_user_global_role(user_id_param UUID DEFAULT auth.uid())
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    IF user_id_param IS NULL THEN
        RETURN 'anonymous';
    END IF;
    
    SELECT is_admin_user INTO is_admin
    FROM users 
    WHERE id = user_id_param;
    
    IF is_admin IS TRUE THEN
        RETURN 'admin';
    ELSE
        RETURN 'user';
    END IF;
END;
$$;

-- Function to get user's role in a specific group
CREATE OR REPLACE FUNCTION get_user_group_role(
    user_id_param UUID DEFAULT auth.uid(),
    group_id_param UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    group_role TEXT;
BEGIN
    IF user_id_param IS NULL OR group_id_param IS NULL THEN
        RETURN 'none';
    END IF;
    
    SELECT role::TEXT INTO group_role
    FROM user_groups 
    WHERE user_id = user_id_param AND group_id = group_id_param;
    
    RETURN COALESCE(group_role, 'none');
END;
$$;

-- Function to get user's effective capabilities
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
    END CASE;
    
    RETURN capabilities;
END;
$$;

-- Function to check if user has specific capability
CREATE OR REPLACE FUNCTION can_user_perform(
    user_id_param UUID,
    capability_param TEXT,
    group_id_param UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_capabilities TEXT[];
BEGIN
    user_capabilities := get_user_capabilities(user_id_param, group_id_param);
    RETURN capability_param = ANY(user_capabilities);
END;
$$;

-- Function to ensure user has capability (throws error if not)
CREATE OR REPLACE FUNCTION ensure_user_can_perform(
    user_id_param UUID,
    capability_param TEXT,
    group_id_param UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT can_user_perform(user_id_param, capability_param, group_id_param) THEN
        RAISE EXCEPTION 'Insufficient permissions: % capability required', capability_param
            USING ERRCODE = 'insufficient_privilege';
    END IF;
END;
$$;

-- ============================================================================
-- 3. AUDIT LOGGING FUNCTIONS
-- ============================================================================

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    actor_id_param UUID,
    action_param audit_action,
    target_type_param audit_target_type,
    target_id_param UUID,
    group_id_param UUID DEFAULT NULL,
    metadata_param JSONB DEFAULT '{}',
    reason_param TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        actor_id,
        action,
        target_type,
        target_id,
        group_id,
        metadata,
        reason,
        ip_address,
        user_agent
    ) VALUES (
        actor_id_param,
        action_param,
        target_type_param,
        target_id_param,
        group_id_param,
        metadata_param,
        reason_param,
        ip_address_param,
        user_agent_param
    ) RETURNING id INTO audit_id;
    
    RETURN audit_id;
END;
$$;

-- ============================================================================
-- 4. GROUP MANAGEMENT FUNCTIONS WITH RBAC
-- ============================================================================

-- Enhanced group creation function with audit logging
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
BEGIN
    -- Check if user can create groups (admin only)
    PERFORM ensure_user_can_perform(owner_user_id, 'create_group');
    
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
END;
$$;

-- Function to update group role with audit logging
CREATE OR REPLACE FUNCTION update_group_role(
    target_user_id UUID,
    group_id_param UUID,
    new_role_param group_role,
    actor_id_param UUID DEFAULT auth.uid(),
    reason_param TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    old_role group_role;
    audit_id UUID;
    result JSON;
    owner_count INTEGER;
BEGIN
    -- Check if actor can manage roles in this group
    PERFORM ensure_user_can_perform(actor_id_param, 'manage_roles', group_id_param);
    
    -- Get current role
    SELECT role INTO old_role
    FROM user_groups 
    WHERE user_id = target_user_id AND group_id = group_id_param;
    
    IF old_role IS NULL THEN
        RAISE EXCEPTION 'User is not a member of this group';
    END IF;
    
    -- Prevent demoting the last owner
    IF old_role = 'owner' AND new_role_param != 'owner' THEN
        SELECT COUNT(*) INTO owner_count
        FROM user_groups 
        WHERE group_id = group_id_param AND role = 'owner';
        
        IF owner_count <= 1 THEN
            RAISE EXCEPTION 'Cannot demote the last owner of the group';
        END IF;
    END IF;
    
    -- Update the role
    UPDATE user_groups 
    SET role = new_role_param 
    WHERE user_id = target_user_id AND group_id = group_id_param;
    
    -- Log the audit event
    audit_id := log_audit_event(
        actor_id_param,
        'role_changed',
        'user',
        target_user_id,
        group_id_param,
        json_build_object(
            'old_role', old_role,
            'new_role', new_role_param
        )::jsonb,
        reason_param,
        ip_address_param,
        user_agent_param
    );
    
    result := json_build_object(
        'success', true,
        'old_role', old_role,
        'new_role', new_role_param,
        'audit_id', audit_id,
        'message', 'Role updated successfully'
    );
    
    RETURN result;
END;
$$;

-- Function to remove member with audit logging
CREATE OR REPLACE FUNCTION remove_group_member(
    target_user_id UUID,
    group_id_param UUID,
    actor_id_param UUID DEFAULT auth.uid(),
    reason_param TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    member_role group_role;
    audit_id UUID;
    result JSON;
    owner_count INTEGER;
BEGIN
    -- Check if actor can remove members from this group
    PERFORM ensure_user_can_perform(actor_id_param, 'remove_member', group_id_param);
    
    -- Get member role
    SELECT role INTO member_role
    FROM user_groups 
    WHERE user_id = target_user_id AND group_id = group_id_param;
    
    IF member_role IS NULL THEN
        RAISE EXCEPTION 'User is not a member of this group';
    END IF;
    
    -- Prevent removing the last owner
    IF member_role = 'owner' THEN
        SELECT COUNT(*) INTO owner_count
        FROM user_groups 
        WHERE group_id = group_id_param AND role = 'owner';
        
        IF owner_count <= 1 THEN
            RAISE EXCEPTION 'Cannot remove the last owner of the group';
        END IF;
    END IF;
    
    -- Remove the member
    DELETE FROM user_groups 
    WHERE user_id = target_user_id AND group_id = group_id_param;
    
    -- Log the audit event
    audit_id := log_audit_event(
        actor_id_param,
        'member_removed',
        'user',
        target_user_id,
        group_id_param,
        json_build_object(
            'removed_role', member_role
        )::jsonb,
        reason_param,
        ip_address_param,
        user_agent_param
    );
    
    result := json_build_object(
        'success', true,
        'removed_role', member_role,
        'audit_id', audit_id,
        'message', 'Member removed successfully'
    );
    
    RETURN result;
END;
$$;

-- ============================================================================
-- 5. ENHANCED SECURITY POLICIES
-- ============================================================================

-- Update groups table policies to respect admin override
DROP POLICY IF EXISTS "Group owners and admins can update groups" ON groups;

CREATE POLICY "Group owners, admins, and global admins can update groups" ON groups
    FOR UPDATE 
    USING (
        -- Global admin can update any group
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.is_admin_user = true
        )
        OR
        -- Group owner/admin can update their group
        EXISTS (
            SELECT 1 FROM user_groups 
            WHERE user_groups.group_id = groups.id 
            AND user_groups.user_id = auth.uid()
            AND user_groups.role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- 6. MIGRATION COMPLETE
-- ============================================================================

-- Summary:
--  Created audit_log table with comprehensive event tracking
--  Implemented capability-based permission system
--  Added RBAC functions for checking and enforcing permissions
--  Enhanced group management functions with audit logging
--  Updated RLS policies to respect global admin status
--  Provided secure, auditable group operations