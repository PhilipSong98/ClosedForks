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
import { useFollowing } from '@/lib/queries/follows';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from './FollowButton';
import { Loader2, Users } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface FollowingModalProps {
  userId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string;
}

export function FollowingModal({ userId, isOpen, onOpenChange, currentUserId }: FollowingModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage
  } = useFollowing(userId, isOpen);

  const following = data?.pages.flatMap(page => page.users) || [];

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
      ) : following.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Not following anyone yet</p>
        </div>
      ) : (
        <>
          {following.map((user) => (
            <div
              key={user.follow_id}
              className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Link
                href={`/profile/${user.user_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={() => onOpenChange(false)}
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={user.user_avatar_url || undefined} alt={user.user_name} />
                  <AvatarFallback className="bg-[var(--primary)] text-white">
                    {getInitials(user.user_full_name || user.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {user.user_full_name || user.user_name}
                  </p>
                  {user.user_full_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      @{user.user_name}
                    </p>
                  )}
                </div>
              </Link>
              {currentUserId && currentUserId !== user.user_id && (
                <FollowButton
                  targetUserId={user.user_id}
                  isFollowing={user.is_followed_by_viewer || false}
                  hasPendingRequest={false}
                  isFollower={false}
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
            <SheetTitle>Following</SheetTitle>
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
          <DialogTitle>Following</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
}

export default FollowingModal;
