'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useFollowers } from '@/lib/queries/follows';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from './FollowButton';
import { Loader2, Users } from 'lucide-react';

interface FollowersModalProps {
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

function getInitials(name: string): string {
  const cleaned = name?.trim() || '';
  if (!cleaned) return 'U';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function FollowersModal({ userId, isOpen, onOpenChange, currentUserId }: FollowersModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useFollowers(userId, isOpen);

  const followers = data?.pages.flatMap(page => page.users) || [];

  const Content = () => (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto">
      {isLoading ? (
        [...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))
      ) : followers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No followers yet</p>
        </div>
      ) : (
        <>
          {followers.map((follower) => (
            <div
              key={follower.follow_id}
              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Link
                href={`/profile/${follower.user_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={() => onOpenChange(false)}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={follower.user_avatar_url || undefined} alt={follower.user_name} />
                  <AvatarFallback className="bg-[var(--primary)] text-white">
                    {getInitials(follower.user_full_name || follower.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {follower.user_full_name || follower.user_name}
                  </p>
                  {follower.user_full_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{follower.user_name}
                    </p>
                  )}
                </div>
              </Link>
              {currentUserId && currentUserId !== follower.user_id && (
                <FollowButton
                  targetUserId={follower.user_id}
                  isFollowing={follower.is_following_back || false}
                  hasPendingRequest={false}
                  isFollower={true}
                  size="sm"
                />
              )}
            </div>
          ))}
          {hasNextPage && (
            <div className="pt-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="max-h-[85vh]">
          <SheetHeader>
            <SheetTitle>Followers</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <Content />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Followers</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
}

export default FollowersModal;
