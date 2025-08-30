import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reviewSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reviews, error } = await query as { data: any[] | null; error: Error | null };

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

    // Transform the data to match expected format with manually joined user data
    const formattedReviews = reviewsWithUsers.map(review => ({
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