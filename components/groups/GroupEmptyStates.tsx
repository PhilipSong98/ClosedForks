'use client';

import { Users, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  type: 'no-groups' | 'no-group-selected' | 'no-reviews';
  groupName?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function GroupEmptyState({ 
  type, 
  groupName, 
  onAction, 
  actionLabel 
}: EmptyStateProps) {
  const getEmptyStateConfig = () => {
    switch (type) {
      case 'no-groups':
        return {
          icon: Users,
          title: 'No Groups Yet',
          description: 'Join a group to start seeing reviews from your circle.',
          actionLabel: actionLabel || 'Join with Invite Code',
          showAction: !!onAction
        };
      case 'no-group-selected':
        return {
          icon: Users,
          title: 'Choose a Group',
          description: 'Select a group above to see reviews from that circle.',
          showAction: false
        };
      case 'no-reviews':
        return {
          icon: MessageCircle,
          title: `No Reviews Yet${groupName ? ` in ${groupName}` : ''}`,
          description: `Be the first to share a review${groupName ? ` in ${groupName}` : ''}!`,
          actionLabel: actionLabel || 'Write a Review',
          showAction: !!onAction
        };
      default:
        return {
          icon: Users,
          title: 'No Content',
          description: 'Nothing to show here.',
          showAction: false
        };
    }
  };

  const config = getEmptyStateConfig();
  const Icon = config.icon;

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Icon className="h-8 w-8 text-gray-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {config.title}
        </h3>
        <p className="text-gray-600 mb-6 max-w-sm">
          {config.description}
        </p>
        {config.showAction && onAction && (
          <Button 
            onClick={onAction}
            className="bg-gray-800 hover:bg-gray-900"
          >
            {config.actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Specialized empty state for the invite code flow
export function NoGroupsEmptyState({ 
  onJoinGroup 
}: { 
  onJoinGroup: () => void 
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <UserPlus className="h-10 w-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Welcome to DineCircle
          </h2>
          <p className="text-gray-600 mb-6">
            You&apos;re not part of any groups yet. Get an invite code from a friend or family member to join their dining circle.
          </p>
          <Button 
            onClick={onJoinGroup}
            className="w-full bg-gray-800 hover:bg-gray-900"
          >
            Join with Invite Code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}