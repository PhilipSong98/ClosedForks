-- Following System Migration
--
-- Implements Instagram-style following with:
-- 1. Follow requests (must be accepted)
-- 2. Additive visibility (see reviews from groups + followed users)
--

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

-- Follow relationships (after request is accepted)
CREATE TABLE user_follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- Pending follow requests
CREATE TABLE follow_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, target_id),
    CONSTRAINT no_self_request CHECK (requester_id != target_id)
);

-- Add denormalized counts to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);
CREATE INDEX idx_user_follows_created_at ON user_follows(created_at DESC);

CREATE INDEX idx_follow_requests_target_status ON follow_requests(target_id, status);
CREATE INDEX idx_follow_requests_requester_status ON follow_requests(requester_id, status);
CREATE INDEX idx_follow_requests_pending ON follow_requests(status) WHERE status = 'pending';

-- ============================================================================
-- 3. CREATE TRIGGER FOR COUNT MAINTENANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET following_count = COALESCE(following_count, 0) + 1 WHERE id = NEW.follower_id;
        UPDATE users SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = NEW.following_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET following_count = GREATEST(COALESCE(following_count, 0) - 1, 0) WHERE id = OLD.follower_id;
        UPDATE users SET followers_count = GREATEST(COALESCE(followers_count, 0) - 1, 0) WHERE id = OLD.following_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follow_counts
AFTER INSERT OR DELETE ON user_follows
FOR EACH ROW EXECUTE FUNCTION update_follow_counts();

-- ============================================================================
-- 4. ENABLE RLS AND CREATE POLICIES
-- ============================================================================

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_requests ENABLE ROW LEVEL SECURITY;

-- user_follows policies
CREATE POLICY "Anyone can view follow relationships" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can delete their own follows" ON user_follows
    FOR DELETE USING (follower_id = auth.uid());

-- follow_requests policies
CREATE POLICY "Users can view their incoming requests" ON follow_requests
    FOR SELECT USING (target_id = auth.uid());

CREATE POLICY "Users can view their outgoing requests" ON follow_requests
    FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Users can create follow requests" ON follow_requests
    FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Target users can update request status" ON follow_requests
    FOR UPDATE USING (target_id = auth.uid());

CREATE POLICY "Requesters can delete their own requests" ON follow_requests
    FOR DELETE USING (requester_id = auth.uid());

-- ============================================================================
-- 5. CREATE FOLLOW ACTION FUNCTIONS
-- ============================================================================

-- Send a follow request
CREATE OR REPLACE FUNCTION send_follow_request(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requester UUID := auth.uid();
    existing_follow RECORD;
    existing_request RECORD;
BEGIN
    -- Prevent self-following
    IF requester = target_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot follow yourself');
    END IF;

    -- Check if already following
    SELECT * INTO existing_follow FROM user_follows
    WHERE follower_id = requester AND following_id = target_user_id;

    IF existing_follow IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Already following this user', 'status', 'following');
    END IF;

    -- Check for existing pending request
    SELECT * INTO existing_request FROM follow_requests
    WHERE requester_id = requester AND target_id = target_user_id AND status = 'pending';

    IF existing_request IS NOT NULL THEN
        RETURN json_build_object('success', false, 'error', 'Request already pending', 'status', 'requested');
    END IF;

    -- Create the request (or update if previously rejected)
    INSERT INTO follow_requests (requester_id, target_id, status)
    VALUES (requester, target_user_id, 'pending')
    ON CONFLICT (requester_id, target_id)
    DO UPDATE SET status = 'pending', updated_at = NOW();

    RETURN json_build_object('success', true, 'message', 'Follow request sent', 'status', 'requested');
END;
$$;

-- Accept a follow request
CREATE OR REPLACE FUNCTION accept_follow_request(request_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    req RECORD;
    current_user_id UUID := auth.uid();
BEGIN
    -- Get and verify the request
    SELECT * INTO req FROM follow_requests
    WHERE id = request_id_param AND target_id = current_user_id AND status = 'pending';

    IF req IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Request not found or not authorized');
    END IF;

    -- Create the follow relationship
    INSERT INTO user_follows (follower_id, following_id)
    VALUES (req.requester_id, req.target_id)
    ON CONFLICT DO NOTHING;

    -- Update request status
    UPDATE follow_requests SET status = 'accepted', updated_at = NOW()
    WHERE id = request_id_param;

    RETURN json_build_object('success', true, 'message', 'Follow request accepted');
END;
$$;

-- Reject a follow request
CREATE OR REPLACE FUNCTION reject_follow_request(request_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    -- Update request status (only if target is current user)
    UPDATE follow_requests
    SET status = 'rejected', updated_at = NOW()
    WHERE id = request_id_param AND target_id = current_user_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Request not found or not authorized');
    END IF;

    RETURN json_build_object('success', true, 'message', 'Follow request rejected');
END;
$$;

-- Unfollow a user
CREATE OR REPLACE FUNCTION unfollow_user(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    DELETE FROM user_follows
    WHERE follower_id = current_user_id AND following_id = target_user_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Not following this user');
    END IF;

    RETURN json_build_object('success', true, 'message', 'Unfollowed successfully');
END;
$$;

-- Cancel a pending follow request
CREATE OR REPLACE FUNCTION cancel_follow_request(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    DELETE FROM follow_requests
    WHERE requester_id = current_user_id AND target_id = target_user_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'No pending request found');
    END IF;

    RETURN json_build_object('success', true, 'message', 'Request cancelled');
END;
$$;

-- Get follow status between current user and target
CREATE OR REPLACE FUNCTION get_follow_status(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
    is_following BOOLEAN := false;
    has_pending_request BOOLEAN := false;
    is_follower BOOLEAN := false;
BEGIN
    -- Check if following
    SELECT EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = current_user_id AND following_id = target_user_id
    ) INTO is_following;

    -- Check for pending outgoing request
    SELECT EXISTS (
        SELECT 1 FROM follow_requests
        WHERE requester_id = current_user_id AND target_id = target_user_id AND status = 'pending'
    ) INTO has_pending_request;

    -- Check if they follow us
    SELECT EXISTS (
        SELECT 1 FROM user_follows
        WHERE follower_id = target_user_id AND following_id = current_user_id
    ) INTO is_follower;

    RETURN json_build_object(
        'isFollowing', is_following,
        'hasPendingRequest', has_pending_request,
        'isFollower', is_follower
    );
END;
$$;

-- ============================================================================
-- 6. CREATE FOLLOWER/FOLLOWING LIST FUNCTIONS
-- ============================================================================

-- Get a user's followers (paginated)
CREATE OR REPLACE FUNCTION get_user_followers(
    target_user_id UUID,
    cursor_created_at TIMESTAMPTZ DEFAULT NULL,
    cursor_id UUID DEFAULT NULL,
    limit_param INT DEFAULT 20
)
RETURNS TABLE (
    follow_id UUID,
    user_id UUID,
    user_name TEXT,
    user_full_name TEXT,
    user_avatar_url TEXT,
    followed_at TIMESTAMPTZ,
    is_following_back BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        uf.id AS follow_id,
        u.id AS user_id,
        u.name AS user_name,
        u.full_name AS user_full_name,
        u.avatar_url AS user_avatar_url,
        uf.created_at AS followed_at,
        EXISTS (
            SELECT 1 FROM user_follows uf2
            WHERE uf2.follower_id = current_user_id AND uf2.following_id = u.id
        ) AS is_following_back
    FROM user_follows uf
    JOIN users u ON u.id = uf.follower_id
    WHERE uf.following_id = target_user_id
      AND (
        cursor_created_at IS NULL OR
        uf.created_at < cursor_created_at OR
        (uf.created_at = cursor_created_at AND uf.id < cursor_id)
      )
    ORDER BY uf.created_at DESC, uf.id DESC
    LIMIT limit_param;
END;
$$;

-- Get users that a user follows (paginated)
CREATE OR REPLACE FUNCTION get_user_following(
    target_user_id UUID,
    cursor_created_at TIMESTAMPTZ DEFAULT NULL,
    cursor_id UUID DEFAULT NULL,
    limit_param INT DEFAULT 20
)
RETURNS TABLE (
    follow_id UUID,
    user_id UUID,
    user_name TEXT,
    user_full_name TEXT,
    user_avatar_url TEXT,
    followed_at TIMESTAMPTZ,
    is_followed_by_viewer BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        uf.id AS follow_id,
        u.id AS user_id,
        u.name AS user_name,
        u.full_name AS user_full_name,
        u.avatar_url AS user_avatar_url,
        uf.created_at AS followed_at,
        EXISTS (
            SELECT 1 FROM user_follows uf2
            WHERE uf2.follower_id = current_user_id AND uf2.following_id = u.id
        ) AS is_followed_by_viewer
    FROM user_follows uf
    JOIN users u ON u.id = uf.following_id
    WHERE uf.follower_id = target_user_id
      AND (
        cursor_created_at IS NULL OR
        uf.created_at < cursor_created_at OR
        (uf.created_at = cursor_created_at AND uf.id < cursor_id)
      )
    ORDER BY uf.created_at DESC, uf.id DESC
    LIMIT limit_param;
END;
$$;

-- Get pending follow requests for current user
CREATE OR REPLACE FUNCTION get_pending_follow_requests(
    limit_param INT DEFAULT 50
)
RETURNS TABLE (
    request_id UUID,
    requester_id UUID,
    requester_name TEXT,
    requester_full_name TEXT,
    requester_avatar_url TEXT,
    requested_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        fr.id AS request_id,
        u.id AS requester_id,
        u.name AS requester_name,
        u.full_name AS requester_full_name,
        u.avatar_url AS requester_avatar_url,
        fr.created_at AS requested_at
    FROM follow_requests fr
    JOIN users u ON u.id = fr.requester_id
    WHERE fr.target_id = current_user_id AND fr.status = 'pending'
    ORDER BY fr.created_at DESC
    LIMIT limit_param;
END;
$$;

-- ============================================================================
-- 7. UPDATE FEED VISIBILITY (ADDITIVE: Groups + Follows)
-- ============================================================================

-- Update RLS policy for reviews to include followed users
DROP POLICY IF EXISTS "Users can view reviews from shared group members" ON public.reviews;

CREATE POLICY "Users can view reviews from groups and followed users" ON public.reviews
    FOR SELECT
    USING (
        author_id = auth.uid()
        OR
        -- Group-based visibility
        author_id IN (
            SELECT DISTINCT ug2.user_id
            FROM user_groups ug1
            JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
            WHERE ug1.user_id = auth.uid()
        )
        OR
        -- Follow-based visibility (ADDITIVE)
        author_id IN (
            SELECT following_id FROM user_follows WHERE follower_id = auth.uid()
        )
    );

COMMENT ON POLICY "Users can view reviews from groups and followed users" ON public.reviews IS
    'ADDITIVE VISIBILITY: Users can see reviews from group members AND users they follow';

-- Update get_user_feed_optimized() for additive visibility
DROP FUNCTION IF EXISTS get_user_feed_optimized(UUID, TIMESTAMPTZ, UUID, INT, UUID);

CREATE OR REPLACE FUNCTION get_user_feed_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_param INT DEFAULT 15,
  restaurant_id_filter UUID DEFAULT NULL
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  like_count INTEGER,
  group_id UUID,

  author_name TEXT,
  author_full_name TEXT,
  author_email TEXT,
  author_avatar_url TEXT,

  restaurant_name TEXT,
  restaurant_city TEXT,
  restaurant_address TEXT,
  restaurant_price_level INTEGER,
  restaurant_cuisine TEXT[],
  restaurant_google_place_id TEXT,
  restaurant_google_maps_url TEXT,
  restaurant_google_data JSONB,
  restaurant_lat DOUBLE PRECISION,
  restaurant_lng DOUBLE PRECISION,

  restaurant_avg_rating NUMERIC,
  restaurant_review_count BIGINT,

  is_liked_by_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- ADDITIVE VISIBILITY: Groups UNION Follows
  WITH visible_authors AS (
    -- Authors from shared groups
    SELECT DISTINCT ug2.user_id
    FROM user_groups ug1
    JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
    WHERE ug1.user_id = user_id_param

    UNION

    -- Authors that are followed (ADDITIVE)
    SELECT following_id AS user_id
    FROM user_follows
    WHERE follower_id = user_id_param
  ),
  accessible_reviews AS (
    SELECT r.*
    FROM reviews r
    WHERE r.author_id IN (SELECT user_id FROM visible_authors)
      AND (restaurant_id_filter IS NULL OR r.restaurant_id = restaurant_id_filter)
      AND (
        cursor_created_at IS NULL OR
        r.created_at < cursor_created_at OR
        (r.created_at = cursor_created_at AND r.id < cursor_id)
      )
    ORDER BY r.created_at DESC, r.id DESC
    LIMIT limit_param
  ),
  restaurant_stats AS (
    SELECT
      r2.restaurant_id,
      ROUND(AVG(r2.rating_overall), 1) AS avg_rating,
      COUNT(*)::BIGINT AS review_count
    FROM reviews r2
    WHERE r2.author_id IN (SELECT user_id FROM visible_authors)
      AND r2.restaurant_id IN (SELECT ar.restaurant_id FROM accessible_reviews ar)
      AND r2.rating_overall IS NOT NULL
    GROUP BY r2.restaurant_id
  ),
  user_likes_cte AS (
    SELECT rl.review_id
    FROM review_likes rl
    WHERE rl.user_id = user_id_param
      AND rl.review_id IN (SELECT ar.id FROM accessible_reviews ar)
  )
  SELECT
    ar.id AS review_id,
    ar.restaurant_id,
    ar.author_id,
    ar.rating_overall,
    ar.dish,
    ar.review AS review_text,
    ar.recommend,
    ar.tips,
    ar.tags,
    ar.visit_date,
    ar.price_per_person,
    ar.created_at,
    ar.updated_at,
    ar.like_count,
    ar.group_id,

    u.name AS author_name,
    u.full_name AS author_full_name,
    u.email AS author_email,
    u.avatar_url AS author_avatar_url,

    rest.name AS restaurant_name,
    rest.city AS restaurant_city,
    rest.address AS restaurant_address,
    rest.price_level AS restaurant_price_level,
    rest.cuisine AS restaurant_cuisine,
    rest.google_place_id AS restaurant_google_place_id,
    rest.google_maps_url AS restaurant_google_maps_url,
    rest.google_data AS restaurant_google_data,
    rest.lat AS restaurant_lat,
    rest.lng AS restaurant_lng,

    COALESCE(rs.avg_rating, 0) AS restaurant_avg_rating,
    COALESCE(rs.review_count, 0) AS restaurant_review_count,

    (ulc.review_id IS NOT NULL) AS is_liked_by_user
  FROM accessible_reviews ar
  JOIN users u ON u.id = ar.author_id
  JOIN restaurants rest ON rest.id = ar.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ar.restaurant_id
  LEFT JOIN user_likes_cte ulc ON ulc.review_id = ar.id
  ORDER BY ar.created_at DESC, ar.id DESC;
END;
$$;

COMMENT ON FUNCTION get_user_feed_optimized IS 'Homepage feed with ADDITIVE visibility - shows reviews from group members AND followed users';

-- Update get_user_liked_reviews_optimized() for additive visibility
DROP FUNCTION IF EXISTS get_user_liked_reviews_optimized(UUID, TIMESTAMPTZ, UUID, INT);

CREATE OR REPLACE FUNCTION get_user_liked_reviews_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  limit_param INT DEFAULT 15
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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  like_count INTEGER,
  group_id UUID,

  author_name TEXT,
  author_full_name TEXT,
  author_email TEXT,
  author_avatar_url TEXT,

  restaurant_name TEXT,
  restaurant_city TEXT,
  restaurant_address TEXT,
  restaurant_price_level INTEGER,
  restaurant_cuisine TEXT[],
  restaurant_google_place_id TEXT,
  restaurant_google_maps_url TEXT,
  restaurant_google_data JSONB,
  restaurant_lat DOUBLE PRECISION,
  restaurant_lng DOUBLE PRECISION,

  restaurant_avg_rating NUMERIC,
  restaurant_review_count BIGINT,

  is_liked_by_user BOOLEAN,
  like_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- ADDITIVE VISIBILITY: Groups UNION Follows
  WITH visible_authors AS (
    SELECT DISTINCT ug2.user_id
    FROM user_groups ug1
    JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
    WHERE ug1.user_id = user_id_param

    UNION

    SELECT following_id AS user_id
    FROM user_follows
    WHERE follower_id = user_id_param
  ),
  user_liked_reviews AS (
    SELECT r.*, rl.created_at AS like_created_at
    FROM reviews r
    JOIN review_likes rl ON rl.review_id = r.id
    WHERE rl.user_id = user_id_param
      AND r.author_id IN (SELECT user_id FROM visible_authors)
      AND (
        cursor_created_at IS NULL OR
        rl.created_at < cursor_created_at OR
        (rl.created_at = cursor_created_at AND r.id < cursor_id)
      )
    ORDER BY rl.created_at DESC, r.id DESC
    LIMIT limit_param
  ),
  restaurant_stats AS (
    SELECT r2.restaurant_id,
           ROUND(AVG(r2.rating_overall), 1) AS avg_rating,
           COUNT(*)::BIGINT AS review_count
    FROM reviews r2
    WHERE r2.author_id IN (SELECT user_id FROM visible_authors)
      AND r2.restaurant_id IN (SELECT ulr.restaurant_id FROM user_liked_reviews ulr)
      AND r2.rating_overall IS NOT NULL
    GROUP BY r2.restaurant_id
  )
  SELECT
    ulr.id AS review_id,
    ulr.restaurant_id,
    ulr.author_id,
    ulr.rating_overall,
    ulr.dish,
    ulr.review AS review_text,
    ulr.recommend,
    ulr.tips,
    ulr.tags,
    ulr.visit_date,
    ulr.price_per_person,
    ulr.created_at,
    ulr.updated_at,
    ulr.like_count,
    ulr.group_id,

    u.name AS author_name,
    u.full_name AS author_full_name,
    u.email AS author_email,
    u.avatar_url AS author_avatar_url,

    rest.name AS restaurant_name,
    rest.city AS restaurant_city,
    rest.address AS restaurant_address,
    rest.price_level AS restaurant_price_level,
    rest.cuisine AS restaurant_cuisine,
    rest.google_place_id AS restaurant_google_place_id,
    rest.google_maps_url AS restaurant_google_maps_url,
    rest.google_data AS restaurant_google_data,
    rest.lat AS restaurant_lat,
    rest.lng AS restaurant_lng,

    COALESCE(rs.avg_rating, 0) AS restaurant_avg_rating,
    COALESCE(rs.review_count, 0) AS restaurant_review_count,

    TRUE AS is_liked_by_user,
    ulr.like_created_at
  FROM user_liked_reviews ulr
  JOIN users u ON u.id = ulr.author_id
  JOIN restaurants rest ON rest.id = ulr.restaurant_id
  LEFT JOIN restaurant_stats rs ON rs.restaurant_id = ulr.restaurant_id
  ORDER BY ulr.like_created_at DESC, ulr.id DESC;
END;
$$;

COMMENT ON FUNCTION get_user_liked_reviews_optimized IS 'Liked reviews with ADDITIVE visibility';

-- Update get_restaurants_feed_optimized() for additive visibility
DROP FUNCTION IF EXISTS get_restaurants_feed_optimized(UUID, BIGINT, TIMESTAMPTZ, UUID, NUMERIC, INT[], TEXT[], INT);

CREATE OR REPLACE FUNCTION get_restaurants_feed_optimized(
  user_id_param UUID DEFAULT auth.uid(),
  cursor_review_count BIGINT DEFAULT NULL,
  cursor_created_at TIMESTAMPTZ DEFAULT NULL,
  cursor_id UUID DEFAULT NULL,
  min_rating NUMERIC DEFAULT 0,
  price_levels INT[] DEFAULT NULL,
  tags_filter TEXT[] DEFAULT NULL,
  limit_param INT DEFAULT 15
)
RETURNS TABLE (
  restaurant_id UUID,
  restaurant_name TEXT,
  restaurant_address TEXT,
  restaurant_city TEXT,
  restaurant_cuisine TEXT[],
  restaurant_price_level INTEGER,
  restaurant_lat DOUBLE PRECISION,
  restaurant_lng DOUBLE PRECISION,
  restaurant_google_place_id TEXT,
  restaurant_google_maps_url TEXT,
  restaurant_google_data JSONB,
  restaurant_created_at TIMESTAMPTZ,
  avg_rating NUMERIC,
  review_count BIGINT,
  aggregated_tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- ADDITIVE VISIBILITY: Groups UNION Follows
  WITH visible_authors AS (
    SELECT DISTINCT ug2.user_id
    FROM user_groups ug1
    JOIN user_groups ug2 ON ug1.group_id = ug2.group_id
    WHERE ug1.user_id = user_id_param

    UNION

    SELECT following_id AS user_id
    FROM user_follows
    WHERE follower_id = user_id_param
  ),
  restaurant_reviews AS (
    SELECT DISTINCT
      r.restaurant_id,
      r.rating_overall,
      r.tags
    FROM reviews r
    WHERE r.author_id IN (SELECT user_id FROM visible_authors)
      AND r.rating_overall IS NOT NULL
      AND (min_rating = 0 OR r.rating_overall >= min_rating)
      AND (tags_filter IS NULL OR r.tags && tags_filter)
  ),
  restaurant_aggregates AS (
    SELECT
      rr.restaurant_id,
      ROUND(AVG(rr.rating_overall), 1) as avg_rating,
      COUNT(*)::BIGINT as review_count,
      ARRAY(
        SELECT DISTINCT unnest(tags)
        FROM restaurant_reviews rr2
        WHERE rr2.restaurant_id = rr.restaurant_id
          AND tags IS NOT NULL
          AND array_length(tags, 1) > 0
      ) as aggregated_tags
    FROM restaurant_reviews rr
    GROUP BY rr.restaurant_id
    HAVING COUNT(*) > 0
      AND (min_rating = 0 OR AVG(rr.rating_overall) >= min_rating)
  )
  SELECT
    rest.id as restaurant_id,
    rest.name as restaurant_name,
    rest.address as restaurant_address,
    rest.city as restaurant_city,
    rest.cuisine as restaurant_cuisine,
    rest.price_level as restaurant_price_level,
    rest.lat as restaurant_lat,
    rest.lng as restaurant_lng,
    rest.google_place_id as restaurant_google_place_id,
    rest.google_maps_url as restaurant_google_maps_url,
    rest.google_data as restaurant_google_data,
    rest.created_at as restaurant_created_at,
    ra.avg_rating,
    ra.review_count,
    ra.aggregated_tags
  FROM restaurants rest
  JOIN restaurant_aggregates ra ON ra.restaurant_id = rest.id
  WHERE (price_levels IS NULL OR rest.price_level = ANY(price_levels))
    AND (
      cursor_review_count IS NULL OR
      ra.review_count < cursor_review_count OR
      (ra.review_count = cursor_review_count AND rest.created_at < cursor_created_at) OR
      (ra.review_count = cursor_review_count AND rest.created_at = cursor_created_at AND rest.id < cursor_id)
    )
  ORDER BY ra.review_count DESC, rest.created_at DESC, rest.id DESC
  LIMIT limit_param;
END;
$$;

COMMENT ON FUNCTION get_restaurants_feed_optimized IS 'Restaurants feed with ADDITIVE visibility - aggregates from group members AND followed users';

-- ============================================================================
-- 8. ADD COMMENTS
-- ============================================================================

COMMENT ON TABLE user_follows IS 'Follow relationships between users (after request accepted)';
COMMENT ON TABLE follow_requests IS 'Pending follow requests awaiting acceptance';
COMMENT ON FUNCTION send_follow_request IS 'Send a follow request to another user';
COMMENT ON FUNCTION accept_follow_request IS 'Accept an incoming follow request';
COMMENT ON FUNCTION reject_follow_request IS 'Reject an incoming follow request';
COMMENT ON FUNCTION unfollow_user IS 'Unfollow a user you are currently following';
COMMENT ON FUNCTION cancel_follow_request IS 'Cancel a pending follow request you sent';
COMMENT ON FUNCTION get_follow_status IS 'Get the follow relationship status between current user and target';
COMMENT ON FUNCTION get_user_followers IS 'Get paginated list of a user followers';
COMMENT ON FUNCTION get_user_following IS 'Get paginated list of users someone follows';
COMMENT ON FUNCTION get_pending_follow_requests IS 'Get pending follow requests for current user';
