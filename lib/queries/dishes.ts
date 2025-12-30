import { useQuery } from '@tanstack/react-query';
import type { DishSuggestion, DishAggregate } from '@/types';

// ============================================================================
// DISH AUTOCOMPLETE HOOK
// ============================================================================

interface DishAutocompleteResponse {
  suggestions: DishSuggestion[];
}

/**
 * Hook for fetching dish autocomplete suggestions for a specific restaurant.
 * Results are cached for 30 seconds to reduce API calls while typing.
 */
export function useDishAutocomplete(restaurantId: string | undefined, query: string) {
  return useQuery<DishAutocompleteResponse>({
    queryKey: ['dishes', 'autocomplete', restaurantId, query],
    queryFn: async () => {
      if (!restaurantId) {
        return { suggestions: [] };
      }

      const params = new URLSearchParams({
        restaurant_id: restaurantId,
        query: query,
      });

      const response = await fetch(`/api/dishes/autocomplete?${params}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch dish suggestions');
      }

      return response.json();
    },
    enabled: !!restaurantId && query.length >= 1,
    staleTime: 30000, // 30 seconds - keep cached while user is typing
    gcTime: 60000, // 1 minute garbage collection time
    refetchOnWindowFocus: false,
  });
}

// ============================================================================
// RESTAURANT DISHES HOOK
// ============================================================================

interface RestaurantDishesResponse {
  restaurant_id: string;
  restaurant_name: string;
  dishes: DishAggregate[];
  count: number;
}

/**
 * Hook for fetching all dish aggregates for a restaurant.
 * Used for displaying popular dishes on restaurant detail pages.
 */
export function useRestaurantDishes(restaurantId: string | undefined) {
  return useQuery<RestaurantDishesResponse>({
    queryKey: ['restaurants', restaurantId, 'dishes'],
    queryFn: async () => {
      if (!restaurantId) {
        throw new Error('Restaurant ID is required');
      }

      const response = await fetch(`/api/restaurants/${restaurantId}/dishes`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch restaurant dishes');
      }

      return response.json();
    },
    enabled: !!restaurantId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes garbage collection time
  });
}

// ============================================================================
// DISH SUGGESTIONS PREFETCH HELPER
// ============================================================================

/**
 * Prefetch dish suggestions for a restaurant.
 * Useful for preloading suggestions when user selects a restaurant.
 */
export function prefetchDishSuggestions(
  queryClient: ReturnType<typeof import('@tanstack/react-query').useQueryClient>,
  restaurantId: string
) {
  return queryClient.prefetchQuery({
    queryKey: ['dishes', 'autocomplete', restaurantId, ''],
    queryFn: async () => {
      const params = new URLSearchParams({
        restaurant_id: restaurantId,
        query: '',
      });

      const response = await fetch(`/api/dishes/autocomplete?${params}`);

      if (!response.ok) {
        return { suggestions: [] };
      }

      return response.json();
    },
    staleTime: 30000,
  });
}
