import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { findOrCreateRestaurantSchema } from '@/lib/validations';
import type { Restaurant } from '@/types';

// Helper function to extract city from address
function extractCityFromAddress(address: string): string | null {
  // For Swedish addresses, the city is typically the last part before any postal code
  // Example: "Drottninggatan 1, 111 51 Stockholm, Sweden" -> "Stockholm"
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Look for the part that might contain the city (usually second to last or last)
    const cityPart = parts[parts.length - 2] || parts[parts.length - 1];
    // Remove postal codes (5-6 digits) and country names
    const cleaned = cityPart.replace(/\d{3}\s?\d{2,3}/, '').replace(/Sweden|Sverige/i, '').trim();
    return cleaned || null;
  }
  return null;
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
    const inputData = findOrCreateRestaurantSchema.parse(json);
    
    // If we have a Google Place ID, fetch full details including photos directly from Google API
    let googleData = null;
    if (inputData.google_place_id) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
        if (apiKey) {
          const url = 'https://maps.googleapis.com/maps/api/place/details/json';
          const params = new URLSearchParams({
            place_id: inputData.google_place_id,
            fields: [
              'place_id',
              'name',
              'formatted_address',
              'formatted_phone_number',
              'website',
              'opening_hours',
              'photos',
              'types',
              'geometry',
              'business_status',
              'rating',
              'user_ratings_total',
              'price_level',
            ].join(','),
            key: apiKey,
          });

          const response = await fetch(`${url}?${params}`);
          const data = await response.json();

          if (data.status === 'OK' && data.result) {
            const place = data.result;
            
            // Extract city from formatted address
            const addressParts = place.formatted_address?.split(', ') || [];
            const city = addressParts.length >= 2 ? addressParts[addressParts.length - 3] : '';

            googleData = {
              name: place.name || '',
              address: place.formatted_address || '',
              city: city,
              lat: place.geometry?.location?.lat,
              lng: place.geometry?.location?.lng,
              cuisine: [], // Would need mapping from place.types
              price_level: place.price_level || 2,
              website_url: place.website || '',
              phone: place.formatted_phone_number || '',
              google_place_id: place.place_id,
              google_maps_url: `https://maps.google.com/?place_id=${place.place_id}`,
              google_data: {
                formatted_address: place.formatted_address,
                formatted_phone_number: place.formatted_phone_number,
                website: place.website,
                opening_hours: place.opening_hours ? {
                  open_now: place.opening_hours.open_now,
                  weekday_text: place.opening_hours.weekday_text,
                } : undefined,
                photos: place.photos?.slice(0, 5).map((photo: { photo_reference: string; height: number; width: number }) => ({
                  photo_reference: photo.photo_reference,
                  height: photo.height,
                  width: photo.width,
                })),
                types: place.types,
                business_status: place.business_status,
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                price_level: place.price_level,
              },
            };
          }
        }
      } catch (error) {
        console.error('Failed to fetch Google Places details:', error);
      }
    }
    
    // Convert to full restaurant data with Google Places details or defaults
    const restaurantData = {
      ...inputData,
      // Use Google data if available, otherwise use provided data or defaults
      name: googleData?.name || inputData.name,
      address: googleData?.address || inputData.address,
      city: googleData?.city || inputData.city || extractCityFromAddress(inputData.address) || 'Stockholm',
      cuisine: googleData?.cuisine || [],
      price_level: googleData?.price_level || 2, // Default to medium price level
      phone: googleData?.phone || inputData.phone || '',
      website_url: googleData?.website_url || inputData.website_url || '',
      lat: googleData?.lat || inputData.lat,
      lng: googleData?.lng || inputData.lng,
      google_maps_url: googleData?.google_maps_url || inputData.google_maps_url,
      google_data: googleData?.google_data || inputData.google_data,
      source: 'maps' as const,
      last_google_sync: new Date().toISOString(),
    };

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
      .single() as { data: Restaurant | null; error: Error | null };

    if (existingByName) {
      // Update existing restaurant with Google data if we have it
      if (restaurantData.google_place_id && !existingByName.google_place_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: updated } = await (supabase.from('restaurants') as any)
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newRestaurant, error } = await (supabase.from('restaurants') as any)
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