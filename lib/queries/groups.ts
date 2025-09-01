import { useQuery } from '@tanstack/react-query';
import { Group, GroupWithDetails, GroupsResponse } from '@/types';

export function useUserGroups(options?: {
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: ['user-groups', options],
    queryFn: async (): Promise<Group[]> => {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());

      const response = await fetch(`/api/groups?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      const data: GroupsResponse = await response.json();
      return data.groups;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroup(groupId: string, includeMembers: boolean = false) {
  return useQuery({
    queryKey: ['group', groupId, { includeMembers }],
    queryFn: async (): Promise<GroupWithDetails> => {
      const params = new URLSearchParams();
      if (includeMembers) params.append('include_members', 'true');

      const response = await fetch(`/api/groups/${groupId}?${params}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Group not found');
        }
        throw new Error('Failed to fetch group details');
      }
      return response.json();
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useGroupReviews(groupId: string, options?: {
  limit?: number;
  page?: number;
}) {
  return useQuery({
    queryKey: ['reviews', { groupId, ...options }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('group_id', groupId);
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.page) params.append('page', options.page.toString());

      const response = await fetch(`/api/reviews?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group reviews');
      }
      const data = await response.json();
      return data.reviews || [];
    },
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}