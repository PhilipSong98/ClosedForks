import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restaurantSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const city = searchParams.get('city');
    const cuisine = searchParams.get('cuisine');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (cuisine) {
      query = query.contains('cuisine', [cuisine]);
    }

    const { data: restaurants, error } = await query;

    if (error) {
      console.error('Error fetching restaurants:', error);
      return NextResponse.json(
        { error: 'Failed to fetch restaurants' },
        { status: 500 }
      );
    }

    return NextResponse.json({ restaurants });
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
    const validatedData = restaurantSchema.parse(json);

    // Check for duplicate restaurant (same name + city)
    const { data: existingRestaurant } = await supabase
      .from('restaurants')
      .select('id')
      .ilike('name', validatedData.name)
      .ilike('city', validatedData.city)
      .single();

    if (existingRestaurant) {
      return NextResponse.json(
        { error: 'Restaurant already exists in this city' },
        { status: 409 }
      );
    }

    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ restaurant }, { status: 201 });
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