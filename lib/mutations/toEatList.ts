import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Restaurant } from '@/types';

interface AddToEatListResponse {
  message: string;
  restaurant_id: string;
}

interface RemoveFromEatListResponse {
  message: string;
  restaurant_id: string;
}

// Hook to add restaurant to to-eat list
export function useAddToEatList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurantId: string): Promise<AddToEatListResponse> => {
      const response = await fetch('/api/users/to-eat-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add restaurant to to-eat list');
      }

      return response.json();
    },
    onMutate: async (restaurantId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', 'to-eat-list'] });

      // Snapshot the previous value
      const previousToEatList = queryClient.getQueryData(['user', 'to-eat-list']);

      // Get restaurant data from other queries to add optimistically
      const restaurantsQuery = queryClient.getQueryData(['restaurants']);
      const restaurant = Array.isArray(restaurantsQuery) 
        ? restaurantsQuery.find((r: Restaurant) => r.id === restaurantId)
        : null;

      // Optimistically update to-eat list if we have restaurant data
      if (restaurant) {
        queryClient.setQueryData(['user', 'to-eat-list'], (old: unknown) => {
          const currentData = old as { restaurants: Restaurant[]; count: number } | undefined;
          return {
            restaurants: [
              { ...restaurant, savedAt: new Date().toISOString() },
              ...(currentData?.restaurants || [])
            ],
            count: (currentData?.count || 0) + 1,
          };
        });
      }

      return { previousToEatList };
    },
    onError: (err, restaurantId, context) => {
      // Rollback on error
      if (context?.previousToEatList) {
        queryClient.setQueryData(['user', 'to-eat-list'], context.previousToEatList);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch to-eat list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user', 'to-eat-list'] });
    },
  });
}

// Hook to remove restaurant from to-eat list
export function useRemoveFromToEatList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (restaurantId: string): Promise<RemoveFromEatListResponse> => {
      const response = await fetch('/api/users/to-eat-list', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove restaurant from to-eat list');
      }

      return response.json();
    },
    onMutate: async (restaurantId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', 'to-eat-list'] });

      // Snapshot the previous value
      const previousToEatList = queryClient.getQueryData(['user', 'to-eat-list']);

      // Optimistically remove from to-eat list
      queryClient.setQueryData(['user', 'to-eat-list'], (old: unknown) => {
        const currentData = old as { restaurants: Restaurant[]; count: number } | undefined;
        return {
          restaurants: (currentData?.restaurants || []).filter(
            (restaurant: Restaurant) => restaurant.id !== restaurantId
          ),
          count: Math.max(0, (currentData?.count || 0) - 1),
        };
      });

      return { previousToEatList };
    },
    onError: (err, restaurantId, context) => {
      // Rollback on error
      if (context?.previousToEatList) {
        queryClient.setQueryData(['user', 'to-eat-list'], context.previousToEatList);
      }
    },
    onSuccess: () => {
      // Invalidate and refetch to-eat list to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user', 'to-eat-list'] });
    },
  });
}