import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FollowActionResponse, PublicProfile } from '@/types';

// Send a follow request
export function useFollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string): Promise<FollowActionResponse> => {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to send follow request' }));
        throw new Error(error.error || 'Failed to send follow request');
      }

      return response.json();
    },
    onMutate: async (targetUserId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['public-profile', targetUserId] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<{ profile: PublicProfile }>(['public-profile', targetUserId]);

      // Optimistically update to "requested" state
      queryClient.setQueryData<{ profile: PublicProfile }>(['public-profile', targetUserId], (old) => {
        if (!old) return old;
        return {
          ...old,
          profile: {
            ...old.profile,
            followStatus: {
              isFollowing: false,
              hasPendingRequest: true,
              isFollower: old.profile.followStatus?.isFollower || false,
            }
          }
        };
      });

      return { previousProfile };
    },
    onError: (err, targetUserId, context) => {
      console.error('Follow request error:', err);
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(['public-profile', targetUserId], context.previousProfile);
      }
      toast.error(err instanceof Error ? err.message : 'Failed to send follow request');
    },
    onSuccess: (data, targetUserId) => {
      // Invalidate to sync with server
      queryClient.invalidateQueries({ queryKey: ['public-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });

      if (data.success) {
        toast.success('Follow request sent');
      }
    },
  });
}

// Unfollow a user
export function useUnfollowUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string): Promise<FollowActionResponse> => {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to unfollow' }));
        throw new Error(error.error || 'Failed to unfollow');
      }

      return response.json();
    },
    onMutate: async (targetUserId: string) => {
      await queryClient.cancelQueries({ queryKey: ['public-profile', targetUserId] });

      const previousProfile = queryClient.getQueryData<{ profile: PublicProfile }>(['public-profile', targetUserId]);

      // Optimistically update to "not following" state
      queryClient.setQueryData<{ profile: PublicProfile }>(['public-profile', targetUserId], (old) => {
        if (!old) return old;
        return {
          ...old,
          profile: {
            ...old.profile,
            followers_count: Math.max(0, (old.profile.followers_count || 0) - 1),
            followStatus: {
              isFollowing: false,
              hasPendingRequest: false,
              isFollower: old.profile.followStatus?.isFollower || false,
            }
          }
        };
      });

      return { previousProfile };
    },
    onError: (err, targetUserId, context) => {
      console.error('Unfollow error:', err);
      if (context?.previousProfile) {
        queryClient.setQueryData(['public-profile', targetUserId], context.previousProfile);
      }
      toast.error(err instanceof Error ? err.message : 'Failed to unfollow');
    },
    onSuccess: (data, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['followers', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      // Refresh feed since visibility may have changed
      queryClient.invalidateQueries({ queryKey: ['infinite-reviews'] });

      if (data.success) {
        toast.success('Unfollowed');
      }
    },
  });
}

// Cancel a pending follow request
export function useCancelFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (targetUserId: string): Promise<FollowActionResponse> => {
      const response = await fetch(`/api/users/${targetUserId}/follow`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to cancel request' }));
        throw new Error(error.error || 'Failed to cancel request');
      }

      return response.json();
    },
    onMutate: async (targetUserId: string) => {
      await queryClient.cancelQueries({ queryKey: ['public-profile', targetUserId] });

      const previousProfile = queryClient.getQueryData<{ profile: PublicProfile }>(['public-profile', targetUserId]);

      // Optimistically update to "not requested" state
      queryClient.setQueryData<{ profile: PublicProfile }>(['public-profile', targetUserId], (old) => {
        if (!old) return old;
        return {
          ...old,
          profile: {
            ...old.profile,
            followStatus: {
              isFollowing: old.profile.followStatus?.isFollowing || false,
              hasPendingRequest: false,
              isFollower: old.profile.followStatus?.isFollower || false,
            }
          }
        };
      });

      return { previousProfile };
    },
    onError: (err, targetUserId, context) => {
      console.error('Cancel request error:', err);
      if (context?.previousProfile) {
        queryClient.setQueryData(['public-profile', targetUserId], context.previousProfile);
      }
      toast.error(err instanceof Error ? err.message : 'Failed to cancel request');
    },
    onSuccess: (data, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['public-profile', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['follow-status', targetUserId] });

      if (data.success) {
        toast.success('Request cancelled');
      }
    },
  });
}

// Accept a follow request
export function useAcceptFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<FollowActionResponse> => {
      const response = await fetch(`/api/follow-requests/${requestId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to accept request' }));
        throw new Error(error.error || 'Failed to accept request');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Refresh follow requests list
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });
      // Refresh user profile (followers count)
      queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      // Refresh feed since visibility may have changed
      queryClient.invalidateQueries({ queryKey: ['infinite-reviews'] });

      if (data.success) {
        toast.success('Follow request accepted');
      }
    },
    onError: (err) => {
      console.error('Accept request error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to accept request');
    },
  });
}

// Reject a follow request
export function useRejectFollowRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string): Promise<FollowActionResponse> => {
      const response = await fetch(`/api/follow-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to reject request' }));
        throw new Error(error.error || 'Failed to reject request');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Refresh follow requests list
      queryClient.invalidateQueries({ queryKey: ['follow-requests'] });

      if (data.success) {
        toast.success('Follow request rejected');
      }
    },
    onError: (err) => {
      console.error('Reject request error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to reject request');
    },
  });
}
