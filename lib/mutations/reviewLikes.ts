import { useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

// Context returned from onMutate for rollback
interface MutationContext {
  reviewId: string;
  previousInfiniteData: [QueryKey, unknown][];
  previousRegularData: [QueryKey, unknown][];
  previousState: { isLikedByUser: boolean; like_count: number } | null;
}

interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
  message: string;
}

interface ReviewData {
  id: string;
  like_count: number;
  isLikedByUser?: boolean;
  [key: string]: unknown;
}

interface ReviewsResponse {
  reviews: ReviewData[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  [key: string]: unknown;
}

// Helper function to update a review in any data structure
function updateReviewInData(
  data: unknown,
  reviewId: string,
  updates: { isLikedByUser: boolean; like_count: number }
): unknown {
  if (!data) return data;

  // Handle array of reviews directly
  if (Array.isArray(data)) {
    return data.map((review: ReviewData) => {
      if (review.id === reviewId) {
        return { ...review, ...updates };
      }
      return review;
    });
  }

  // Handle infinite query structure: { pages: [...], pageParams: [...] }
  if (typeof data === 'object' && data !== null && 'pages' in data && Array.isArray((data as { pages: unknown[] }).pages)) {
    const infiniteData = data as { pages: Array<{ reviews?: ReviewData[]; [key: string]: unknown }>; pageParams?: unknown[] };
    return {
      ...infiniteData,
      pages: infiniteData.pages.map((page) => {
        if (page && typeof page === 'object' && 'reviews' in page && Array.isArray(page.reviews)) {
          return {
            ...page,
            reviews: page.reviews.map((review: ReviewData) => {
              if (review.id === reviewId) {
                return { ...review, ...updates };
              }
              return review;
            })
          };
        }
        return page;
      })
    };
  }

  // Handle object with reviews property
  if (typeof data === 'object' && data !== null && 'reviews' in data) {
    const reviewsResponse = data as ReviewsResponse;
    if (Array.isArray(reviewsResponse.reviews)) {
      return {
        ...reviewsResponse,
        reviews: reviewsResponse.reviews.map((review: ReviewData) => {
          if (review.id === reviewId) {
            return { ...review, ...updates };
          }
          return review;
        })
      };
    }
  }

  return data;
}

// Helper to find a review's current state across all cache entries
function findReviewInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  reviewId: string
): { isLikedByUser: boolean; like_count: number } | null {
  // Check infinite queries first (most likely location - home feed)
  const infiniteQueries = queryClient.getQueriesData({
    predicate: (query) => {
      return query.queryKey[0] === 'reviews' && query.queryKey[1] === 'infinite';
    }
  });

  for (const [, data] of infiniteQueries) {
    if (data && typeof data === 'object' && 'pages' in data) {
      const infiniteData = data as { pages: Array<{ reviews?: ReviewData[] }> };
      for (const page of infiniteData.pages || []) {
        const review = page.reviews?.find(r => r.id === reviewId);
        if (review) {
          return {
            isLikedByUser: review.isLikedByUser ?? false,
            like_count: review.like_count ?? 0
          };
        }
      }
    }
  }

  // Check regular reviews queries
  const regularQueries = queryClient.getQueriesData({
    predicate: (query) => {
      const key = query.queryKey[0] as string;
      return key === 'reviews' || key === 'user' || key === 'restaurants';
    }
  });

  for (const [, data] of regularQueries) {
    if (Array.isArray(data)) {
      const review = data.find((r: ReviewData) => r.id === reviewId);
      if (review) {
        return {
          isLikedByUser: review.isLikedByUser ?? false,
          like_count: review.like_count ?? 0
        };
      }
    }
    if (data && typeof data === 'object' && 'reviews' in data) {
      const reviewsData = data as ReviewsResponse;
      const review = reviewsData.reviews?.find(r => r.id === reviewId);
      if (review) {
        return {
          isLikedByUser: review.isLikedByUser ?? false,
          like_count: review.like_count ?? 0
        };
      }
    }
  }

  return null;
}

export function useLikeReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: string): Promise<LikeResponse> => {
      // Add timeout to detect slow network conditions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const response = await fetch(`/api/reviews/${reviewId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Network error' }));
          throw new Error(errorData.error || `HTTP ${response.status}: Failed to toggle like`);
        }

        return response.json();
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection');
          }
          throw error;
        }
        throw new Error('Unknown network error occurred');
      }
    },
    onMutate: async (reviewId: string): Promise<MutationContext> => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === 'reviews' || key === 'user' || key === 'restaurants' || key === 'restaurant';
        }
      });

      // Find current review state in cache
      const currentState = findReviewInCache(queryClient, reviewId);

      // Calculate optimistic update (toggle like state)
      const optimisticUpdate = currentState
        ? {
            isLikedByUser: !currentState.isLikedByUser,
            like_count: currentState.isLikedByUser
              ? Math.max(0, currentState.like_count - 1)
              : currentState.like_count + 1
          }
        : { isLikedByUser: true, like_count: 1 }; // Default if not found in cache

      // Store previous cache state for rollback
      const previousInfiniteData = queryClient.getQueriesData({
        predicate: (query) => query.queryKey[0] === 'reviews' && query.queryKey[1] === 'infinite'
      });

      const previousRegularData = queryClient.getQueriesData({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return (key === 'reviews' && query.queryKey[1] !== 'infinite') ||
                 key === 'user' ||
                 key === 'restaurants';
        }
      });

      // Apply optimistic update to infinite queries (home feed)
      queryClient.setQueriesData(
        {
          predicate: (query) => query.queryKey[0] === 'reviews' && query.queryKey[1] === 'infinite'
        },
        (oldData: unknown) => updateReviewInData(oldData, reviewId, optimisticUpdate)
      );

      // Apply optimistic update to regular queries
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return (key === 'reviews' && query.queryKey[1] !== 'infinite') ||
                   key === 'user' ||
                   key === 'restaurants';
          }
        },
        (oldData: unknown) => updateReviewInData(oldData, reviewId, optimisticUpdate)
      );

      // Return context for rollback
      return {
        reviewId,
        previousInfiniteData,
        previousRegularData,
        previousState: currentState
      };
    },
    onError: (err, _reviewId, context) => {
      console.error('Like mutation failed:', err);

      // Rollback infinite queries to previous state
      if (context?.previousInfiniteData) {
        context.previousInfiniteData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Rollback regular queries to previous state
      if (context?.previousRegularData) {
        context.previousRegularData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Show contextual error message based on error type
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';

      if (errorMessage.includes('timeout')) {
        toast.error('Connection timeout. Please try again.');
      } else if (errorMessage.includes('Network error')) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error('Failed to update like. Please try again.');
      }
    },
    onSuccess: (data, reviewId) => {
      // Server response is authoritative - reconcile cache with actual server state
      const serverUpdates = {
        isLikedByUser: data.isLiked,
        like_count: data.likeCount
      };

      // Update infinite queries (home feed) - FIXED predicate
      queryClient.setQueriesData(
        {
          predicate: (query) => query.queryKey[0] === 'reviews' && query.queryKey[1] === 'infinite'
        },
        (oldData: unknown) => updateReviewInData(oldData, reviewId, serverUpdates)
      );

      // Update regular queries (excluding infinite which are handled above)
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return (key === 'reviews' && query.queryKey[1] !== 'infinite') ||
                   key === 'user' ||
                   key === 'restaurants';
          }
        },
        (oldData: unknown) => updateReviewInData(oldData, reviewId, serverUpdates)
      );

      // Handle liked reviews list - remove from liked reviews if unliked
      if (!data.isLiked) {
        queryClient.setQueriesData(
          {
            predicate: (query) => query.queryKey[0] === 'user' && query.queryKey[1] === 'liked-reviews'
          },
          (oldData: unknown) => {
            if (oldData && typeof oldData === 'object' && 'reviews' in oldData) {
              const reviewsData = oldData as ReviewsResponse;
              if (Array.isArray(reviewsData.reviews)) {
                const updatedReviews = reviewsData.reviews.filter((review: ReviewData) => review.id !== reviewId);
                return {
                  ...reviewsData,
                  reviews: updatedReviews,
                  pagination: {
                    ...reviewsData.pagination,
                    total: Math.max(0, (reviewsData.pagination?.total || 0) - 1)
                  }
                };
              }
            }
            return oldData;
          }
        );
      }

      // Mark queries as stale for eventual consistency (no immediate refetch)
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'reviews' && query.queryKey[1] === 'infinite',
        refetchType: 'none',
      });

      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'user' && query.queryKey[1] === 'liked-reviews',
        refetchType: 'none',
      });
    },
  });
}