import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define types for the database responses
interface UserProfile {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  favorite_restaurants: string[] | null;
  created_at: string;
  updated_at: string;
  followers_count: number | null;
  following_count: number | null;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string | null;
  price_level: number | null;
  google_data: Record<string, unknown> | null;
}

interface RestaurantWithStats extends Restaurant {
  avg_rating?: number;
  review_count?: number;
}

// GET /api/users/profile - Get current user's profile with stats
export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single() as { data: UserProfile | null; error: unknown };

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get review count for the user
    const { count: reviewCount, error: reviewCountError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('author_id', user.id);

    if (reviewCountError) {
      console.error('Error fetching review count:', reviewCountError);
    }

    // Get favorite restaurants data if user has favorites (use cached aggregates)
    let favoriteRestaurants: RestaurantWithStats[] = [];
    const favoriteIds = profile?.favorite_restaurants;
    
    if (favoriteIds && Array.isArray(favoriteIds) && favoriteIds.length > 0) {
      console.log('Fetching favorite restaurants for IDs:', favoriteIds);
      
      const { data: favorites, error: favoritesError } = await supabase
        .from('restaurants')
        .select('id, name, address, city, cuisine, price_level, google_data, cached_avg_rating, cached_review_count, cached_tags')
        .in('id', favoriteIds);

      if (favoritesError) {
        console.error('Error fetching favorite restaurants:', favoritesError);
      } else if (favorites) {
        // Maintain the order of favorites as stored in the user's profile and attach cached stats
        favoriteRestaurants = [];
        for (const id of favoriteIds) {
          const restaurant = favorites.find((fav: Restaurant & { cached_avg_rating?: number; cached_review_count?: number }) => fav.id === id);
          if (restaurant) {
            favoriteRestaurants.push({
              ...(restaurant as Restaurant),
              avg_rating: (restaurant as Restaurant & { cached_avg_rating?: number }).cached_avg_rating ?? 0,
              review_count: (restaurant as Restaurant & { cached_review_count?: number }).cached_review_count ?? 0,
            });
          }
        }

        console.log('Successfully fetched favorite restaurants:', favoriteRestaurants.length);
      }
    } else {
      console.log('No favorite restaurants found for user');
    }

    // Get pending follow requests count for notification badge
    const { count: pendingRequestsCount } = await supabase
      .from('follow_requests')
      .select('*', { count: 'exact', head: true })
      .eq('target_id', user.id)
      .eq('status', 'pending');

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url,
        favorite_restaurants: profile.favorite_restaurants,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        stats: {
          reviewCount: reviewCount || 0,
          favoritesCount: favoriteIds?.length || 0,
        },
        favoriteRestaurants,
        // Follow system fields
        followers_count: profile.followers_count || 0,
        following_count: profile.following_count || 0,
        pending_requests_count: pendingRequestsCount || 0,
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const { name, favorite_restaurants } = json;

    // Build update object with only provided fields
    const updateData: { name?: string; favorite_restaurants?: string[] } = {};
    if (name !== undefined) updateData.name = name;
    if (favorite_restaurants !== undefined) updateData.favorite_restaurants = favorite_restaurants;

    // Update user profile - using type assertion due to Supabase RLS type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedProfile, error: updateError } = await (supabase.from('users') as any)
      .update(updateData)
      .eq('id', user.id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
