import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Restaurant } from '@/types';

interface CreateReviewData {
  restaurant_id?: string; // Optional when restaurant_data is provided
  restaurant_data?: Restaurant; // Restaurant data from Google Places when restaurant doesn't exist
  rating_overall: number;
  dish: string;
  review: string;
  recommend: boolean;
  tips?: string;
  tags?: string[];
  visit_date: string;
  visibility: 'my_circles';
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: CreateReviewData) => {
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
    onSuccess: () => {
      // Invalidate and refetch reviews data
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      // Also invalidate restaurants data since it includes review aggregations
      queryClient.invalidateQueries({ queryKey: ['restaurants'] });
    },
  });
}
