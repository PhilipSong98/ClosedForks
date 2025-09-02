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
      const response = await fetch(`/api/reviews/${reviewId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle like');
      }

      return response.json();
    },
    onMutate: async (reviewId: string) => {
      // Cancel all outgoing refetches for review-related queries
      await queryClient.cancelQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === 'reviews' || key === 'user' || key === 'restaurants' || key === 'restaurant';
        }
      });

      // Get current like state from any available query
      let currentReview: ReviewData | null = null;
      let currentlyLiked = false;
      let currentLikeCount = 0;

      // Try to find the review in various query caches
      const allQueries = queryClient.getQueriesData({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === 'reviews' || key === 'user' || key === 'restaurants';
        }
      });

      for (const [, data] of allQueries) {
        if (Array.isArray(data)) {
          currentReview = data.find((review: ReviewData) => review.id === reviewId) || null;
        } else if (data && typeof data === 'object' && 'reviews' in data) {
          const reviewsData = data as ReviewsResponse;
          currentReview = reviewsData.reviews.find((review: ReviewData) => review.id === reviewId) || null;
        }
        
        if (currentReview) {
          currentlyLiked = currentReview.isLikedByUser || false;
          currentLikeCount = currentReview.like_count || 0;
          break;
        }
      }

      // Calculate optimistic updates
      const optimisticUpdates = {
        isLikedByUser: !currentlyLiked,
        like_count: currentlyLiked 
          ? Math.max(0, currentLikeCount - 1)
          : currentLikeCount + 1
      };

      // Store previous state for all affected queries
      const previousStates = new Map<string, unknown>();

      // Apply optimistic updates to ALL queries that might contain this review
      queryClient.setQueriesData(
        { 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key === 'reviews' || key === 'user' || key === 'restaurants';
          }
        },
        (oldData: unknown) => {
          if (oldData) {
            previousStates.set(JSON.stringify(oldData), oldData);
            return updateReviewInData(oldData, reviewId, optimisticUpdates);
          }
          return oldData;
        }
      );

      return { previousStates, reviewId };
    },
    onError: (err, reviewId, context) => {
      console.error('Like mutation failed:', err);
      
      // Roll back optimistic updates
      if (context?.previousStates) {
        // Restore all queries to their previous state
        queryClient.invalidateQueries({ 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key === 'reviews' || key === 'user' || key === 'restaurants';
          }
        });
      }
      
      // Show error toast
      toast.error('Failed to update like. Please try again.');
    },
    onSuccess: (data, reviewId) => {
      // Apply server response to all queries (in case of any discrepancies)
      const serverUpdates = {
        isLikedByUser: data.isLiked,
        like_count: data.likeCount
      };

      queryClient.setQueriesData(
        { 
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return key === 'reviews' || key === 'user' || key === 'restaurants';
          }
        },
        (oldData: unknown) => updateReviewInData(oldData, reviewId, serverUpdates)
      );

      // Invalidate all review-related queries to ensure fresh data on next fetch
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key === 'reviews' || key === 'user' || key === 'restaurants';
        }
      });
    },
  });
}