-- Fix Ambiguous Column References in Database Functions
-- This migration fixes PostgreSQL ambiguity errors in get_group_reviews and get_group_members functions

-- ============================================================================
-- 1. FIX get_group_reviews FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_reviews(
    group_id_param UUID,
    user_id_param UUID DEFAULT auth.uid(),
    limit_param INTEGER DEFAULT 50,
    offset_param INTEGER DEFAULT 0
)
RETURNS TABLE (
    review_id UUID,
    restaurant_id UUID,
    author_id UUID,
    rating_overall NUMERIC,
    dish TEXT,
    review_text TEXT,
    recommend BOOLEAN,
    tips TEXT,
    tags TEXT[],
    visit_date DATE,
    price_per_person NUMERIC,
    visibility TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    like_count INTEGER,
    group_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First check if user is a member of the group
    -- Fix: Explicitly qualify column names with table alias
    IF NOT EXISTS (
        SELECT 1 FROM user_groups ug
        WHERE ug.user_id = user_id_param AND ug.group_id = group_id_param
    ) THEN
        RETURN; -- Return empty if user is not in the group
    END IF;

    RETURN QUERY
    SELECT 
        r.id as review_id,
        r.restaurant_id,
        r.author_id,
        r.rating_overall,
        r.dish,
        r.review as review_text,
        r.recommend,
        r.tips,
        r.tags,
        r.visit_date,
        r.price_per_person,
        r.visibility::TEXT,
        r.created_at,
        r.updated_at,
        r.like_count,
        r.group_id
    FROM reviews r
    WHERE r.group_id = group_id_param
    ORDER BY r.created_at DESC
    LIMIT limit_param OFFSET offset_param;
END;
$$;

-- ============================================================================
-- 2. FIX get_group_members FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_group_members(
    group_id_param UUID,
    user_id_param UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    member_id UUID,
    user_id UUID,
    role group_role,
    joined_at TIMESTAMPTZ,
    user_name TEXT,
    user_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has access to this group
    -- Fix: Explicitly qualify column names with table alias
    IF NOT EXISTS (
        SELECT 1 FROM user_groups ug
        WHERE ug.user_id = user_id_param AND ug.group_id = group_id_param
    ) THEN
        RETURN; -- Return empty if user is not in the group
    END IF;

    RETURN QUERY
    SELECT 
        ug.id as member_id,
        ug.user_id,
        ug.role,
        ug.joined_at,
        u.name as user_name,
        u.email as user_email
    FROM user_groups ug
    JOIN users u ON u.id = ug.user_id
    WHERE ug.group_id = group_id_param
    ORDER BY ug.joined_at ASC;
END;
$$;

-- ============================================================================
-- 3. ALSO FIX user_can_access_group FUNCTION FOR CONSISTENCY
-- ============================================================================

CREATE OR REPLACE FUNCTION user_can_access_group(
    user_id_param UUID,
    group_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Fix: Explicitly qualify column names with table alias
    RETURN EXISTS (
        SELECT 1 FROM user_groups ug
        WHERE ug.user_id = user_id_param AND ug.group_id = group_id_param
    );
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of fixes:
-- ✅ Fixed ambiguous column reference in get_group_reviews function
-- ✅ Fixed ambiguous column reference in get_group_members function  
-- ✅ Updated user_can_access_group for consistency
-- ✅ All functions now use explicit table aliases (ug.user_id, ug.group_id)