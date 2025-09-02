import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const offset = (page - 1) * limit;

    // Use the database function for efficient restaurant retrieval with aggregations
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: restaurants, error } = await (supabase as any)
      .rpc('get_user_restaurants_with_reviews', {
        user_id_param: user.id,
        limit_param: limit,
        offset_param: offset
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as { data: any[] | null; error: unknown; };

    if (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    // Transform the data to match the Restaurant type expected by the frontend
    const processedRestaurants = (restaurants || []).map((restaurant: {
      restaurant_id: string;
      restaurant_name: string;
      restaurant_address: string;
      restaurant_city: string;
      restaurant_cuisine: string[];
      restaurant_price_level: number;
      restaurant_lat: number;
      restaurant_lng: number;
      restaurant_google_place_id: string;
      restaurant_google_maps_url: string;
      restaurant_google_data: object;
      restaurant_created_at: string;
      avg_rating: number;
      review_count: number;
      aggregated_tags: string[];
    }) => ({
      id: restaurant.restaurant_id,
      name: restaurant.restaurant_name,
      address: restaurant.restaurant_address,
      city: restaurant.restaurant_city,
      cuisine: restaurant.restaurant_cuisine,
      price_level: restaurant.restaurant_price_level,
      lat: restaurant.restaurant_lat,
      lng: restaurant.restaurant_lng,
      google_place_id: restaurant.restaurant_google_place_id,
      google_maps_url: restaurant.restaurant_google_maps_url,
      google_data: restaurant.restaurant_google_data,
      created_at: restaurant.restaurant_created_at,
      avg_rating: restaurant.avg_rating,
      review_count: restaurant.review_count,
      aggregated_tags: restaurant.aggregated_tags,
    }));

    // Calculate hasMore based on whether we got exactly the requested limit
    const hasMore = processedRestaurants.length === limit;
    
    return NextResponse.json({ 
      restaurants: processedRestaurants,
      hasMore 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}