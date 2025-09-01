import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface InviteCode {
  id: string;
  code: string;
  maxUses: number;
  currentUses: number;
  expiresAt: string;
  createdAt: string;
  usesRemaining: number;
}

interface GenerateInviteCodeResponse {
  success: boolean;
  inviteCode: InviteCode;
  message: string;
}

export function useGenerateInviteCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (groupId: string): Promise<InviteCode> => {
      const response = await fetch(`/api/groups/${groupId}/invite-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate invite code');
      }

      const data: GenerateInviteCodeResponse = await response.json();
      return data.inviteCode;
    },
    onSuccess: (data, groupId) => {
      // Optionally invalidate any invite code related queries if they exist
      // For now, we don't have any cached invite code data to invalidate
      console.log('Invite code generated successfully for group:', groupId);
    },
    onError: (error) => {
      console.error('Failed to generate invite code:', error);
    },
  });
}