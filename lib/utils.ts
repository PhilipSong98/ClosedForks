import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Restaurant } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the Google Places photo URL for a restaurant
 * @param restaurant - Restaurant object with Google data
 * @param maxWidth - Maximum width for the photo (default: 400)
 * @returns Photo URL or null if no photo available
 */
export function getRestaurantPhotoUrl(restaurant: Restaurant, maxWidth: number = 400): string | null {
  if (!restaurant.google_data?.photos?.[0]) {
    return null;
  }

  const photoReference = restaurant.google_data.photos[0].photo_reference;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY;
  
  if (!apiKey) {
    console.warn('Google Places API key not found');
    return null;
  }

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}
