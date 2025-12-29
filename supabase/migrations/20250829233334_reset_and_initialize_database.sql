-- Reset and Initialize Database - Clean Slate Migration
-- This migration drops everything and recreates the complete, working schema
-- Incorporates all authentication fixes discovered during development

-- ============================================================================
-- CLEAN SLATE: Drop all existing objects
-- ============================================================================

-- Drop all tables (CASCADE removes dependent objects)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS review_photos CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS invite_status CASCADE;
DROP TYPE IF EXISTS report_status CASCADE;
DROP TYPE IF EXISTS visibility_type CASCADE;
DROP TYPE IF EXISTS restaurant_source CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_restaurant_with_avg(UUID, UUID) CASCADE;

-- ============================================================================
-- EXTENSIONS & TYPES
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE visibility_type AS ENUM ('my_circles', 'public');
CREATE TYPE restaurant_source AS ENUM ('manual', 'maps');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table - FIXED: Now properly references auth.users for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    home_city TEXT,
    role user_role DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restaurants table
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    cuisine TEXT[] NOT NULL DEFAULT '{}',
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
    website_url TEXT,
    booking_url TEXT,
    phone TEXT,
    place_id TEXT,
    source restaurant_source DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, city, address)
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, author_id) -- Prevent duplicate reviews
);

-- Invites table
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    email TEXT,
    status invite_status DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review photos table
CREATE TABLE review_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL
);

-- Reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_restaurants_city_name ON restaurants(city, name);
CREATE INDEX idx_restaurants_geo ON restaurants USING GIST(ST_Point(lng, lat));
CREATE INDEX idx_reviews_restaurant_created ON reviews(restaurant_id, created_at DESC);
CREATE INDEX idx_reviews_author ON reviews(author_id);
CREATE INDEX idx_reviews_unique_per_user ON reviews(restaurant_id, author_id);
CREATE INDEX idx_invites_code ON invites(code);
CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_review_photos_review ON review_photos(review_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to reviews table
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RPC function to get restaurant with average rating for a specific viewer
CREATE OR REPLACE FUNCTION get_restaurant_with_avg(restaurant_id UUID, viewer_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    address TEXT,
    city TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    cuisine TEXT[],
    price_level INTEGER,
    website_url TEXT,
    booking_url TEXT,
    phone TEXT,
    place_id TEXT,
    source restaurant_source,
    created_at TIMESTAMPTZ,
    avg_rating DOUBLE PRECISION,
    review_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.name,
        r.address,
        r.city,
        r.lat,
        r.lng,
        r.cuisine,
        r.price_level,
        r.website_url,
        r.booking_url,
        r.phone,
        r.place_id,
        r.source,
        r.created_at,
        COALESCE(AVG(rv.rating_overall), 0)::DOUBLE PRECISION as avg_rating,
        COUNT(rv.id)::INTEGER as review_count
    FROM restaurants r
    LEFT JOIN reviews rv ON rv.restaurant_id = r.id 
        AND (rv.visibility = 'public' OR rv.author_id = viewer_id)
    WHERE r.id = restaurant_id
    GROUP BY r.id, r.name, r.address, r.city, r.lat, r.lng, r.cuisine, 
             r.price_level, r.website_url, r.booking_url, r.phone, 
             r.place_id, r.source, r.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - SAFE & NON-RECURSIVE
-- ============================================================================

-- Users policies (FIXED: No more infinite recursion)
CREATE POLICY "Authenticated users can view all profiles" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON users
    FOR DELETE USING (auth.uid() = id);

-- Restaurant policies
CREATE POLICY "Anyone can view restaurants" ON restaurants
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add restaurants" ON restaurants
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update restaurants" ON restaurants
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete restaurants" ON restaurants
    FOR DELETE USING (auth.role() = 'authenticated');

-- Review policies (network-based visibility)
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

-- Invite policies
CREATE POLICY "Users can view own invites" ON invites
    FOR SELECT USING (inviter_id = auth.uid());

CREATE POLICY "Users can create invites" ON invites
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can update own invites" ON invites
    FOR UPDATE USING (auth.uid() = inviter_id);

CREATE POLICY "Users can delete own invites" ON invites
    FOR DELETE USING (auth.uid() = inviter_id);

-- Review photos policies
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

-- Report policies
CREATE POLICY "Users can create reports" ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports" ON reports
    FOR SELECT USING (reporter_id = auth.uid());

CREATE POLICY "Users can update own reports" ON reports
    FOR UPDATE USING (reporter_id = auth.uid());

-- ============================================================================
-- COMMENTS & DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User profiles that properly reference auth.users for authentication. RLS policies prevent infinite recursion.';
COMMENT ON TABLE restaurants IS 'Restaurant information with location data and cuisine categorization.';
COMMENT ON TABLE reviews IS 'Multi-dimensional restaurant reviews with network-based visibility.';
COMMENT ON TABLE invites IS 'Invitation system for private network access with expiring codes.';
COMMENT ON TABLE review_photos IS 'Photo attachments for reviews with metadata.';
COMMENT ON TABLE reports IS 'Content moderation system for inappropriate reviews.';

-- Note: Admin functionality handled at application level to prevent RLS recursion
-- This migration represents the clean, working state after resolving all authentication issues

-- ============================================================================
-- MIGRATION SUMMARY
-- ============================================================================
-- This migration creates a complete, clean database schema that:
--  Fixes users table authentication (references auth.users properly)
--  Eliminates RLS policy infinite recursion 
--  Allows proper profile creation for authenticated users
--  Supports full application functionality
--  Maintains security with safe RLS policies
--  Includes all necessary indexes and constraints