import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validations';

// Define types for the database responses

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let reviews;
    let error;

    if (groupId) {
      // Use the security function for group-specific reviews
      const { data, error: groupReviewsError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }> })
        .rpc('get_group_reviews', {
          group_id_param: groupId,
          user_id_param: user.id,
          limit_param: limit,
          offset_param: offset
        });
      
      reviews = data;
      error = groupReviewsError;
    } else {
      // Use the security function for all user-visible reviews
      const { data, error: visibleReviewsError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }> })
        .rpc('get_user_visible_reviews', {
          user_id_param: user.id,
          limit_param: limit,
          offset_param: offset
        });
      
      reviews = data;
      error = visibleReviewsError;
    }

    // Filter by restaurant if specified
    if (restaurantId && reviews) {
      reviews = (reviews as Record<string, unknown>[]).filter((review: Record<string, unknown>) => (review.restaurant_id as string) === restaurantId);
    }

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Process the reviews from the security functions
    let processedReviews = reviews || [];
    
    if (processedReviews.length > 0) {
      // Fetch user data for authors
      const authorIds = processedReviews.map((review: Record<string, unknown>) => review.author_id as string);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, full_name, email, avatar_url')
        .in('id', authorIds);

      // Fetch restaurant data
      const restaurantIds = processedReviews.map((review: Record<string, unknown>) => review.restaurant_id as string);
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, address, city, cuisine, price_level, google_data, google_place_id, google_maps_url, lat, lng')
        .in('id', restaurantIds);

      // Get user's like status for each review
      const reviewIds = processedReviews.map((review: Record<string, unknown>) => review.review_id as string);
      const { data: userLikes } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', user.id)
        .in('review_id', reviewIds);

      if (!usersError && !restaurantsError && users && restaurants) {
        // Build review stats for these restaurants so RestaurantCard can show avg + count
        const statsMap = new Map<string, { avg_rating: number; review_count: number }>();
        if (restaurantIds.length > 0) {
          const { data: restReviews } = await supabase
            .from('reviews')
            .select('restaurant_id, rating_overall')
            .in('restaurant_id', restaurantIds);
          if (restReviews) {
            const bucket: Record<string, number[]> = {};
            for (const row of restReviews as { restaurant_id: string; rating_overall: number }[]) {
              if (!bucket[row.restaurant_id]) bucket[row.restaurant_id] = [];
              if (typeof row.rating_overall === 'number') bucket[row.restaurant_id].push(row.rating_overall);
            }
            Object.entries(bucket).forEach(([rid, ratings]) => {
              const count = ratings.length;
              const avg = count > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / count) * 10) / 10 : 0;
              statsMap.set(rid, { avg_rating: avg, review_count: count });
            });
          }
        }

        const likedReviewIds = new Set((userLikes || []).map((like: { review_id: string }) => like.review_id));
        
        // Transform the data to match expected format
        processedReviews = processedReviews.map((review: Record<string, unknown>) => ({
          id: review.review_id,
          restaurant_id: review.restaurant_id,
          author_id: review.author_id,
          rating_overall: review.rating_overall,
          dish: review.dish,
          review: review.review_text,
          recommend: review.recommend,
          tips: review.tips,
          tags: review.tags,
          visit_date: review.visit_date,
          price_per_person: review.price_per_person,
          visibility: review.visibility,
          created_at: review.created_at,
          updated_at: review.updated_at,
          like_count: review.like_count || 0,
          group_id: review.group_id,
          isLikedByUser: likedReviewIds.has(review.review_id as string),
          // Add joined data
          author: users.find((u: { id: string }) => u.id === (review.author_id as string)),
          restaurant: (() => {
            const base = restaurants.find((r: { id: string }) => r.id === (review.restaurant_id as string));
            if (!base) return undefined;
            const stats = statsMap.get(review.restaurant_id as string);
            return stats ? { ...(base as Record<string, unknown>), avg_rating: stats.avg_rating, review_count: stats.review_count } : base;
          })()
        }));
      }
    }

    // Calculate hasMore based on whether we got exactly the requested limit
    const hasMore = processedReviews.length === limit;
    
    return NextResponse.json({ 
      reviews: processedReviews,
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

    // Check if restaurant exists
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
      .eq('restaurant_id', validatedData.restaurant_id)
      .eq('author_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this restaurant' },
        { status: 409 }
      );
    }

    const reviewData = {
      ...validatedData,
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
