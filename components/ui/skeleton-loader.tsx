'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ReviewCardSkeleton: React.FC = () => {
  return (
    <div className="bg-card border border-border rounded-lg shadow-sm">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-3 w-16" />
        </div>

        {/* Restaurant Info */}
        <div className="mb-4">
          <Skeleton className="h-5 w-48 mb-2" />
          <div className="flex items-center gap-1 mb-2">
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        {/* Image */}
        <Skeleton className="w-full h-64 rounded-lg mb-4" />

        {/* Review Content */}
        <div className="space-y-2 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

export const ReviewFeedSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="max-w-lg mx-auto space-y-6">
      {Array.from({ length: count }).map((_, index) => (
        <ReviewCardSkeleton key={index} />
      ))}
    </div>
  );
};