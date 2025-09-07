import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useRevokeInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const response = await fetch(`/api/invites/${inviteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be signed in to revoke invite codes');
        }
        if (response.status === 403) {
          throw new Error('You are not authorized to revoke this invite code');
        }
        if (response.status === 404) {
          throw new Error('Invite code not found');
        }
        throw new Error('Failed to revoke invite code');
      }

      return response.json();
    },
    onSuccess: (_, inviteId) => {
      // Invalidate all group invite codes queries since we don't know which group this belongs to
      queryClient.invalidateQueries({
        queryKey: ['group-invite-codes'],
      });
      
      // Also invalidate the general invite codes query if it exists
      queryClient.invalidateQueries({
        queryKey: ['invite-codes'],
      });
    },
    onError: (error) => {
      console.error('Error revoking invite code:', error);
    },
  });
}