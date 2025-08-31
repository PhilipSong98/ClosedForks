import { useMutation, useQueryClient } from '@tanstack/react-query';

interface UpdateProfileData {
  name?: string;
  favorite_restaurants?: string[];
}

// Hook to update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileData: UpdateProfileData) => {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate user profile query
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      // Update auth user state if profile was updated
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    },
  });
}


// Hook to add/remove favorite restaurants
export function useUpdateFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (favoriteRestaurants: string[]) => {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ favorite_restaurants: favoriteRestaurants }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update favorites');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate user profile query
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    },
  });
}