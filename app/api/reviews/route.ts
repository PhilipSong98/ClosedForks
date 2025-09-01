import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validations';

// Define types for the database responses
interface ReviewData {
  id: string;
  content: string;
  rating_overall: number;
  rating_food: number | null;
  rating_service: number | null;
  rating_atmosphere: number | null;
  rating_value: number | null;
  tags: string[] | null;
  author_id: string;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  isLikedByUser?: boolean;
  restaurants?: {
    id: string;
    name: string;
    address: string;
    city: string;
    cuisine: string | null;
    google_data: Record<string, unknown> | null;
  };
  author_user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface UserLike {
  review_id: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Check authentication for user-specific like data
    const { data: { user } } = await supabase.auth.getUser();
    
    const restaurantId = searchParams.get('restaurant_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('reviews')
      .select(`
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
          lng
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data: reviews, error } = await query as { data: ReviewData[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // If we have reviews, manually fetch the user data for each one
    let reviewsWithUsers = reviews || [];
    if (reviewsWithUsers.length > 0) {
      const authorIds = reviewsWithUsers.map(review => review.author_id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .in('id', authorIds) as { data: { id: string; name: string; email: string; avatar_url?: string }[] | null; error: Error | null };

      if (!usersError && users) {
        // Map user data to reviews
        reviewsWithUsers = reviewsWithUsers.map(review => ({
          ...review,
          author_user: users.find(user => user.id === review.author_id)
        }));
      }
    }

    // Get user's like status for each review if authenticated
    let reviewsWithLikes = reviewsWithUsers;
    if (user && reviewsWithUsers.length > 0) {
      const reviewIds = reviewsWithUsers.map(review => review.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: userLikes, error: likesError } = await supabase
        .from('review_likes')
        .select('review_id')
        .eq('user_id', user.id)
        .in('review_id', reviewIds) as { data: UserLike[] | null; error: Error | null };

      if (!likesError && userLikes) {
        const likedReviewIds = new Set(userLikes.map(like => like.review_id));
        reviewsWithLikes = reviewsWithUsers.map(review => ({
          ...review,
          isLikedByUser: likedReviewIds.has(review.id)
        }));
      }
    }

    // Transform the data to match expected format with manually joined user data
    const formattedReviews = reviewsWithLikes.map(review => ({
      ...review,
      restaurant: review.restaurants,  // Map joined restaurant data to expected name
      author: review.author_user,      // Map manually joined user data
    }));

    return NextResponse.json({ reviews: formattedReviews });
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

    // Check if user already reviewed this restaurant
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: review, error } = await (supabase.from('reviews') as any)
      .insert({
        ...validatedData,
        author_id: user.id,
      })
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