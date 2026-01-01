import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { placesAutocompleteSchema } from '@/lib/validations';

// Google Places API types
interface GooglePlacePrediction {
  place_id: string;
  description: string;
  types: string[];
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const json = await request.json();
    const { input, sessionToken } = placesAutocompleteSchema.parse(json);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Places Autocomplete API
    const url = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
    const params = new URLSearchParams({
      input,
      sessiontoken: sessionToken,
      types: 'establishment',
      components: 'country:se', // Sweden
      location: '59.3293,18.0686', // Stockholm coordinates
      radius: '50000', // 50km radius around Stockholm
      key: apiKey,
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.status === 'OK') {
      // Filter for restaurant-like places
      const restaurantTypes = ['restaurant', 'meal_takeaway', 'meal_delivery', 'cafe', 'bar', 'bakery', 'food'];
      
      const filteredPredictions = data.predictions.filter((prediction: GooglePlacePrediction) =>
        prediction.types.some((type: string) => restaurantTypes.includes(type))
      );

      return NextResponse.json({
        predictions: filteredPredictions.map((prediction: GooglePlacePrediction) => ({
          place_id: prediction.place_id,
          description: prediction.description,
          structured_formatting: {
            main_text: prediction.structured_formatting?.main_text || '',
            secondary_text: prediction.structured_formatting?.secondary_text || '',
          },
          types: prediction.types,
        })),
      });
    } else {
      console.error('Google Places API error:', data);
      return NextResponse.json(
        { error: data.error_message || 'Places autocomplete failed' },
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

    console.error('Autocomplete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}