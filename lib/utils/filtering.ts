/**
 * Pure utility functions for filtering and sorting reviews/restaurants.
 * Extracted to be reusable and avoid recreation on each render.
 */

import type { Review, Restaurant } from '@/types';
import type { FilterState } from '@/components/filters/SearchFilterBar';

/**
 * Maps a price per person value to a price level (1-4).
 * Pure function - safe to call repeatedly.
 */
export function mapPriceToLevel(price?: number | null): number | undefined {
  if (price == null) return undefined;
  if (price <= 25) return 1;
  if (price <= 50) return 2;
  if (price <= 100) return 3;
  return 4;
}

/**
 * Pre-calculated date cutoffs for filtering.
 * Call once and reuse within filter operations.
 */
export function getDateCutoffs(): { week: Date; month: Date; year: Date } {
  const now = new Date();
  return {
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()),
    year: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
  };
}

/**
 * Filter reviews based on FilterState.
 * Pure function - can be memoized with useMemo.
 */
export function filterReviews(
  reviews: Review[],
  filters: FilterState,
  dateCutoffs: ReturnType<typeof getDateCutoffs>
): Review[] {
  return reviews.filter(review => {
    // Tag filter
    if (filters.tags.length > 0) {
      const reviewTags = review.tags || [];
      const hasTagMatch = filters.tags.some(tag => reviewTags.includes(tag));
      if (!hasTagMatch) return false;
    }

    // Rating filter
    if (filters.minRating > 0 && review.rating_overall < filters.minRating) {
      return false;
    }

    // Price level filter ($ - $$$$)
    if (filters.priceLevels.length > 0) {
      const levelFromRestaurant = review.restaurant?.price_level as number | undefined;
      const levelFromPrice = mapPriceToLevel(review.price_per_person);
      const priceLevel = levelFromRestaurant || levelFromPrice;
      if (!priceLevel || !filters.priceLevels.includes(priceLevel)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const reviewDate = new Date(review.created_at);
      const cutoffDate = dateCutoffs[filters.dateRange as keyof typeof dateCutoffs];
      if (cutoffDate && reviewDate < cutoffDate) {
        return false;
      }
    }

    // Recommended only filter
    if (filters.recommendedOnly && !review.recommend) {
      return false;
    }

    return true;
  });
}

/**
 * Sort reviews based on sortBy option.
 * Pure function - can be memoized with useMemo.
 */
export function sortReviews(reviews: Review[], sortBy: FilterState['sortBy']): Review[] {
  return [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'rating':
        return b.rating_overall - a.rating_overall;
      case 'price_low': {
        const aLevel = (a.restaurant?.price_level as number | undefined) ?? mapPriceToLevel(a.price_per_person) ?? 0;
        const bLevel = (b.restaurant?.price_level as number | undefined) ?? mapPriceToLevel(b.price_per_person) ?? 0;
        return aLevel - bLevel;
      }
      case 'price_high': {
        const aLevel = (a.restaurant?.price_level as number | undefined) ?? mapPriceToLevel(a.price_per_person) ?? 0;
        const bLevel = (b.restaurant?.price_level as number | undefined) ?? mapPriceToLevel(b.price_per_person) ?? 0;
        return bLevel - aLevel;
      }
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });
}

/**
 * Filter and sort reviews in one operation.
 * Pure function - can be memoized with useMemo.
 */
export function filterAndSortReviews(
  reviews: Review[],
  filters: FilterState,
  dateCutoffs: ReturnType<typeof getDateCutoffs>
): Review[] {
  const filtered = filterReviews(reviews, filters, dateCutoffs);
  return sortReviews(filtered, filters.sortBy);
}

/**
 * Filter restaurants based on FilterState.
 * Pure function - can be memoized with useMemo.
 */
export function filterRestaurants(
  restaurants: Restaurant[],
  filters: FilterState
): Restaurant[] {
  return restaurants.filter(restaurant => {
    // Tag filter (from aggregated tags)
    if (filters.tags.length > 0) {
      const restaurantTags = restaurant.aggregated_tags || [];
      const hasTagMatch = filters.tags.some(tag => restaurantTags.includes(tag));
      if (!hasTagMatch) return false;
    }

    // Rating filter
    if (filters.minRating > 0 && (restaurant.avg_rating || 0) < filters.minRating) {
      return false;
    }

    // Price level filter ($ - $$$$)
    if (filters.priceLevels.length > 0) {
      if (!restaurant.price_level || !filters.priceLevels.includes(restaurant.price_level as number)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Sort restaurants based on sortBy option.
 * Pure function - can be memoized with useMemo.
 */
export function sortRestaurants(restaurants: Restaurant[], sortBy: FilterState['sortBy']): Restaurant[] {
  return [...restaurants].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'rating':
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      case 'price_low':
        return (a.price_level || 0) - (b.price_level || 0);
      case 'price_high':
        return (b.price_level || 0) - (a.price_level || 0);
      default:
        return (b.avg_rating || 0) - (a.avg_rating || 0);
    }
  });
}

/**
 * Filter and sort restaurants in one operation.
 * Pure function - can be memoized with useMemo.
 */
export function filterAndSortRestaurants(
  restaurants: Restaurant[],
  filters: FilterState
): Restaurant[] {
  const filtered = filterRestaurants(restaurants, filters);
  return sortRestaurants(filtered, filters.sortBy);
}
