import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Review } from '@/types';

interface ReviewsResponse {
  reviews: Review[];
  hasMore: boolean;
  nextCursor?: number;
}

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

      const response = await fetch(`/api/reviews?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
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
      const response = await fetch(`/api/reviews/${reviewId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch review');
      }
      return response.json();
    },
    enabled: !!reviewId,
  });
}

export function useInfiniteReviews(options?: {
  restaurantId?: string;
  authorId?: string;
  pageSize?: number;
  enabled?: boolean;
}) {
  const pageSize = options?.pageSize || 15;
  
  return useInfiniteQuery({
    queryKey: ['reviews', 'infinite', options],
    queryFn: async ({ pageParam = 1 }): Promise<ReviewsResponse> => {
      const params = new URLSearchParams();
      if (options?.restaurantId) params.append('restaurant_id', options.restaurantId);
      if (options?.authorId) params.append('author_id', options.authorId);
      params.append('page', pageParam.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`/api/reviews?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      const data = await response.json();
      
      return {
        reviews: data.reviews || [],
        hasMore: data.hasMore || false,
        nextCursor: data.hasMore ? pageParam + 1 : undefined,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: options?.enabled !== false, // Default to enabled unless explicitly disabled
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}