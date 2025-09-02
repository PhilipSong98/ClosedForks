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

interface Review {
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

interface UserData {
  id: string;
  name: string | null;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface ReviewLike {
  created_at: string;
  reviews: Review;
}

// GET /api/users/liked-reviews - Get user's liked reviews
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's liked reviews with restaurant data and review author data
    // Join review_likes -> reviews -> restaurants
    // Order by when the user liked the review (most recent likes first)
    const { data: likedReviews, error: reviewsError } = await supabase
      .from('review_likes')
      .select(`
        created_at,
        reviews!inner(
          *,
          restaurants(
            id,
            name,
            address,
            city,
            cuisine,
            google_data,
            google_place_id,
            google_maps_url,
            lat,
            lng,
            price_level
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) as { data: ReviewLike[] | null; error: unknown };

    if (reviewsError) {
      console.error('Error fetching liked reviews:', reviewsError);
      return NextResponse.json(
        { error: 'Failed to fetch liked reviews' },
        { status: 500 }
      );
    }

    // Get author data for all the reviews
    const reviewIds = (likedReviews || []).map(item => item.reviews.author_id);
    const uniqueAuthorIds = [...new Set(reviewIds)];

    const { data: authorsData, error: authorsError } = await supabase
      .from('users')
      .select('id, name, full_name, email, avatar_url')
      .in('id', uniqueAuthorIds) as { data: UserData[] | null; error: unknown };

    if (authorsError) {
      console.error('Error fetching authors data:', authorsError);
    }

    // Create a map for quick author lookup
    const authorsMap = new Map<string, UserData>();
    (authorsData || []).forEach((author: UserData) => {
      authorsMap.set(author.id, author);
    });

    // Format reviews with author data and add liked date
    const formattedReviews = (likedReviews || []).map((item: ReviewLike) => {
      const review = item.reviews;
      const author = authorsMap.get(review.author_id);
      
      return {
        ...review,
        restaurant: review.restaurants,
        author: author ? {
          id: author.id,
          name: author.name || author.full_name || author.email || 'Unknown User',
          full_name: author.full_name,
          email: author.email,
          avatar_url: author.avatar_url,
        } : null,
        // Mark as liked by current user since these are their liked reviews
        isLikedByUser: true,
        // Include when they liked it for potential future use
        likedAt: item.created_at,
      };
    });

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('review_likes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error fetching liked reviews count:', countError);
    }

    return NextResponse.json({
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
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