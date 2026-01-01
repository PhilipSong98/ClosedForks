import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Restaurant } from '@/types';

// Dish rating for the new system
interface DishRatingInput {
  dish_name: string;
  rating: number;
}

interface CreateReviewData {
  restaurant_id?: string; // Optional when restaurant_data is provided
  restaurant_data?: Restaurant; // Restaurant data from Google Places when restaurant doesn't exist
  rating_overall: number;
  // New dish ratings system
  dish_ratings?: DishRatingInput[];
  review: string;
  // Legacy fields - optional for backward compatibility
  dish?: string;
  recommend?: boolean;
  tips?: string;
  tags?: string[];
  visit_date: string;
  visibility: 'my_circles';
}

interface CreateReviewResponse {
  review: {
    id: string;
    restaurant_id: string;
    author_id: string;
    [key: string]: unknown;
  };
  restaurant?: Restaurant;
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData): Promise<CreateReviewResponse> => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create review';

        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing errors and fall back to the default message
        }

        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      const restaurantId = data.review?.restaurant_id || variables.restaurant_id;

      // Targeted invalidation: Only invalidate what's affected

      // 1. Invalidate the feed (new review should appear)
      // The feed uses queryKey: ['reviews', 'infinite', {...}], so invalidate all 'reviews' queries
      queryClient.invalidateQueries({ queryKey: ['reviews'] });

      // 2. Invalidate only the specific restaurant's data (aggregates changed)
      if (restaurantId) {
        // Use actual query keys: ['restaurant', id] not QUERY_KEYS pattern
        queryClient.invalidateQueries({
          queryKey: ['restaurant', restaurantId]
        });
        // Also invalidate restaurant list queries (aggregates changed)
        queryClient.invalidateQueries({
          queryKey: ['restaurants']
        });
      }

      // 3. Invalidate restaurant feed (aggregates may have changed)
      queryClient.invalidateQueries({ queryKey: ['infinite-restaurants'] });

      // 4. Invalidate user's own reviews list
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Match user review queries but not all reviews
          return key[0] === 'user' && key[1] === 'reviews';
        }
      });
    },
    onError: (error) => {
      console.error('Failed to create review:', error);
    },
  });
}
