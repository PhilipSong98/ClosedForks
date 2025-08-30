import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restaurantSchema } from '@/lib/validations';

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
    const restaurantData = restaurantSchema.parse(json);

    // First, try to find existing restaurant by google_place_id if provided
    if (restaurantData.google_place_id) {
      const { data: existingByPlaceId } = await supabase
        .from('restaurants')
        .select('*')
        .eq('google_place_id', restaurantData.google_place_id)
        .single();

      if (existingByPlaceId) {
        return NextResponse.json({ 
          restaurant: existingByPlaceId,
          created: false 
        });
      }
    }

    // Then try to find by name and city (fuzzy match)
    const { data: existingByName } = await supabase
      .from('restaurants')
      .select('*')
      .ilike('name', `%${restaurantData.name}%`)
      .ilike('city', `%${restaurantData.city}%`)
      .single();

    if (existingByName) {
      // Update existing restaurant with Google data if we have it
      if (restaurantData.google_place_id && !existingByName.google_place_id) {
        const { data: updated } = await supabase
          .from('restaurants')
          .update({
            google_place_id: restaurantData.google_place_id,
            google_maps_url: restaurantData.google_maps_url,
            google_data: restaurantData.google_data,
            last_google_sync: restaurantData.last_google_sync,
            // Update other fields with Google data if they're empty
            ...((!existingByName.phone && restaurantData.phone) && { phone: restaurantData.phone }),
            ...((!existingByName.website_url && restaurantData.website_url) && { website_url: restaurantData.website_url }),
            ...((!existingByName.lat && restaurantData.lat) && { lat: restaurantData.lat }),
            ...((!existingByName.lng && restaurantData.lng) && { lng: restaurantData.lng }),
          })
          .eq('id', existingByName.id)
          .select()
          .single();

        return NextResponse.json({ 
          restaurant: updated,
          created: false,
          updated: true
        });
      }

      return NextResponse.json({ 
        restaurant: existingByName,
        created: false 
      });
    }

    // Create new restaurant
    const { data: newRestaurant, error } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();

    if (error) {
      console.error('Error creating restaurant:', error);
      return NextResponse.json(
        { error: 'Failed to create restaurant' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      restaurant: newRestaurant,
      created: true 
    });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Find or create restaurant error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}