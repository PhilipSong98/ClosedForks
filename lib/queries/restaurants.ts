import { useQuery } from '@tanstack/react-query';
import { Restaurant } from '@/types';

export function useRestaurants(options?: {
  city?: string;
  cuisine?: string[];
  limit?: number;
  sortBy?: 'rating' | 'created_at';
}) {
  return useQuery({
    queryKey: ['restaurants', options],
    queryFn: async (): Promise<Restaurant[]> => {
      const params = new URLSearchParams();
      if (options?.city) params.append('city', options.city);
      if (options?.cuisine?.length) {
        options.cuisine.forEach(c => params.append('cuisine', c));
      }
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.sortBy) params.append('sort', options.sortBy);

      const response = await fetch(`/api/restaurants?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }
      const data = await response.json();
      return data.restaurants || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTopRestaurants(limit: number = 10) {
  return useQuery({
    queryKey: ['restaurants', 'top', limit],
    queryFn: async (): Promise<Restaurant[]> => {
      const response = await fetch(`/api/restaurants?sort=rating&limit=${limit}&has_reviews=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch top restaurants');
      }
      const data = await response.json();
      return data.restaurants || [];
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useRestaurant(restaurantId: string) {
  return useQuery({
    queryKey: ['restaurant', restaurantId],
    queryFn: async (): Promise<Restaurant> => {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch restaurant');
      }
      const data = await response.json();
      return data.restaurant;
    },
    enabled: !!restaurantId,
  });
}