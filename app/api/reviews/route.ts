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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    
    // Support keyset pagination (cursor-based) for better performance
    const cursorCreatedAt = searchParams.get('cursor_created_at');
    const cursorId = searchParams.get('cursor_id');
    
    // Fallback to offset pagination if no cursor provided (for backward compatibility)
    const offset = cursorCreatedAt ? 0 : (page - 1) * limit;

    let reviews: OptimizedReviewResponse[] = [];
    let error: unknown = null;

    if (groupId) {
      // Use the existing security function for group-specific reviews
      // TODO: Create optimized version for group reviews in future migration
      const { data, error: groupReviewsError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: Record<string, unknown>[] | null; error: unknown }> })
        .rpc('get_group_reviews', {
          group_id_param: groupId,
          user_id_param: user.id,
          limit_param: limit,
          offset_param: offset
        });
      
      // Transform the old format to match our expected structure
      reviews = (data || []).map((review: Record<string, unknown>) => ({
        review_id: review.review_id as string,
        restaurant_id: review.restaurant_id as string,
        author_id: review.author_id as string,
        rating_overall: review.rating_overall as number,
        dish: review.dish as string,
        review_text: review.review_text as string,
        recommend: review.recommend as boolean,
        tips: review.tips as string | null,
        tags: (review.tags as string[]) || [],
        visit_date: review.visit_date as string,
        price_per_person: review.price_per_person as number | null,
        created_at: review.created_at as string,
        updated_at: review.updated_at as string,
        like_count: (review.like_count as number) || 0,
        group_id: review.group_id as string,
        // These will be filled by the legacy processing below
        author_name: '',
        author_full_name: null,
        author_email: '',
        author_avatar_url: null,
        restaurant_name: '',
        restaurant_city: '',
        restaurant_address: '',
        restaurant_price_level: null,
        restaurant_cuisine: [],
        restaurant_google_place_id: null,
        restaurant_google_maps_url: null,
        restaurant_google_data: null,
        restaurant_lat: null,
        restaurant_lng: null,
        restaurant_avg_rating: 0,
        restaurant_review_count: 0,
        is_liked_by_user: false
      }));
      error = groupReviewsError;
    } else {
      // Use the NEW optimized function for the main feed (eliminates N+1 queries)
      const { data, error: optimizedError } = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: OptimizedReviewResponse[] | null; error: unknown }> })
        .rpc('get_user_feed_optimized', {
          user_id_param: user.id,
          cursor_created_at: cursorCreatedAt || null,
          cursor_id: cursorId || null,
          limit_param: limit
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

    // Process the reviews - optimized function returns complete data, no additional queries needed!
    let processedReviews: Record<string, unknown>[] = [];
    
    if (groupId && reviews.length > 0) {
      // LEGACY PATH: Group reviews still need additional processing (N+1 queries)
      // This maintains backward compatibility while group-optimized function is being developed
      
      // Fetch user data for authors
      const authorIds = reviews.map(review => review.author_id);
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, full_name, email, avatar_url')
        .in('id', authorIds);

      // Fetch restaurant data
      const restaurantIds = reviews.map(review => review.restaurant_id);
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, name, address, city, cuisine, price_level, google_data, google_place_id, google_maps_url, lat, lng')
        .in('id', restaurantIds);

      // Get user's like status for each review
      const reviewIds = reviews.map(review => review.review_id);
      const { data: userLikes } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', user.id)
        .in('review_id', reviewIds);

      if (!usersError && !restaurantsError && users && restaurants) {
        // Build review stats for these restaurants
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
        
        // Transform legacy format to expected format
        processedReviews = reviews.map((review) => ({
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
          visibility: 'my_circles', // Default for group reviews
          created_at: review.created_at,
          updated_at: review.updated_at,
          like_count: review.like_count || 0,
          group_id: review.group_id,
          isLikedByUser: likedReviewIds.has(review.review_id),
          // Add joined data
          author: users.find((u: { id: string }) => u.id === review.author_id),
          restaurant: (() => {
            const base = restaurants.find((r: { id: string }) => r.id === review.restaurant_id);
            if (!base) return undefined;
            const stats = statsMap.get(review.restaurant_id);
            return stats ? { ...(base as Record<string, unknown>), avg_rating: stats.avg_rating, review_count: stats.review_count } : base;
          })()
        }));
      }
    } else {
      // OPTIMIZED PATH: Main feed uses new optimized function - NO additional queries needed!
      // This eliminates the N+1 query problem completely
      processedReviews = reviews.map((review: OptimizedReviewResponse) => ({
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
        visibility: 'my_circles', // All optimized reviews are group-scoped
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
    }

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
