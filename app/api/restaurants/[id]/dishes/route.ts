import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DishAggregate {
  dish_name: string;
  avg_rating: number;
  rating_count: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: restaurantId } = await params;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate restaurant ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(restaurantId)) {
      return NextResponse.json(
        { error: 'Invalid restaurant ID format' },
        { status: 400 }
      );
    }

    // Verify restaurant exists
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id, name')
      .eq('id', restaurantId)
      .single() as { data: { id: string; name: string } | null; error: unknown };

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Get all dish aggregates for this restaurant
    const { data: dishes, error: dishesError } = await supabase
      .from('restaurant_dish_aggregates')
      .select('dish_name, avg_rating, rating_count')
      .eq('restaurant_id', restaurantId)
      .order('rating_count', { ascending: false })
      .limit(50); // Limit to top 50 dishes

    if (dishesError) {
      // Table might not exist yet, return empty array
      if (dishesError.code === '42P01') {
        return NextResponse.json({
          restaurant_id: restaurantId,
          restaurant_name: restaurant.name,
          dishes: [],
          count: 0,
        });
      }

      console.error('Error fetching restaurant dishes:', dishesError);
      return NextResponse.json(
        { error: 'Failed to fetch dishes' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      restaurant_id: restaurantId,
      restaurant_name: restaurant.name,
      dishes: (dishes || []) as DishAggregate[],
      count: (dishes || []).length,
    });
  } catch (error) {
    console.error('Unexpected error fetching restaurant dishes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
