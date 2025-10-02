-- Fix ambiguous column reference in toggle_review_like function
DROP FUNCTION IF EXISTS toggle_review_like(UUID, UUID);
CREATE OR REPLACE FUNCTION toggle_review_like(
  review_id_param UUID,
  user_id_param UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  is_liked BOOLEAN,
  like_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted BOOLEAN := FALSE;
BEGIN
  -- Ensure the review exists
  IF NOT EXISTS (SELECT 1 FROM reviews r WHERE r.id = review_id_param) THEN
    RETURN QUERY SELECT FALSE, 0; -- caller should handle not found separately
    RETURN;
  END IF;

  -- Try to insert a like
  BEGIN
    INSERT INTO review_likes (review_id, user_id) VALUES (review_id_param, user_id_param);
    inserted := TRUE;
  EXCEPTION WHEN unique_violation THEN
    -- Already liked: remove like
    DELETE FROM review_likes WHERE review_id = review_id_param AND user_id = user_id_param;
    inserted := FALSE;
  END;

  -- Return current like state and count from reviews.like_count (maintained by trigger)
  -- Use table alias to avoid ambiguity
  RETURN QUERY
  SELECT inserted AS is_liked,
         r.like_count AS like_count
  FROM reviews r
  WHERE r.id = review_id_param;
END;
$$;

GRANT EXECUTE ON FUNCTION toggle_review_like(UUID, UUID) TO authenticated;
COMMENT ON FUNCTION toggle_review_like(UUID, UUID) IS 'Atomically toggles a like for a review and returns new state + like_count';
