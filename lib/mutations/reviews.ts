import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateReviewData {
  restaurant_id: string;
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
        const errorData = await response.json();
        
        // Handle specific error cases with better messaging
        if (response.status === 409 || errorData.error?.includes('already reviewed')) {
          throw new Error('You have already reviewed this restaurant. Each user can only write one review per restaurant.');
        }
        
        throw new Error(errorData.error || 'Failed to create review');
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