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
  followers_count: number | null;
  following_count: number | null;
}

interface FollowStatus {
  isFollowing: boolean;
  hasPendingRequest: boolean;
  isFollower: boolean;
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
    
    // Fetch target user's basic profile including follow counts
    const { data: profile, error: profileError } = await serviceSupabase
      .from('users')
      .select('id, name, full_name, email, avatar_url, favorite_restaurants, created_at, followers_count, following_count')
      .eq('id', id)
      .single();

    if (profileError || !profile) {
      console.error('Public profile not found for id:', id, 'error:', profileError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Type assertion to ensure profile has the correct shape
    const typedProfile = profile as UserProfile;

    // Load favorite restaurants (use cached aggregates)
    let favoriteRestaurants: Restaurant[] = [];
    const favoriteIds = Array.isArray(typedProfile.favorite_restaurants) ? typedProfile.favorite_restaurants : [];
    if (favoriteIds.length > 0) {
      const { data: favorites } = await serviceSupabase
        .from('restaurants')
        .select('id, name, address, city, cuisine, price_level, google_data, cached_avg_rating, cached_review_count, cached_tags')
        .in('id', favoriteIds);

      if (favorites) {
        favoriteRestaurants = favoriteIds
          .map((rid: string) => {
            const base = favorites.find((r: Record<string, unknown>) => r.id === rid) as Record<string, unknown> | undefined;
            if (!base) return null;
            const restaurant = base as unknown as Restaurant & { cached_avg_rating?: number; cached_review_count?: number };
            return {
              ...restaurant,
              // attach cached stats
              avg_rating: (restaurant.cached_avg_rating ?? 0) as number,
              review_count: (restaurant.cached_review_count ?? 0) as number,
            };
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

    // Get follow status between viewer and target user
    let followStatus: FollowStatus = {
      isFollowing: false,
      hasPendingRequest: false,
      isFollower: false
    };

    // Only fetch follow status if viewing someone else's profile
    if (user.id !== id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: followStatusData } = await (supabase.rpc as any)('get_follow_status', {
        target_user_id: id
      });

      if (followStatusData) {
        followStatus = followStatusData as FollowStatus;
      }
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
        // Follow system fields
        followers_count: typedProfile.followers_count || 0,
        following_count: typedProfile.following_count || 0,
        followStatus,
      }
    });
  } catch (error) {
    console.error('Public profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
