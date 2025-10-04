'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUserLikedReviews } from '@/lib/queries/profile';
import ReviewCard from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';

const LikedReviews: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  
  const { data, isLoading, error } = useUserLikedReviews(currentPage, pageSize);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg">
            <div className="p-4 space-y-4">
              <div className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-48 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Failed to load liked posts</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No liked posts yet
        </h3>
        <p className="text-muted-foreground mb-4">
          Start liking posts to see them here
        </p>
        <Button asChild>
          <Link href="/">Explore Feed</Link>
        </Button>
      </div>
    );
  }

  const { reviews, pagination } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Liked Posts
        </h2>
        <span className="text-sm text-slate-500">
          {pagination.total} post{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border border-slate-200/60 rounded-lg bg-white hover:shadow-sm transition-shadow">
            <ReviewCard
              review={review}
              showRestaurant={true}
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <span className="text-sm text-slate-500 px-4">
            Page {currentPage} of {pagination.totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
            disabled={currentPage === pagination.totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default LikedReviews;