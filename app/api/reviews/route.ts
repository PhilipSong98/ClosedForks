import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validations';

// Define types for the optimized database responses
interface OptimizedReviewResponse {
  review_id: string;
  restaurant_id: string;
  author_id: string;
  rating_overall: number;
  dish: string;
  review_text: string;
  recommend: boolean;
  tips: string | null;
  tags: string[];
  visit_date: string;
  price_per_person: number | null;
  created_at: string;
  updated_at: string;
  like_count: number;
  group_id: string;
  
  // Denormalized author data
  author_name: string;
  author_full_name: string | null;
  author_email: string;
  author_avatar_url: string | null;
  
  // Denormalized restaurant data
  restaurant_name: string;
  restaurant_city: string;
  restaurant_address: string;
  restaurant_price_level: number | null;
  restaurant_cuisine: string[];
  restaurant_google_place_id: string | null;
  restaurant_google_maps_url: string | null;
  restaurant_google_data: object | null;
  restaurant_lat: number | null;
  restaurant_lng: number | null;
  
  // Pre-calculated restaurant stats
  restaurant_avg_rating: number;
  restaurant_review_count: number;
  
  // User-specific data
  is_liked_by_user: boolean;
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
    
    const restaurantId = searchParams.get('restaurant_id');
    const groupId = searchParams.get('group_id');
    const _page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    
    // Support keyset pagination (cursor-based) for better performance
    const cursorCreatedAt = searchParams.get('cursor_created_at');
    const cursorId = searchParams.get('cursor_id');
    
    // Fallback to offset pagination if no cursor provided (for backward compatibility)
    // const offset = cursorCreatedAt ? 0 : (page - 1) * limit; // Not used with optimized functions

    let reviews: OptimizedReviewResponse[] = [];
    let error: unknown = null;

    if (groupId) {
      // Optimized group reviews with keyset pagination and optional restaurant filter
      const { data, error: groupReviewsError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: OptimizedReviewResponse[] | null; error: unknown }> })
        .rpc('get_group_reviews_optimized', {
          group_id_param: groupId,
          user_id_param: user.id,
          cursor_created_at: cursorCreatedAt || null,
          cursor_id: cursorId || null,
          limit_param: limit,
          restaurant_id_filter: restaurantId || null,
        });
      reviews = data || [];
      error = groupReviewsError;
    } else {
      // Optimized main feed with keyset pagination and optional restaurant filter
      const { data, error: optimizedError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: OptimizedReviewResponse[] | null; error: unknown }> })
        .rpc('get_user_feed_optimized', {
          user_id_param: user.id,
          cursor_created_at: cursorCreatedAt || null,
          cursor_id: cursorId || null,
          limit_param: limit,
          restaurant_id_filter: restaurantId || null,
        });
      reviews = data || [];
      error = optimizedError;
    }

    // Filter by restaurant if specified
    if (restaurantId && reviews) {
      reviews = reviews.filter(review => review.restaurant_id === restaurantId);
    }

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Process the reviews - optimized functions return complete data
    const processedReviews: Record<string, unknown>[] = reviews.map((review: OptimizedReviewResponse) => ({
        id: review.review_id,
        restaurant_id: review.restaurant_id,
        author_id: review.author_id,
        rating_overall: review.rating_overall,
        dish: review.dish,
        review: review.review_text,
        recommend: review.recommend,
        tips: review.tips,
        tags: review.tags || [],
        visit_date: review.visit_date,
        price_per_person: review.price_per_person,
        visibility: 'my_circles',
        created_at: review.created_at,
        updated_at: review.updated_at,
        like_count: review.like_count,
        group_id: review.group_id,
        isLikedByUser: review.is_liked_by_user,
        // Denormalized data already included - no additional queries needed!
        author: {
          id: review.author_id,
          name: review.author_name,
          full_name: review.author_full_name,
          email: review.author_email,
          avatar_url: review.author_avatar_url
        },
        restaurant: {
          id: review.restaurant_id,
          name: review.restaurant_name,
          address: review.restaurant_address,
          city: review.restaurant_city,
          cuisine: review.restaurant_cuisine,
          price_level: review.restaurant_price_level,
          lat: review.restaurant_lat,
          lng: review.restaurant_lng,
          google_place_id: review.restaurant_google_place_id,
          google_maps_url: review.restaurant_google_maps_url,
          google_data: review.restaurant_google_data,
          // Pre-calculated stats - no expensive recalculation needed!
          avg_rating: review.restaurant_avg_rating,
          review_count: review.restaurant_review_count
        }
      }));

    // For keyset pagination, hasMore is determined by whether we got exactly the requested limit
    // For offset pagination (legacy), use the same logic
    const hasMore = processedReviews.length === limit;
    
    // Add cursor information for next page (keyset pagination)
    let nextCursor = null;
    if (hasMore && processedReviews.length > 0) {
      const lastReview = processedReviews[processedReviews.length - 1];
      nextCursor = {
        created_at: lastReview.created_at,
        id: lastReview.id
      };
    }
    
    return NextResponse.json({ 
      reviews: processedReviews,
      hasMore,
      nextCursor, // For keyset pagination
      // Include performance metadata for monitoring
      _meta: {
        optimized: !groupId, // True when using the optimized function
        queriesUsed: groupId ? '4+' : '1', // Highlight the performance difference
        paginationType: cursorCreatedAt ? 'keyset' : 'offset'
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

export async function POST(request: NextRequest) {
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
    const validatedData = reviewSchema.parse(json);
    
    let restaurantId: string;

    // Handle restaurant creation if restaurant_data is provided
    if (json.restaurant_data && !validatedData.restaurant_id) {
      // Create restaurant using the find-or-create logic
      const findOrCreateResponse = await fetch(new URL('/api/restaurants/find-or-create', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify(json.restaurant_data),
      });

      if (!findOrCreateResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to create restaurant' },
          { status: 500 }
        );
      }

      const { restaurant } = await findOrCreateResponse.json();
      restaurantId = restaurant.id;
    } else if (validatedData.restaurant_id) {
      // Verify existing restaurant exists
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', validatedData.restaurant_id)
        .single();

      if (!restaurant) {
        return NextResponse.json(
          { error: 'Restaurant not found' },
          { status: 404 }
        );
      }
      restaurantId = validatedData.restaurant_id;
    } else {
      return NextResponse.json(
        { error: 'Either restaurant_id or restaurant_data must be provided' },
        { status: 400 }
      );
    }

    // Get user's primary group (first joined group) for the review
    const { data: userGroup, error: groupError } = await supabase
      .from('user_groups')
      .select('group_id')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .single() as { data: { group_id: string } | null; error: unknown; };

    if (groupError || !userGroup) {
      return NextResponse.json(
        { error: 'You must be a member of a group to create reviews' },
        { status: 403 }
      );
    }

    // Check if user already reviewed this restaurant in any of their groups
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('author_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this restaurant' },
        { status: 409 }
      );
    }

    const reviewData = {
      restaurant_id: restaurantId, // Use the determined restaurant ID
      rating_overall: validatedData.rating_overall,
      // Temporary fallback values for database constraints until migration is applied
      dish: validatedData.dish || 'Quick review',
      review: validatedData.review || 'Quick review - minimal input',
      recommend: validatedData.recommend,
      tips: validatedData.tips,
      tags: validatedData.tags,
      visit_date: validatedData.visit_date,
      author_id: user.id,
      group_id: userGroup.group_id,
    };
    
    // Insert review - bypassing TypeScript strict checking due to RLS policy type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: review, error } = await (supabase.from('reviews') as any)
      .insert(reviewData)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating review:', error);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
