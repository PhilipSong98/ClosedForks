-- CRITICAL SECURITY FIX: Enforce group-based review visibility at RLS level
--
-- Problem: The current "Authenticated users can view reviews" policy allows
-- ALL authenticated users to see ALL reviews. While the application uses
-- security functions to filter, direct database queries bypass this.
--
-- Fix: Replace with proper group-based RLS policy that checks the review's
-- group_id against the user's group memberships.

-- 1. Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view reviews" ON public.reviews;

-- 2. Create proper group-based visibility policy
-- A user can see a review if:
--   a) They are the author (can always see their own reviews)
--   b) The review belongs to a group they are a member of
CREATE POLICY "Users can view reviews from their groups" ON public.reviews
    FOR SELECT
    USING (
        -- Authors can always see their own reviews
        author_id = auth.uid()
        OR
        -- Users can see reviews that belong to groups they're in
        group_id IN (
            SELECT group_id
            FROM user_groups
            WHERE user_id = auth.uid()
        )
    );

-- 3. Add index to optimize the group membership lookup for this policy
-- (if not already exists)
CREATE INDEX IF NOT EXISTS idx_user_groups_user_id_group_id
    ON user_groups(user_id, group_id);

-- 4. Add index on reviews.group_id for faster policy evaluation
CREATE INDEX IF NOT EXISTS idx_reviews_group_id
    ON reviews(group_id);

COMMENT ON POLICY "Users can view reviews from their groups" ON public.reviews IS
    'SECURITY: Enforces group-based visibility - users can only see reviews from groups they belong to, or their own reviews';
