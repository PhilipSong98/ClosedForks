'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUserReviews } from '@/lib/queries/profile';
import ReviewCard from '@/components/review/ReviewCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RecentReviewsProps {
  userId: string;
  title?: string;
}

const RecentReviews: React.FC<RecentReviewsProps> = ({ userId, title = 'Your Reviews' }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  
  const { data, isLoading, error } = useUserReviews(userId, currentPage, pageSize);

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
        <p className="text-destructive mb-4">Failed to load reviews</p>
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
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No reviews yet
        </h3>
        <p className="text-muted-foreground mb-4">
          Start reviewing restaurants to build your dining history
        </p>
        <Button asChild>
          <Link href="/restaurants">Find Restaurants</Link>
        </Button>
      </div>
    );
  }

  const { reviews, pagination } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          {title}
        </h2>
        <span className="text-sm text-muted-foreground">
          {pagination.total} review{pagination.total !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border rounded-lg bg-card">
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
          
          <span className="text-sm text-muted-foreground px-4">
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

export default RecentReviews;
