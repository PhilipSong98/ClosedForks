import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateGroupRequest } from '@/types';

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