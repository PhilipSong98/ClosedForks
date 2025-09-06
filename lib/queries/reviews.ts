import { useQuery, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { Review } from '@/types';

// Define the cursor type for keyset pagination
interface KeysetCursor {
  created_at: string;
  id: string;
}

// Union type for page parameters to support both pagination strategies
type PageParam = number | KeysetCursor | null;

interface ReviewsResponse {
  reviews: Review[];
  hasMore: boolean;
  nextCursor?: PageParam; // Support both keyset and offset pagination
  _meta?: {
    optimized: boolean;
    queriesUsed: string;
    paginationType: 'keyset' | 'offset';
  };
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
  useKeysetPagination?: boolean; // Enable the new optimized keyset pagination
}) {
  const pageSize = options?.pageSize || 15;
  const useKeyset = options?.useKeysetPagination ?? true; // Default to keyset for better performance
  
  return useInfiniteQuery<ReviewsResponse, Error, InfiniteData<ReviewsResponse, PageParam>, (string | { useKeysetPagination: boolean; restaurantId?: string; authorId?: string; pageSize?: number; enabled?: boolean; })[], PageParam>({
    queryKey: ['reviews', 'infinite', { ...options, useKeysetPagination: useKeyset }],
    queryFn: async ({ pageParam }: { pageParam: PageParam }): Promise<ReviewsResponse> => {
      const params = new URLSearchParams();
      if (options?.restaurantId) params.append('restaurant_id', options.restaurantId);
      if (options?.authorId) params.append('author_id', options.authorId);
      params.append('limit', pageSize.toString());
      
      if (useKeyset && pageParam && typeof pageParam === 'object' && 'created_at' in pageParam) {
        // Keyset pagination - much faster for deep pages
        const cursor = pageParam as KeysetCursor;
        params.append('cursor_created_at', cursor.created_at);
        params.append('cursor_id', cursor.id);
      } else if (!useKeyset || typeof pageParam === 'number') {
        // Fallback to offset pagination
        const page = typeof pageParam === 'number' ? pageParam : 1;
        params.append('page', page.toString());
      }

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
      
      // Log performance information in development
      if (data._meta && process.env.NODE_ENV === 'development') {
        console.log(`[Infinite Reviews] Optimized: ${data._meta.optimized}, Queries: ${data._meta.queriesUsed}, Pagination: ${data._meta.paginationType}`);
      }
      
      return {
        reviews: data.reviews || [],
        hasMore: data.hasMore || false,
        nextCursor: data.nextCursor || (useKeyset ? undefined : (typeof pageParam === 'number' ? pageParam + 1 : 2)),
        _meta: data._meta
      };
    },
    initialPageParam: (useKeyset ? null : 1) as PageParam,
    getNextPageParam: (lastPage): PageParam => lastPage.nextCursor ?? null,
    enabled: options?.enabled !== false,
    staleTime: 15 * 60 * 1000, // 15 minutes for optimized queries
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Reduce unnecessary refetches
    refetchOnMount: 'always', // Always fetch fresh data on mount
  });
}