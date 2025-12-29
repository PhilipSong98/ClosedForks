'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useFollowUser, useUnfollowUser, useCancelFollowRequest } from '@/lib/mutations/follows';
import { Loader2, UserPlus, UserMinus, Clock, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  hasPendingRequest: boolean;
  isFollower: boolean;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export function FollowButton({
  targetUserId,
  isFollowing,
  hasPendingRequest,
  isFollower,
  size = 'default',
  className = '',
}: FollowButtonProps) {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const cancelRequestMutation = useCancelFollowRequest();
  const [lastClickTime, setLastClickTime] = useState(0);

  const isLoading = followMutation.isPending || unfollowMutation.isPending || cancelRequestMutation.isPending;

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    // Debounce
    if (now - lastClickTime < 300 || isLoading) {
      return;
    }
    setLastClickTime(now);

    if (isFollowing) {
      unfollowMutation.mutate(targetUserId);
    } else if (hasPendingRequest) {
      cancelRequestMutation.mutate(targetUserId);
    } else {
      followMutation.mutate(targetUserId);
    }
  }, [
    targetUserId,
    isFollowing,
    hasPendingRequest,
    lastClickTime,
    isLoading,
    followMutation,
    unfollowMutation,
    cancelRequestMutation
  ]);

  // Determine button state
  let buttonText = 'Follow';
  let buttonVariant: 'default' | 'outline' | 'secondary' = 'default';
  let Icon = UserPlus;

  if (isFollowing) {
    buttonText = 'Following';
    buttonVariant = 'outline';
    Icon = UserCheck;
  } else if (hasPendingRequest) {
    buttonText = 'Requested';
    buttonVariant = 'secondary';
    Icon = Clock;
  } else if (isFollower) {
    buttonText = 'Follow Back';
    Icon = UserPlus;
  }

  return (
    <Button
      onClick={handleClick}
      variant={buttonVariant}
      size={size}
      disabled={isLoading}
      className={`min-w-[100px] ${className}`}
      aria-label={isFollowing ? 'Unfollow user' : hasPendingRequest ? 'Cancel follow request' : 'Follow user'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <Icon className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
}

export default FollowButton;
