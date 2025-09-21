import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define the type for restaurant feed data
interface RestaurantFeedItem {
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
  restaurant_google_data: Record<string, unknown>;
  restaurant_created_at: string;
  avg_rating: number;
  review_count: number;
  aggregated_tags: string[];
}

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
    
    // const page = parseInt(searchParams.get('page') || '1'); // Not used in cursor-based pagination
    const limit = parseInt(searchParams.get('limit') || '15');
    const cursorReviewCount = searchParams.get('cursor_review_count');
    const cursorCreatedAt = searchParams.get('cursor_created_at');
    const cursorId = searchParams.get('cursor_id');

    // Use the database function for efficient restaurant retrieval with aggregations
    // Type-safe RPC call for restaurant feed
    const { data: restaurants, error } = await (supabase as unknown as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: unknown[] | null; error: unknown }>
    }).rpc('get_restaurants_feed_optimized', {
      user_id_param: user.id,
      cursor_review_count: cursorReviewCount ? Number(cursorReviewCount) : null,
      cursor_created_at: cursorCreatedAt || null,
      cursor_id: cursorId || null,
      limit_param: limit
    }) as { data: unknown[] | null; error: unknown };

    if (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    // Transform the data to match the Restaurant type expected by the frontend
    const processedRestaurants = (restaurants as RestaurantFeedItem[] || []).map((restaurant: RestaurantFeedItem) => ({
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
    const nextCursor = hasMore && processedRestaurants.length > 0
      ? {
          review_count: processedRestaurants[processedRestaurants.length - 1].review_count,
          created_at: processedRestaurants[processedRestaurants.length - 1].created_at,
          id: processedRestaurants[processedRestaurants.length - 1].id,
        }
      : null;
    
    return NextResponse.json({ 
      restaurants: processedRestaurants,
      hasMore,
      nextCursor
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
