import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define types for the database responses
interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  cuisine: string | null;
  price_level: number | null;
  google_data: Record<string, unknown> | null;
  created_at: string;
}

interface ToEatListItem {
  created_at: string;
  restaurant_id: string;
  restaurants: Restaurant;
}

// GET /api/users/to-eat-list - Get current user's to-eat list with restaurant details
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

    // Get user's to-eat list with restaurant details (without computed fields)
    const { data: toEatList, error: toEatError } = await supabase
      .from('to_eat_list')
      .select(`
        created_at,
        restaurant_id,
        restaurants (
          id,
          name,
          address,
          city,
          cuisine,
          price_level,
          google_data,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (toEatError) {
      console.error('Error fetching to-eat list:', toEatError);
      return NextResponse.json(
        { error: 'Failed to fetch to-eat list' },
        { status: 500 }
      );
    }

    if (!toEatList || toEatList.length === 0) {
      return NextResponse.json({
        restaurants: [],
        count: 0,
      });
    }

    // Get restaurant IDs to fetch reviews for
    const restaurantIds = toEatList.map((item: ToEatListItem) => item.restaurant_id);

    // Fetch all reviews for these restaurants
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, restaurant_id, rating_overall, tags')
      .in('restaurant_id', restaurantIds);

    if (reviewsError) {
      console.error('Error fetching reviews for restaurants:', reviewsError);
      // Continue without review data rather than failing
    }

    // Define review interface for type safety
    interface ReviewData {
      id: string;
      restaurant_id: string;
      rating_overall: number;
      tags: string[] | null;
    }

    // Group reviews by restaurant_id
    const reviewsByRestaurant = (reviews || []).reduce((acc: Record<string, ReviewData[]>, review: ReviewData) => {
      const restaurantId = review.restaurant_id;
      if (!acc[restaurantId]) {
        acc[restaurantId] = [];
      }
      acc[restaurantId].push(review);
      return acc;
    }, {} as Record<string, ReviewData[]>);

    // Transform the data and compute avg_rating, review_count, and aggregated_tags
    const restaurants = (toEatList || []).map((item: ToEatListItem) => {
      const restaurant = item.restaurants;
      const restaurantReviews = reviewsByRestaurant[restaurant.id] || [];
      
      // Calculate average rating
      const ratings = restaurantReviews
        .map((r: ReviewData) => r.rating_overall)
        .filter((r: number | undefined) => r != null) as number[];
      const avg_rating = ratings.length > 0 
        ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10
        : 0;
      
      // Aggregate unique tags from all reviews
      const allTags = restaurantReviews
        .flatMap((r: ReviewData) => r.tags || [])
        .filter((tag: string, index: number, arr: string[]) => arr.indexOf(tag) === index);

      return {
        ...restaurant,
        avg_rating,
        review_count: restaurantReviews.length,
        aggregated_tags: allTags,
        savedAt: item.created_at,
      };
    });

    return NextResponse.json({
      restaurants,
      count: restaurants.length,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/users/to-eat-list - Add restaurant to user's to-eat list
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
    const { restaurant_id } = json;

    if (!restaurant_id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Check if restaurant exists
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurant_id)
      .single() as { data: { id: string; name: string } | null; error: unknown };

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Add to to-eat list (will fail if already exists due to primary key constraint)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase.from('to_eat_list') as any)
      .insert({
        user_id: user.id,
        restaurant_id: restaurant_id,
      });

    if (insertError) {
      if (insertError.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Restaurant is already in your to-eat list' },
          { status: 409 }
        );
      }
      console.error('Error adding to to-eat list:', insertError);
      return NextResponse.json(
        { error: 'Failed to add restaurant to to-eat list' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `${restaurant.name} added to your to-eat list`,
      restaurant_id,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/to-eat-list - Remove restaurant from user's to-eat list
export async function DELETE(request: NextRequest) {
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
    const { restaurant_id } = json;

    if (!restaurant_id) {
      return NextResponse.json(
        { error: 'Restaurant ID is required' },
        { status: 400 }
      );
    }

    // Remove from to-eat list
    const { error: deleteError } = await supabase
      .from('to_eat_list')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurant_id);

    if (deleteError) {
      console.error('Error removing from to-eat list:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove restaurant from to-eat list' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Restaurant removed from your to-eat list',
      restaurant_id,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}