import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateGroupRequest, UpdateGroupRequest } from '@/types';

interface JoinGroupRequest {
  code: string;
}

interface JoinGroupResponse {
  success: boolean;
  message?: string;
  groupId?: string;
  groupName?: string;
  error?: string;
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      groupId, 
      updates 
    }: { 
      groupId: string; 
      updates: UpdateGroupRequest; 
    }) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update group');
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      queryClient.invalidateQueries({ 
        queryKey: ['group', variables.groupId] 
      });
      
      // Optionally update the cache directly for immediate UI feedback
      queryClient.setQueryData(['group', variables.groupId], (oldData: unknown) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          ...data.group,
        };
      });

      // Update user groups cache if it exists
      queryClient.setQueryData(['user-groups'], (oldData: unknown) => {
        if (!oldData || !Array.isArray(oldData)) return oldData;
        return oldData.map((group: { id: string }) => 
          group.id === variables.groupId 
            ? { ...group, ...data.group }
            : group
        );
      });
    },
    onError: (error) => {
      console.error('Failed to update group:', error);
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGroupRequest) => {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create group');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch user groups to show the new group
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      
      console.log('Group created successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to create group:', error);
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: JoinGroupRequest): Promise<JoinGroupResponse> => {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Handle HTTP errors (401, 500, etc.)
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join group');
      }

      const result = await response.json();
      
      // Handle business logic errors (invalid code, etc.)
      if (!result.success) {
        throw new Error(result.error || 'Failed to join group');
      }

      return result;
    },
    onSuccess: (data) => {
      // Invalidate and refetch user groups to show the new group
      queryClient.invalidateQueries({ queryKey: ['user-groups'] });
      
      console.log('Successfully joined group:', data.groupName);
    },
    onError: () => {
      // Error is handled gracefully in the UI, no need to log to console
      // This prevents "Invalid invite code" from showing in browser console
    },
  });
}