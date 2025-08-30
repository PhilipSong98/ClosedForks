import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query.trim()) {
      return NextResponse.json({ restaurants: [] });
    }

    // Search restaurants that have at least one review
    // This ensures we only show restaurants with user-generated content
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select(`
        *,
        reviews!inner (
          id
        )
      `)
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%,cuisine.cs.{${query}}`)
      .order('avg_rating', { ascending: false, nullsLast: true })
      .limit(limit);

    if (error) {
      console.error('Error searching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to search restaurants' },
        { status: 500 }
      );
    }

    // Remove duplicate restaurants (from inner join) and format response
    const uniqueRestaurants = restaurants?.reduce((acc, restaurant) => {
      if (!acc.find(r => r.id === restaurant.id)) {
        // Remove the reviews array since we only used it for filtering
        const { reviews, ...restaurantData } = restaurant;
        acc.push(restaurantData);
      }
      return acc;
    }, [] as any[]) || [];

    return NextResponse.json({ restaurants: uniqueRestaurants });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}