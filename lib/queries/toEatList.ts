import { useQuery } from '@tanstack/react-query';
import { Restaurant } from '@/types';

interface ToEatListResponse {
  restaurants: (Restaurant & { savedAt: string })[];
  count: number;
}

// Hook to fetch user's to-eat list
export function useToEatList() {
  return useQuery({
    queryKey: ['user', 'to-eat-list'],
    queryFn: async (): Promise<ToEatListResponse> => {
      const response = await fetch('/api/users/to-eat-list', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch to-eat list');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });
}

// Hook to check if a restaurant is in user's to-eat list
export function useIsInToEatList(restaurantId: string) {
  const { data: toEatList } = useToEatList();
  
  return toEatList?.restaurants?.some(restaurant => restaurant.id === restaurantId) ?? false;
}