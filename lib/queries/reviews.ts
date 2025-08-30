import { useQuery } from '@tanstack/react-query';
import { Review } from '@/types';

export function useReviews(options?: {
  restaurantId?: string;
  authorId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['reviews', options],
    queryFn: async (): Promise<Review[]> => {
      const params = new URLSearchParams();
      if (options?.restaurantId) params.append('restaurant_id', options.restaurantId);
      if (options?.authorId) params.append('author_id', options.authorId);
      if (options?.limit) params.append('limit', options.limit.toString());

      const response = await fetch(`/api/reviews?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      return data.reviews || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useReview(reviewId: string) {
  return useQuery({
    queryKey: ['review', reviewId],
    queryFn: async (): Promise<Review> => {
      const response = await fetch(`/api/reviews/${reviewId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch review');
      }
      return response.json();
    },
    enabled: !!reviewId,
  });
}