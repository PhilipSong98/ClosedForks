import { useQuery } from '@tanstack/react-query';

interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  createdAt: string;
  usesRemaining: number;
  isActive: boolean;
}

export function useGroupInviteCodes(groupId: string, enabled = true) {
  return useQuery({
    queryKey: ['group-invite-codes', groupId],
    queryFn: async (): Promise<InviteCode[]> => {
      const response = await fetch(`/api/groups/${groupId}/invites`);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You must be signed in to view invite codes');
        }
        if (response.status === 403) {
          throw new Error('You are not authorized to view invite codes for this group');
        }
        throw new Error('Failed to fetch invite codes');
      }
      
      return response.json();
    },
    enabled: enabled && !!groupId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error.message.includes('not authorized') || error.message.includes('signed in')) {
        return false;
      }
      return failureCount < 3;
    },
  });
}