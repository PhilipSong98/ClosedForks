import { useMutation, useQueryClient } from '@tanstack/react-query';

interface LikeResponse {
  success: boolean;
  isLiked: boolean;
  likeCount: number;
  message: string;
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
      // Cancel outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['reviews'] });

      // Snapshot the previous value
      const previousReviews = queryClient.getQueryData(['reviews']);

      // Optimistically update the UI
      queryClient.setQueryData(['reviews'], (old: unknown) => {
        if (!old || typeof old !== 'object' || !('reviews' in old)) {
          return old;
        }

        const data = old as { reviews: Array<{ 
          id: string; 
          like_count: number; 
          isLikedByUser?: boolean;
        }> };

        return {
          ...data,
          reviews: data.reviews.map(review => {
            if (review.id === reviewId) {
              const currentlyLiked = review.isLikedByUser || false;
              return {
                ...review,
                isLikedByUser: !currentlyLiked,
                like_count: currentlyLiked 
                  ? Math.max(0, review.like_count - 1)
                  : review.like_count + 1
              };
            }
            return review;
          })
        };
      });

      return { previousReviews };
    },
    onError: (err, reviewId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousReviews) {
        queryClient.setQueryData(['reviews'], context.previousReviews);
      }
    },
    onSuccess: (data, reviewId) => {
      // Update the specific review with the server response to ensure consistency
      queryClient.setQueryData(['reviews'], (old: unknown) => {
        if (!old || typeof old !== 'object' || !('reviews' in old)) {
          return old;
        }

        const reviewData = old as { reviews: Array<{ 
          id: string; 
          like_count: number; 
          isLikedByUser?: boolean;
        }> };

        return {
          ...reviewData,
          reviews: reviewData.reviews.map(review => {
            if (review.id === reviewId) {
              return {
                ...review,
                isLikedByUser: data.isLiked,
                like_count: data.likeCount
              };
            }
            return review;
          })
        };
      });

      // Also invalidate queries to ensure we have fresh data
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
    },
  });
}