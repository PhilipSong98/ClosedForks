import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
    onMutate: async (reviewId: string) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === 'reviews' || key === 'user' || key === 'restaurants' || key === 'restaurant';
        }
      });

      // Store the review ID for error handling
      return { reviewId };
    },
    onError: (err, reviewId, context) => {
      console.error('Like mutation failed:', err);
      
      // Invalidate queries to ensure fresh data on next fetch
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === 'reviews' || key === 'user' || key === 'restaurants';
        }
      });
      
      // Show contextual error message based on error type
      const errorMessage = err instanceof Error ? err.message : 'Failed to update like';
      
      if (errorMessage.includes('timeout')) {
        toast.error('Connection timeout. Your like will sync when connection improves.');
      } else if (errorMessage.includes('Network error')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Failed to update like. Please try again.');
      }
    },
    onSuccess: (data, reviewId) => {
      // Apply server response to all queries to sync with actual server state
      const serverUpdates = {
        isLikedByUser: data.isLiked,
        like_count: data.likeCount
      };

      // Update infinite queries (like home page feed)
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key === 'infinite-reviews';
          }
        },
        (oldData: unknown) => {
          if (!oldData || typeof oldData !== 'object') return oldData;

          // Handle infinite query structure with proper typing
          interface InfiniteQueryData {
            pages: Array<{
              reviews: ReviewData[];
              [key: string]: unknown;
            }>;
            pageParams?: unknown[];
          }

          if ('pages' in oldData && Array.isArray(oldData.pages)) {
            const infiniteData = oldData as InfiniteQueryData;
            return {
              ...oldData,
              pages: infiniteData.pages.map((page) => {
                if (page && typeof page === 'object' && 'reviews' in page && Array.isArray(page.reviews)) {
                  return {
                    ...page,
                    reviews: page.reviews.map((review: ReviewData) => {
                      if (review.id === reviewId) {
                        return { ...review, ...serverUpdates };
                      }
                      return review;
                    })
                  };
                }
                return page;
              })
            };
          }
          return oldData;
        }
      );

      // Update regular queries
      queryClient.setQueriesData(
        {
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key === 'reviews' || key === 'user' || key === 'restaurants';
          }
        },
        (oldData: unknown) => updateReviewInData(oldData, reviewId, serverUpdates)
      );

      // Handle liked reviews list - remove from liked reviews if unliked
      if (!data.isLiked) {
        queryClient.setQueriesData(
          {
            predicate: (query) => {
              const key = query.queryKey.join('-');
              return key.startsWith('user-liked-reviews');
            }
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

      // Targeted background invalidation - only invalidate specific queries that need fresh data
      // The cache was already updated optimistically, so this is just for eventual consistency
      queryClient.invalidateQueries({
        queryKey: ['infinite-reviews'],
        refetchType: 'none', // Don't refetch immediately, just mark as stale
      });

      // Mark user liked reviews as stale (will refetch on next access)
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey.join('-');
          return key.startsWith('user-liked-reviews');
        },
        refetchType: 'none',
      });
    },
  });
}