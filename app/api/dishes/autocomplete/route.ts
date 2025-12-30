import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dishAutocompleteSchema } from '@/lib/validations';

interface DishSuggestion {
  dish_name: string;
  avg_rating: number;
  rating_count: number;
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

    // Validate query parameters
    const restaurantId = searchParams.get('restaurant_id');
    const query = searchParams.get('query') || '';

    const validation = dishAutocompleteSchema.safeParse({
      restaurant_id: restaurantId,
      query: query,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.issues },
        { status: 400 }
      );
    }

    // Use the optimized database function for autocomplete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('get_dish_autocomplete', {
      p_restaurant_id: validation.data.restaurant_id,
      p_query: validation.data.query,
      p_limit: 10,
    });

    if (error) {
      console.error('Error fetching dish suggestions:', error);

      // Fallback to direct query if RPC function doesn't exist yet
      if (error.message.includes('function') || error.code === '42883') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('restaurant_dish_aggregates')
          .select('dish_name, avg_rating, rating_count')
          .eq('restaurant_id', validation.data.restaurant_id)
          .ilike('dish_name_normalized', `${validation.data.query.toLowerCase()}%`)
          .order('rating_count', { ascending: false })
          .limit(10);

        if (fallbackError) {
          // Table might not exist yet, return empty suggestions
          if (fallbackError.code === '42P01') {
            return NextResponse.json({ suggestions: [] });
          }
          throw fallbackError;
        }

        return NextResponse.json({
          suggestions: (fallbackData || []) as DishSuggestion[],
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch dish suggestions' },
        { status: 500 }
      );
    }

    // If aggregates returned empty, fallback to dish_ratings table directly
    // This handles the race condition where trigger hasn't populated aggregates yet
    if (!data || data.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rawDishRatings, error: rawError } = await (supabase as any)
        .from('dish_ratings')
        .select('dish_name, dish_name_normalized, rating')
        .eq('restaurant_id', validation.data.restaurant_id)
        .ilike('dish_name_normalized', `${validation.data.query.toLowerCase()}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!rawError && rawDishRatings && rawDishRatings.length > 0) {
        // Manually aggregate the dish ratings
        const aggregatedMap = new Map<string, { dish_name: string; total: number; count: number }>();

        for (const dr of rawDishRatings) {
          const key = dr.dish_name_normalized;
          if (aggregatedMap.has(key)) {
            const existing = aggregatedMap.get(key)!;
            existing.total += Number(dr.rating);
            existing.count += 1;
          } else {
            aggregatedMap.set(key, {
              dish_name: dr.dish_name,
              total: Number(dr.rating),
              count: 1
            });
          }
        }

        const aggregatedSuggestions: DishSuggestion[] = Array.from(aggregatedMap.values())
          .map(agg => ({
            dish_name: agg.dish_name,
            avg_rating: Math.round((agg.total / agg.count) * 10) / 10,
            rating_count: agg.count
          }))
          .sort((a, b) => b.rating_count - a.rating_count)
          .slice(0, 10);

        return NextResponse.json({
          suggestions: aggregatedSuggestions,
        });
      }
    }

    return NextResponse.json({
      suggestions: (data || []) as DishSuggestion[],
    });
  } catch (error) {
    console.error('Unexpected error in dish autocomplete:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
