import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { FollowListResponse, FollowRequestsResponse, FollowStatus } from '@/types';

// Get followers list with infinite scroll
export function useFollowers(userId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['followers', userId],
    queryFn: async ({ pageParam }): Promise<FollowListResponse> => {
      const params = new URLSearchParams();
      if (pageParam?.created_at) {
        params.set('cursor_created_at', pageParam.created_at);
        params.set('cursor_id', pageParam.id);
      }
      params.set('limit', '20');

      const response = await fetch(`/api/users/${userId}/followers?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch followers');
      }
      return response.json();
    },
    initialPageParam: null as { created_at: string; id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || null,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get following list with infinite scroll
export function useFollowing(userId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['following', userId],
    queryFn: async ({ pageParam }): Promise<FollowListResponse> => {
      const params = new URLSearchParams();
      if (pageParam?.created_at) {
        params.set('cursor_created_at', pageParam.created_at);
        params.set('cursor_id', pageParam.id);
      }
      params.set('limit', '20');

      const response = await fetch(`/api/users/${userId}/following?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch following');
      }
      return response.json();
    },
    initialPageParam: null as { created_at: string; id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor || null,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get pending follow requests for current user
export function useFollowRequests(enabled = true) {
  return useQuery({
    queryKey: ['follow-requests'],
    queryFn: async (): Promise<FollowRequestsResponse> => {
      const response = await fetch('/api/follow-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch follow requests');
      }
      return response.json();
    },
    enabled,
    staleTime: 30 * 1000, // 30 seconds - refresh often for pending requests
  });
}

// Get follow status between current user and target
export function useFollowStatus(targetUserId: string, enabled = true) {
  return useQuery({
    queryKey: ['follow-status', targetUserId],
    queryFn: async (): Promise<FollowStatus> => {
      const response = await fetch(`/api/users/${targetUserId}/follow`);
      if (!response.ok) {
        throw new Error('Failed to fetch follow status');
      }
      return response.json();
    },
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}
