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
    // Use cached_review_count instead of INNER JOIN to avoid duplicate rows
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .gt('cached_review_count', 0)
      .or(`name.ilike.%${query}%,city.ilike.%${query}%,address.ilike.%${query}%,cuisine.cs.{${query}}`)
      .order('cached_avg_rating', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to search restaurants' },
        { status: 500 }
      );
    }

    return NextResponse.json({ restaurants: restaurants || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
