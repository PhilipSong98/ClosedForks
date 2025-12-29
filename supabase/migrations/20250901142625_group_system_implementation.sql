-- Group System Implementation Migration
-- Implements invite-only groups with group-scoped feeds

-- ============================================================================
-- CREATE GROUPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
    description TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CREATE USER_GROUPS JUNCTION TABLE
-- ============================================================================

-- Define user roles within groups
CREATE TYPE group_role AS ENUM ('owner', 'admin', 'member');

CREATE TABLE IF NOT EXISTS user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    role group_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, group_id) -- Prevent duplicate memberships
);

-- ============================================================================
-- MODIFY INVITE_CODES TABLE TO LINK TO GROUPS
-- ============================================================================

-- Add group_id to invite_codes table
ALTER TABLE invite_codes 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Update the description of existing test invite code to clarify it creates a group
UPDATE invite_codes 
SET description = 'Initial access code for testing - creates default group'
WHERE code = '123456';

-- ============================================================================
-- ADD GROUP CONTEXT TO REVIEWS
-- ============================================================================

-- Add group_id to reviews table for group-scoped visibility
-- This will be populated automatically based on user's groups when review is created
-- For now, we'll populate it with the user's primary group
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Group indexes
CREATE INDEX IF NOT EXISTS idx_groups_name ON groups(name);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON groups(created_by);

-- User groups indexes
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_group_id ON user_groups(group_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_role ON user_groups(role);

-- Invite codes group index
CREATE INDEX IF NOT EXISTS idx_invite_codes_group_id ON invite_codes(group_id);

-- Reviews group index
CREATE INDEX IF NOT EXISTS idx_reviews_group_id ON reviews(group_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on groups table
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view groups they belong to
CREATE POLICY "Users can view their groups" ON groups
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_groups 
            WHERE user_groups.group_id = groups.id 
            AND user_groups.user_id = auth.uid()
        )
    );

-- Policy: Group owners/admins can update group info
CREATE POLICY "Group owners and admins can update groups" ON groups
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM user_groups 
            WHERE user_groups.group_id = groups.id 
            AND user_groups.user_id = auth.uid()
            AND user_groups.role IN ('owner', 'admin')
        )
    );

-- Policy: Anyone can create a group (for invite code signup process)
CREATE POLICY "Anyone can create groups" ON groups
    FOR INSERT 
    WITH CHECK (true);

-- Enable RLS on user_groups table
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own group memberships
CREATE POLICY "Users can view their own group memberships" ON user_groups
    FOR SELECT 
    USING (user_id = auth.uid());

-- Policy: Users can view group memberships for groups they belong to
CREATE POLICY "Users can view group member lists" ON user_groups
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM user_groups ug2 
            WHERE ug2.group_id = user_groups.group_id 
            AND ug2.user_id = auth.uid()
        )
    );

-- Policy: System can insert user group memberships during signup
CREATE POLICY "System can insert group memberships" ON user_groups
    FOR INSERT 
    WITH CHECK (true);

-- Policy: Group owners/admins can manage memberships
CREATE POLICY "Group owners and admins can manage memberships" ON user_groups
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_groups ug2 
            WHERE ug2.group_id = user_groups.group_id 
            AND ug2.user_id = auth.uid()
            AND ug2.role IN ('owner', 'admin')
        )
    );

-- Update existing reviews RLS policy to consider group membership
DROP POLICY IF EXISTS "Users can view reviews" ON reviews;

CREATE POLICY "Users can view reviews from their groups" ON reviews
    FOR SELECT 
    USING (
        -- Users can see reviews if they share at least one group with the author
        EXISTS (
            SELECT 1 FROM user_groups ug1, user_groups ug2
            WHERE ug1.user_id = auth.uid()
            AND ug2.user_id = reviews.author_id
            AND ug1.group_id = ug2.group_id
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to create a group and make user the owner
CREATE OR REPLACE FUNCTION create_group_and_add_owner(
    group_name TEXT,
    group_description TEXT DEFAULT NULL,
    owner_user_id UUID DEFAULT auth.uid()
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_group_id UUID;
    result JSON;
BEGIN
    -- Create the group
    INSERT INTO groups (name, description, created_by)
    VALUES (group_name, group_description, owner_user_id)
    RETURNING id INTO new_group_id;
    
    -- Add the creator as owner
    INSERT INTO user_groups (user_id, group_id, role)
    VALUES (owner_user_id, new_group_id, 'owner');
    
    result := json_build_object(
        'success', true,
        'group_id', new_group_id,
        'message', 'Group created successfully'
    );
    
    RETURN result;
END;
$$;

-- Function to get user's groups with member counts
CREATE OR REPLACE FUNCTION get_user_groups(user_id_param UUID DEFAULT auth.uid())
RETURNS TABLE (
    group_id UUID,
    group_name TEXT,
    group_description TEXT,
    user_role group_role,
    member_count BIGINT,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as group_id,
        g.name as group_name,
        g.description as group_description,
        ug.role as user_role,
        (SELECT COUNT(*) FROM user_groups WHERE group_id = g.id) as member_count,
        ug.joined_at,
        g.created_at
    FROM groups g
    JOIN user_groups ug ON g.id = ug.group_id
    WHERE ug.user_id = user_id_param
    ORDER BY ug.joined_at DESC;
END;
$$;

-- Update invite code functions to handle group assignment
CREATE OR REPLACE FUNCTION use_invite_code_with_group(
    code_to_use TEXT,
    user_id_param UUID,
    group_name TEXT DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record RECORD;
    target_group_id UUID;
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
    
    -- Handle group assignment
    IF code_record.group_id IS NOT NULL THEN
        -- Code is linked to existing group
        target_group_id := code_record.group_id;
    ELSE
        -- Code is not linked to a group, create new group
        INSERT INTO groups (name, description, created_by)
        VALUES (
            COALESCE(group_name, 'New Group from ' || code_to_use),
            'Group created from invite code: ' || code_to_use,
            user_id_param
        )
        RETURNING id INTO target_group_id;
        
        -- Link the invite code to the new group for future users
        UPDATE invite_codes 
        SET group_id = target_group_id,
            updated_at = NOW()
        WHERE id = code_record.id;
    END IF;
    
    -- Add user to group (check if already a member first)
    IF NOT EXISTS (
        SELECT 1 FROM user_groups 
        WHERE user_id = user_id_param AND group_id = target_group_id
    ) THEN
        -- Determine role: if this is the first member and group was just created, make them owner
        INSERT INTO user_groups (user_id, group_id, role)
        VALUES (
            user_id_param, 
            target_group_id, 
            CASE 
                WHEN code_record.group_id IS NULL THEN 'owner'::group_role
                ELSE 'member'::group_role
            END
        );
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
        'code_id', code_record.id,
        'group_id', target_group_id
    );
    
    RETURN result;
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Add trigger for updated_at on groups table
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Create a default group for existing users and reviews
DO $$
DECLARE
    default_group_id UUID;
    user_record RECORD;
BEGIN
    -- Create a default group if there are existing users
    IF EXISTS (SELECT 1 FROM users LIMIT 1) THEN
        -- Create the default group
        INSERT INTO groups (name, description)
        VALUES ('Family & Friends', 'Default group for existing users')
        RETURNING id INTO default_group_id;
        
        -- Add all existing users to the default group
        FOR user_record IN SELECT id FROM users LOOP
            INSERT INTO user_groups (user_id, group_id, role)
            VALUES (user_record.id, default_group_id, 'member')
            ON CONFLICT (user_id, group_id) DO NOTHING;
        END LOOP;
        
        -- Update existing reviews to belong to the default group
        UPDATE reviews 
        SET group_id = default_group_id 
        WHERE group_id IS NULL;
        
        -- Update the test invite code to point to this default group
        UPDATE invite_codes 
        SET group_id = default_group_id,
            description = 'Initial access code - joins Family & Friends group'
        WHERE code = '123456';
        
        RAISE NOTICE 'Created default group and migrated existing users and reviews';
    END IF;
END
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
--  Groups table created with RLS
--  User_groups junction table with roles  
--  Invite_codes linked to groups
--  Reviews linked to groups for visibility
--  RLS policies for group-based access
--  Functions for group management and invite code handling
--  Existing data migrated to default group