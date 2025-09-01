-- ============================================================================
-- ALLOW GROUP MEMBERS TO CREATE INVITE CODES FOR THEIR GROUPS
-- ============================================================================
-- This migration adds an RLS policy to allow group members to generate
-- invite codes for groups they belong to, enabling the new democratic
-- invite code generation feature.
-- ============================================================================

-- Add new RLS policy for group members to create invite codes
CREATE POLICY "Group members can create invite codes for their groups" ON invite_codes
    FOR INSERT 
    WITH CHECK (
        -- User must be authenticated
        auth.uid() IS NOT NULL
        -- User must be creating the code (created_by matches auth user)
        AND created_by = auth.uid()
        -- If group_id is specified, user must be a member of that group
        AND (
            group_id IS NULL 
            OR EXISTS (
                SELECT 1 FROM user_groups 
                WHERE user_id = auth.uid() 
                AND group_id = invite_codes.group_id
            )
        )
    );

-- Add comment explaining the policy
COMMENT ON POLICY "Group members can create invite codes for their groups" ON invite_codes IS 
'Allows authenticated users to create invite codes for groups they are members of. This enables the democratic invite system where any group member can invite others to join their group.';