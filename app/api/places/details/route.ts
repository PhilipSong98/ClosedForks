import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { placeDetailsSchema } from '@/lib/validations';
import { mapGoogleTypesToCuisines, mapGooglePriceLevelToLocal, generateGoogleMapsUrl } from '@/lib/google/places';

export async function POST(request: NextRequest) {
  try {
    // TODO: Re-enable authentication after testing
    // const supabase = await createClient();
    // const { data: { user }, error: authError } = await supabase.auth.getUser();
    // if (authError || !user) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const json = await request.json();
    const { placeId } = placeDetailsSchema.parse(json);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Places Details API with field masks to reduce cost
    const url = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      place_id: placeId,
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

      // Process Google data for our format
      const restaurantData = {
        name: place.name || '',
        address: place.formatted_address || '',
        city: city,
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
        cuisine: mapGoogleTypesToCuisines(place.types || []),
        price_level: mapGooglePriceLevelToLocal(place.price_level),
        website_url: place.website || '',
        phone: place.formatted_phone_number || '',
        google_place_id: place.place_id,
        google_maps_url: generateGoogleMapsUrl(place.place_id),
        source: 'maps' as const,
        google_data: {
          formatted_address: place.formatted_address,
          formatted_phone_number: place.formatted_phone_number,
          website: place.website,
          opening_hours: place.opening_hours ? {
            open_now: place.opening_hours.open_now,
            weekday_text: place.opening_hours.weekday_text,
          } : undefined,
          photos: place.photos?.slice(0, 5).map((photo: any) => ({
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
        last_google_sync: new Date().toISOString(),
      };

      return NextResponse.json({ restaurant: restaurantData });
    } else {
      console.error('Google Places Details API error:', data);
      return NextResponse.json(
        { error: data.error_message || 'Place details fetch failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.message },
        { status: 400 }
      );
    }

    console.error('Place details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}