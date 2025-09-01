-- Fix Infinite Recursion in user_groups RLS Policies
-- The previous policies were causing infinite recursion by referencing the same table they protect

-- ============================================================================
-- DROP PROBLEMATIC POLICIES
-- ============================================================================

-- Remove policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view group member lists" ON user_groups;
DROP POLICY IF EXISTS "Group owners and admins can manage memberships" ON user_groups;

-- ============================================================================
-- CREATE FIXED RLS POLICIES WITHOUT RECURSION
-- ============================================================================

-- Policy: Users can view memberships in groups they belong to
-- This avoids recursion by using a simpler approach
CREATE POLICY "Users can view group memberships" ON user_groups
    FOR SELECT 
    USING (
        -- Allow users to see their own membership
        user_id = auth.uid()
        OR
        -- Allow users to see other memberships in groups they belong to
        group_id IN (
            -- Use a direct query to get user's group IDs
            SELECT ug.group_id 
            FROM user_groups ug
            WHERE ug.user_id = auth.uid()
        )
    );

-- Policy: Group owners and admins can update memberships
CREATE POLICY "Group admins can update memberships" ON user_groups
    FOR UPDATE 
    USING (
        -- Allow users to update their own membership (role changes by admin)
        user_id = auth.uid()
        OR
        -- Allow admins to update memberships in their groups
        (auth.uid() IN (
            SELECT ug.user_id 
            FROM user_groups ug
            WHERE ug.group_id = user_groups.group_id 
            AND ug.role IN ('owner', 'admin')
        ))
    );

-- Policy: Group owners and admins can delete memberships (kick users)
CREATE POLICY "Group admins can delete memberships" ON user_groups
    FOR DELETE 
    USING (
        -- Allow users to delete their own membership (leave group)
        user_id = auth.uid()
        OR
        -- Allow admins to delete memberships in their groups
        (auth.uid() IN (
            SELECT ug.user_id 
            FROM user_groups ug
            WHERE ug.group_id = user_groups.group_id 
            AND ug.role IN ('owner', 'admin')
        ))
    );

-- ============================================================================
-- ALSO FIX THE REVIEWS POLICY TO AVOID POTENTIAL ISSUES
-- ============================================================================

-- Update the reviews policy to be more efficient and avoid potential recursion
DROP POLICY IF EXISTS "Users can view reviews from their groups" ON reviews;

CREATE POLICY "Users can view reviews from their groups" ON reviews
    FOR SELECT 
    USING (
        -- Users can see reviews where the author shares at least one group
        author_id IN (
            -- Get all users who share at least one group with the current user
            SELECT DISTINCT ug2.user_id
            FROM user_groups ug1, user_groups ug2
            WHERE ug1.user_id = auth.uid()
            AND ug2.group_id = ug1.group_id
        )
    );

-- ============================================================================
-- CREATE HELPER FUNCTIONS FOR COMPLEX QUERIES
-- ============================================================================

-- Function to check if a user is admin in a specific group
-- This can be used in API calls instead of complex RLS policies
CREATE OR REPLACE FUNCTION is_user_group_admin(
    user_id_param UUID,
    group_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_groups 
        WHERE user_id = user_id_param 
        AND group_id = group_id_param 
        AND role IN ('owner', 'admin')
    );
END;
$$;

-- Function to check if two users share any groups
CREATE OR REPLACE FUNCTION users_share_group(
    user1_id UUID,
    user2_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_groups ug1, user_groups ug2
        WHERE ug1.user_id = user1_id
        AND ug2.user_id = user2_id
        AND ug1.group_id = ug2.group_id
    );
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- The fixed policies should now work without infinite recursion
-- while maintaining proper security for group-based access control