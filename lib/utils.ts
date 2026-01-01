import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Restaurant } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date as a human-readable time ago string
 * Lightweight replacement for date-fns formatDistanceToNow (~38MB → <1KB)
 * @param date - Date to format
 * @param options - Options for formatting
 * @returns Formatted string like "2 hours ago" or "in 3 days"
 */
export function formatTimeAgo(
  date: Date | string | number,
  options: { addSuffix?: boolean } = { addSuffix: true }
): string {
  const now = new Date();
  const target = new Date(date);
  const diffMs = target.getTime() - now.getTime();
  const absDiffMs = Math.abs(diffMs);
  const isPast = diffMs < 0;

  // Time units in milliseconds
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  let value: number;
  let unit: string;

  if (absDiffMs < minute) {
    return 'just now';
  } else if (absDiffMs < hour) {
    value = Math.round(absDiffMs / minute);
    unit = value === 1 ? 'minute' : 'minutes';
  } else if (absDiffMs < day) {
    value = Math.round(absDiffMs / hour);
    unit = value === 1 ? 'hour' : 'hours';
  } else if (absDiffMs < week) {
    value = Math.round(absDiffMs / day);
    unit = value === 1 ? 'day' : 'days';
  } else if (absDiffMs < month) {
    value = Math.round(absDiffMs / week);
    unit = value === 1 ? 'week' : 'weeks';
  } else if (absDiffMs < year) {
    value = Math.round(absDiffMs / month);
    unit = value === 1 ? 'month' : 'months';
  } else {
    value = Math.round(absDiffMs / year);
    unit = value === 1 ? 'year' : 'years';
  }

  const timeString = `${value} ${unit}`;

  if (!options.addSuffix) {
    return timeString;
  }

  return isPast ? `${timeString} ago` : `in ${timeString}`;
}

/**
 * Get initials from a name string
 * Extracts first letter of first and last name (or first two letters if single name)
 * @param name - Full name string
 * @returns 1-2 character uppercase initials
 */
export function getInitials(name: string): string {
  const cleaned = (name || '').trim();
  if (!cleaned) return 'U';

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

/**
 * Interface for debounced function with cancel method
 */
interface DebouncedFunction<T extends (...args: Parameters<T>) => ReturnType<T>> {
  (...args: Parameters<T>): void;
  cancel: () => void;
}

/**
 * Create a debounced function that delays invoking func until after wait milliseconds
 * Lightweight replacement for lodash debounce (~4.9MB → <1KB)
 * @param func - Function to debounce
 * @param wait - Milliseconds to delay
 * @returns Debounced function with cancel method
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): DebouncedFunction<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced as DebouncedFunction<T>;
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
