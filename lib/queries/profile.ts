import { useQuery } from '@tanstack/react-query';
import { User, Review, Restaurant } from '@/types';

interface UserProfile extends User {
  stats: {
    reviewCount: number;
    favoritesCount: number;
  };
  favoriteRestaurants: Restaurant[];
}

interface UserReviewsResponse {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Hook to fetch current user's profile with stats
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async (): Promise<UserProfile> => {
      const response = await fetch('/api/users/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }
      const data = await response.json();
      return data.profile;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook to fetch user's reviews with pagination
export function useUserReviews(userId: string, page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['user', userId, 'reviews', page, limit],
    queryFn: async (): Promise<UserReviewsResponse> => {
      const response = await fetch(`/api/users/${userId}/reviews?page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user reviews');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook to fetch user's liked reviews with pagination
export function useUserLikedReviews(page: number = 1, limit: number = 10) {
  return useQuery({
    queryKey: ['user', 'liked-reviews', page, limit],
    queryFn: async (): Promise<UserReviewsResponse> => {
      const response = await fetch(`/api/users/liked-reviews?page=${page}&limit=${limit}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch liked reviews');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}