import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string[] | null;
  price_level: number | null;
  google_data: Record<string, unknown> | null;
}

interface UserProfile {
  id: string;
  name: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  favorite_restaurants: string[] | null;
  created_at: string | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Require authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use service client for profile queries to bypass RLS restrictions
    // This is safe since we've already verified the user is authenticated
    const serviceSupabase = createServiceClient();
    
    // Fetch target user's basic profile
    const { data: profile, error: profileError } = await serviceSupabase
      .from('users')
      .select('id, name, full_name, email, avatar_url, favorite_restaurants, created_at')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      console.error('Public profile not found for id:', id, 'error:', profileError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Type assertion to ensure profile has the correct shape
    const typedProfile = profile as UserProfile;

    // Load favorite restaurants
    let favoriteRestaurants: Restaurant[] = [];
    const favoriteIds = Array.isArray(typedProfile.favorite_restaurants) ? typedProfile.favorite_restaurants : [];
    if (favoriteIds.length > 0) {
      const { data: favorites } = await serviceSupabase
        .from('restaurants')
        .select('id, name, address, city, cuisine, price_level, google_data')
        .in('id', favoriteIds);

      // Attach stats to favorites
      const { data: favReviews } = await serviceSupabase
        .from('reviews')
        .select('restaurant_id, rating_overall')
        .in('restaurant_id', favoriteIds);

      const statsMap = new Map<string, { avg_rating: number; review_count: number }>();
      if (favReviews) {
        const bucket: Record<string, number[]> = {};
        for (const r of favReviews as { restaurant_id: string; rating_overall: number }[]) {
          if (!bucket[r.restaurant_id]) bucket[r.restaurant_id] = [];
          if (typeof r.rating_overall === 'number') bucket[r.restaurant_id].push(r.rating_overall);
        }
        Object.entries(bucket).forEach(([rid, ratings]) => {
          const count = ratings.length;
          const avg = count > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
          statsMap.set(rid, { avg_rating: avg, review_count: count });
        });
      }

      if (favorites) {
        favoriteRestaurants = favoriteIds
          .map((rid: string) => {
            const base = favorites.find((r: Restaurant) => r.id === rid);
            if (!base) return null;
            const stats = statsMap.get(rid);
            const restaurant = base as Restaurant;
            return stats ? { ...restaurant, avg_rating: stats.avg_rating, review_count: stats.review_count } : restaurant;
          })
          .filter(Boolean) as Restaurant[];
      }
    }

    // Compute visible review count for viewer (only shared group reviews)
    // Get viewer's group ids
    const { data: viewerGroups } = await serviceSupabase
      .from('user_groups')
      .select('group_id')
      .eq('user_id', user.id);
    const viewerGroupIds = (viewerGroups || []).map((g: { group_id: string }) => g.group_id);

    let reviewCount = 0;
    if (viewerGroupIds.length > 0) {
      const { count } = await serviceSupabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', id)
        .in('group_id', viewerGroupIds);
      reviewCount = count || 0;
    }

    return NextResponse.json({
      profile: {
        id: typedProfile.id,
        name: typedProfile.name,
        full_name: typedProfile.full_name,
        email: typedProfile.email,
        avatar_url: typedProfile.avatar_url,
        created_at: typedProfile.created_at,
        // updated_at not present on users; omit or mirror created_at
        updated_at: typedProfile.created_at,
        favorite_restaurants: typedProfile.favorite_restaurants,
        favoriteRestaurants,
        stats: {
          reviewCount,
          favoritesCount: favoriteIds.length,
        },
      }
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
