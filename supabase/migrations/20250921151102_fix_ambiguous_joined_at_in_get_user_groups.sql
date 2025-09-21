-- ============================================================================
-- FIX AMBIGUOUS COLUMN REFERENCE IN get_user_groups FUNCTION
-- ============================================================================

-- The function has ambiguous column references to 'joined_at' and 'group_id'
-- in the paged CTE, which causes PostgreSQL errors
CREATE OR REPLACE FUNCTION get_user_groups(
  user_id_param UUID DEFAULT auth.uid(),
  limit_param INT DEFAULT NULL,
  offset_param INT DEFAULT NULL,
  cursor_joined_at TIMESTAMPTZ DEFAULT NULL,
  cursor_group_id UUID DEFAULT NULL
)
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
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      g.id AS group_id,
      g.name AS group_name,
      g.description AS group_description,
      ug.role AS user_role,
      (SELECT COUNT(*) FROM user_groups ug2 WHERE ug2.group_id = g.id) AS member_count,
      ug.joined_at,
      g.created_at
    FROM groups g
    JOIN user_groups ug ON g.id = ug.group_id
    WHERE ug.user_id = user_id_param
  ),
  paged AS (
    SELECT * FROM base
    WHERE (
      cursor_joined_at IS NULL OR
      base.joined_at < cursor_joined_at OR
      (base.joined_at = cursor_joined_at AND base.group_id < cursor_group_id)
    )
    ORDER BY base.joined_at DESC, base.group_id DESC
    LIMIT COALESCE(limit_param, 100000000)
    OFFSET COALESCE(offset_param, 0)
  )
  SELECT 
    paged.group_id,
    paged.group_name,
    paged.group_description,
    paged.user_role,
    paged.member_count,
    paged.joined_at,
    paged.created_at
  FROM paged;
END;
$$;

COMMENT ON FUNCTION get_user_groups IS 'User groups with optional limit/offset or keyset pagination - fixed ambiguous column references';

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_groups(UUID, INT, INT, TIMESTAMPTZ, UUID) TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================