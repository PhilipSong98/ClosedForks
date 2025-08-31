import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
      .single();

    if (profileError) {
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

    // Get favorite restaurants data if user has favorites
    let favoriteRestaurants: unknown[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const favoriteIds = (profile as any)?.favorite_restaurants;
    
    if (favoriteIds && Array.isArray(favoriteIds) && favoriteIds.length > 0) {
      console.log('Fetching favorite restaurants for IDs:', favoriteIds);
      
      const { data: favorites, error: favoritesError } = await supabase
        .from('restaurants')
        .select('id, name, address, city, cuisine, price_level, google_data')
        .in('id', favoriteIds);

      if (favoritesError) {
        console.error('Error fetching favorite restaurants:', favoritesError);
      } else if (favorites) {
        // Maintain the order of favorites as stored in the user's profile
        favoriteRestaurants = favoriteIds
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((id: any) => favorites.find((fav: any) => fav.id === id))
          .filter(Boolean);
        
        console.log('Successfully fetched favorite restaurants:', favoriteRestaurants.length);
      }
    } else {
      console.log('No favorite restaurants found for user');
    }

    return NextResponse.json({
      profile: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(profile as any),
        stats: {
          reviewCount: reviewCount || 0,
          favoritesCount: favoriteIds?.length || 0,
        },
        favoriteRestaurants,
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
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (favorite_restaurants !== undefined) updateData.favorite_restaurants = favorite_restaurants;

    // Update user profile
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