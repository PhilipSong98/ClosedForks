import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define types for the database responses
interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string | null;
  google_data: Record<string, unknown> | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  lat: number | null;
  lng: number | null;
  price_level: number | null;
}

interface _Review {
  id: string;
  author_id: string;
  restaurant_id: string;
  content: string;
  rating_overall: number;
  rating_food: number | null;
  rating_service: number | null;
  rating_atmosphere: number | null;
  rating_value: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  restaurants: Restaurant;
}

// Interfaces removed as they are not used in the optimized implementation
// The optimized RPC function returns denormalized data directly

// GET /api/users/liked-reviews - Get user's liked reviews
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const cursorCreatedAt = searchParams.get('cursor_created_at');
    const cursorId = searchParams.get('cursor_id');
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use optimized function with keyset pagination
    const { data: likedReviews, error: reviewsError } = await (supabase as unknown as {
      rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }>
    }).rpc('get_user_liked_reviews_optimized', {
      user_id_param: user.id,
      cursor_created_at: cursorCreatedAt || null,
      cursor_id: cursorId || null,
      limit_param: limit
    }) as { data: Record<string, unknown>[] | null; error: unknown };

    if (reviewsError) {
      console.error('Error fetching liked reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to fetch liked reviews' },
        { status: 500 }
      );
    }

    // Format reviews; optimized RPC returns denormalized author/restaurant and like_created_at
    const formattedReviews = (likedReviews || []).map((row: Record<string, unknown>) => ({
      id: row.review_id,
      restaurant_id: row.restaurant_id,
      author_id: row.author_id,
      rating_overall: row.rating_overall,
      dish: row.dish,
      review: row.review_text,
      recommend: row.recommend,
      tips: row.tips,
      tags: row.tags,
      visit_date: row.visit_date,
      price_per_person: row.price_per_person,
      created_at: row.created_at,
      updated_at: row.updated_at,
      like_count: row.like_count,
      group_id: row.group_id,
      restaurant: {
        id: row.restaurant_id,
        name: row.restaurant_name,
        address: row.restaurant_address,
        city: row.restaurant_city,
        cuisine: row.restaurant_cuisine,
        price_level: row.restaurant_price_level,
        google_place_id: row.restaurant_google_place_id,
        google_maps_url: row.restaurant_google_maps_url,
        google_data: row.restaurant_google_data,
        lat: row.restaurant_lat,
        lng: row.restaurant_lng,
        avg_rating: row.restaurant_avg_rating,
        review_count: row.restaurant_review_count,
      },
      author: {
        id: row.author_id,
        name: row.author_name || row.author_full_name || row.author_email || 'Unknown User',
        full_name: row.author_full_name,
        email: row.author_email,
        avatar_url: row.author_avatar_url,
      },
      isLikedByUser: true,
      likedAt: row.like_created_at,
    }));

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error fetching liked reviews count:', countError);
    }

    // Keyset pagination metadata
    const hasMore = (formattedReviews || []).length === limit;
    const nextCursor = hasMore && formattedReviews.length > 0
      ? {
          created_at: formattedReviews[formattedReviews.length - 1].likedAt,
          id: formattedReviews[formattedReviews.length - 1].id,
        }
      : null;

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
