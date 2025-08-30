import { Loader } from '@googlemaps/js-api-loader';

export interface GooglePlaceData {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  types?: string[];
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

export interface GooglePlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

let googleLoader: Loader | null = null;
let placesService: google.maps.places.PlacesService | null = null;

export const initializeGoogleMaps = async (): Promise<void> => {
  if (typeof window === 'undefined') return;
  
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  if (!apiKey) {
    throw new Error('Google Places API key not found');
  }

  if (!googleLoader) {
    googleLoader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places'],
    });
  }

  try {
    await googleLoader.load();
    
    if (!placesService) {
      const mapDiv = document.createElement('div');
      const map = new google.maps.Map(mapDiv);
      placesService = new google.maps.places.PlacesService(map);
    }
  } catch (error) {
    console.error('Failed to initialize Google Maps:', error);
    throw error;
  }
};

export const getPlacesPredictions = async (
  input: string,
  sessionToken: string
): Promise<GooglePlacePrediction[]> => {
  await initializeGoogleMaps();
  
  return new Promise((resolve, reject) => {
    if (!placesService) {
      reject(new Error('Places service not initialized'));
      return;
    }

    const request: google.maps.places.AutocompletionRequest = {
      input,
      types: ['establishment'],
      componentRestrictions: { country: 'us' }, // Adjust as needed
      sessionToken: new google.maps.places.AutocompleteSessionToken(),
    };

    const autocompleteService = new google.maps.places.AutocompleteService();
    
    autocompleteService.getPlacePredictions(request, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        const formattedPredictions: GooglePlacePrediction[] = predictions.map(prediction => ({
          place_id: prediction.place_id!,
          description: prediction.description,
          structured_formatting: {
            main_text: prediction.structured_formatting?.main_text || '',
            secondary_text: prediction.structured_formatting?.secondary_text || '',
          },
          types: prediction.types || [],
        }));
        resolve(formattedPredictions);
      } else {
        reject(new Error(`Places predictions failed: ${status}`));
      }
    });
  });
};

export const getPlaceDetails = async (
  placeId: string
): Promise<GooglePlaceData | null> => {
  await initializeGoogleMaps();
  
  return new Promise((resolve, reject) => {
    if (!placesService) {
      reject(new Error('Places service not initialized'));
      return;
    }

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId,
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
      ],
    };

    placesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const placeData: GooglePlaceData = {
          place_id: place.place_id!,
          name: place.name!,
          formatted_address: place.formatted_address!,
          formatted_phone_number: place.formatted_phone_number,
          website: place.website,
          opening_hours: place.opening_hours ? {
            open_now: place.opening_hours.isOpen?.(),
            weekday_text: place.opening_hours.weekday_text,
          } : undefined,
          photos: place.photos?.slice(0, 5).map(photo => ({
            photo_reference: photo.getUrl({ maxWidth: 400, maxHeight: 300 }),
            height: photo.height,
            width: photo.width,
          })),
          types: place.types,
          geometry: place.geometry ? {
            location: {
              lat: place.geometry.location!.lat(),
              lng: place.geometry.location!.lng(),
            },
          } : undefined,
          business_status: place.business_status,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          price_level: place.price_level,
        };
        
        resolve(placeData);
      } else {
        resolve(null);
      }
    });
  });
};

export const generateGoogleMapsUrl = (placeId: string): string => {
  return `https://www.google.com/maps/dir/?api=1&destination_place_id=${placeId}`;
};

export const generateMapsEmbedUrl = (placeId: string): string => {
  const embedKey = process.env.GOOGLE_MAPS_EMBED_KEY;
  if (!embedKey) {
    console.warn('Google Maps Embed key not found');
    return '';
  }
  return `https://www.google.com/maps/embed/v1/place?key=${embedKey}&q=place_id:${placeId}`;
};

export const mapGoogleTypesToCuisines = (types: string[]): string[] => {
  const typeMapping: Record<string, string> = {
    'bakery': 'Bakery',
    'bar': 'Bar',
    'cafe': 'Cafe',
    'meal_delivery': 'Delivery',
    'meal_takeaway': 'Takeout',
    'restaurant': 'Restaurant',
    'food': 'Restaurant',
  };

  return types
    .filter(type => typeMapping[type])
    .map(type => typeMapping[type]);
};

export const mapGooglePriceLevelToLocal = (priceLevel?: number): number => {
  // Google uses 0-4, we use 1-4
  if (typeof priceLevel === 'number' && priceLevel >= 0) {
    return Math.max(1, priceLevel);
  }
  return 1; // Default to budget
};