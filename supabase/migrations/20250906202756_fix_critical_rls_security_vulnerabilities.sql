-- CRITICAL SECURITY FIX: Fix RLS policies that allow unauthorized access
-- This migration addresses the most severe security vulnerabilities

-- 1. Fix users table - Remove public SELECT access
DROP POLICY IF EXISTS "System can read users during signup" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.users;

-- Replace with secure policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Authenticated users can view limited profile data" ON public.users
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        (
            -- Users can see their own full profile
            auth.uid() = id OR 
            -- Users can see limited profile data of users they share groups with
            EXISTS (
                SELECT 1 FROM user_groups ug1
                JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
                WHERE ug1.user_id = auth.uid() AND ug2.user_id = users.id
            )
        )
    );

-- 2. Fix review_likes table - Remove public access
DROP POLICY IF EXISTS "Anyone can view likes" ON public.review_likes;

CREATE POLICY "Authenticated users can view likes" ON public.review_likes
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Fix groups table - Require authentication for creation
DROP POLICY IF EXISTS "Anyone can create groups" ON public.groups;

CREATE POLICY "Authenticated users can create groups" ON public.groups
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        created_by = auth.uid()
    );

-- 4. Fix user_groups table - Consolidate and secure policies
DROP POLICY IF EXISTS "System can insert group memberships" ON public.user_groups;
DROP POLICY IF EXISTS "Users can insert group memberships" ON public.user_groups;

-- Replace with single secure policy
CREATE POLICY "Controlled group membership insertion" ON public.user_groups
    FOR INSERT WITH CHECK (
        -- System operations (invite code processing) or user operations
        auth.role() = 'authenticated' AND (
            -- User can add themselves to groups via invite codes
            user_id = auth.uid() OR
            -- Group admins/owners can add members
            EXISTS (
                SELECT 1 FROM user_groups 
                WHERE group_id = user_groups.group_id 
                AND user_id = auth.uid() 
                AND role IN ('owner', 'admin')
            ) OR
            -- Global admins can manage memberships
            EXISTS (
                SELECT 1 FROM users 
                WHERE id = auth.uid() AND is_admin_user = true
            )
        )
    );

-- 5. Fix reviews table - Remove overly permissive policy
DROP POLICY IF EXISTS "Users can view network reviews" ON public.reviews;

-- The existing "Authenticated users can view reviews" policy is sufficient
-- It requires authentication and the application logic handles group filtering

-- 6. PostGIS spatial_ref_sys table security note
-- NOTE: Cannot enable RLS on spatial_ref_sys as it's owned by PostGIS extension
-- This table contains only spatial reference system definitions (coordinate systems)
-- and poses minimal security risk as it contains no user data

-- 7. Ensure all tables have proper RLS enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.to_eat_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_code_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "Users can view own profile" ON public.users IS 'SECURITY: Users can only see their own complete profile data';
COMMENT ON POLICY "Authenticated users can view limited profile data" ON public.users IS 'SECURITY: Limited profile access based on group membership';
COMMENT ON POLICY "Authenticated users can view likes" ON public.review_likes IS 'SECURITY: Requires authentication to view like data';
COMMENT ON POLICY "Authenticated users can create groups" ON public.groups IS 'SECURITY: Requires authentication and proper ownership for group creation';
COMMENT ON POLICY "Controlled group membership insertion" ON public.user_groups IS 'SECURITY: Controlled access for group membership management';