'use client';

import React from 'react';
import Link from 'next/link';
import { useFollowRequests } from '@/lib/queries/follows';
import { useAcceptFollowRequest, useRejectFollowRequest } from '@/lib/mutations/follows';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Check, X, UserPlus, Loader2 } from 'lucide-react';
import { getInitials, formatTimeAgo } from '@/lib/utils';

export function FollowRequestsSection() {
  const { data, isLoading, error } = useFollowRequests();
  const acceptMutation = useAcceptFollowRequest();
  const rejectMutation = useRejectFollowRequest();

  const requests = data?.requests || [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">Follow Requests</h3>
          <Skeleton className="w-6 h-5 rounded-full" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="w-20 h-8" />
            <Skeleton className="w-20 h-8" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>Failed to load follow requests</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show section if no requests
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="w-5 h-5 text-[var(--primary)]" />
        <h3 className="font-semibold">Follow Requests</h3>
        <Badge variant="secondary" className="text-xs">
          {requests.length}
        </Badge>
      </div>

      <div className="space-y-2">
        {requests.map((request) => {
          const isAccepting = acceptMutation.isPending && acceptMutation.variables === request.request_id;
          const isRejecting = rejectMutation.isPending && rejectMutation.variables === request.request_id;
          const isProcessing = isAccepting || isRejecting;

          return (
            <div
              key={request.request_id}
              className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-slate-300 transition-colors"
            >
              <Link
                href={`/profile/${request.requester_id}`}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage
                    src={request.requester_avatar_url || undefined}
                    alt={request.requester_name}
                  />
                  <AvatarFallback className="bg-[var(--primary)] text-white">
                    {getInitials(request.requester_full_name || request.requester_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {request.requester_full_name || request.requester_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(request.requested_at)}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => acceptMutation.mutate(request.request_id)}
                  disabled={isProcessing}
                  className="min-w-[80px]"
                >
                  {isAccepting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectMutation.mutate(request.request_id)}
                  disabled={isProcessing}
                  className="min-w-[80px]"
                >
                  {isRejecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FollowRequestsSection;
