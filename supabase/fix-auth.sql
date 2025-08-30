-- Fix Authentication Integration
-- This script fixes the users table to properly reference Supabase Auth

-- First, drop the existing users table and all dependencies
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS review_photos CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Recreate users table that properly references auth.users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    home_city TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate other tables (they were dropped due to CASCADE)
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    email TEXT,
    status invite_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating_overall INTEGER CHECK (rating_overall >= 1 AND rating_overall <= 5),
    food INTEGER CHECK (food >= 1 AND food <= 5),
    service INTEGER CHECK (service >= 1 AND service <= 5),
    vibe INTEGER CHECK (vibe >= 1 AND vibe <= 5),
    value INTEGER CHECK (value >= 1 AND value <= 5),
    text TEXT,
    visit_date DATE NOT NULL,
    price_per_person DECIMAL(10,2),
    visibility visibility_type DEFAULT 'my_circles',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE review_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL
);

CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate indexes
CREATE INDEX idx_reviews_restaurant_created ON reviews(restaurant_id, created_at DESC);
CREATE INDEX idx_reviews_author ON reviews(author_id);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_email ON invites(email);

-- Recreate trigger
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Recreate RLS policies (these are correct as they were)

-- Users policies
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage everything" ON users;

CREATE POLICY "Users can view profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Reviews policies
DROP POLICY IF EXISTS "Users can view network reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can manage reviews" ON reviews;

CREATE POLICY "Users can view network reviews" ON reviews
    FOR SELECT USING (
        visibility = 'public' OR 
        author_id = auth.uid() OR
        auth.uid() IS NOT NULL  -- For MVP, all authenticated users are in network
    );

CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE USING (auth.uid() = author_id);

-- Review photos policies
DROP POLICY IF EXISTS "Users can view review photos" ON review_photos;
DROP POLICY IF EXISTS "Users can manage own review photos" ON review_photos;

CREATE POLICY "Users can view review photos" ON review_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reviews r 
            WHERE r.id = review_id 
            AND (r.visibility = 'public' OR r.author_id = auth.uid() OR auth.uid() IS NOT NULL)
        )
    );

CREATE POLICY "Users can manage own review photos" ON review_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM reviews r 
            WHERE r.id = review_id 
            AND r.author_id = auth.uid()
        )
    );

-- Invites policies
DROP POLICY IF EXISTS "Users can view own invites" ON invites;
DROP POLICY IF EXISTS "Users can create invites" ON invites;
DROP POLICY IF EXISTS "Users can update own invites" ON invites;

CREATE POLICY "Users can view own invites" ON invites
    FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Users can create invites" ON invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update own invites" ON invites
    FOR UPDATE USING (auth.uid() = inviter_id);

-- Reports policies
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;

CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (reporter_id = auth.uid());

-- Admin policies (these override the above)
CREATE POLICY "Admins can manage everything users" ON users
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage reviews" ON reviews
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can manage reports" ON reports
    FOR ALL USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');