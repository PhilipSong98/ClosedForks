'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import EnhancedFilters, { FilterState } from '@/components/filters/EnhancedFilters';
import ReviewCard from '@/components/review/ReviewCard';
import { ReviewFeedSkeleton } from '@/components/ui/skeleton-loader';
import { useAuth } from '@/lib/hooks/useAuth';
import { useInfiniteReviews } from '@/lib/queries/reviews';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';

const HomeClient: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    minRating: 0,
    priceRange: [0, 1000],
    dateRange: 'all',
    recommendedOnly: false,
    sortBy: 'recent'
  });

  // Use infinite query for progressive loading
  // Only enable the query when user is authenticated
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteReviews({ 
    pageSize: 15,
    enabled: !!user && !authLoading
  });

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
  });

  // Fetch next page when intersection observer triggers
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all reviews from all pages
  const allReviews = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.reviews) || [];
  }, [data]);

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Filter and sort reviews
  const filteredReviews = allReviews
    .filter(review => {
      // Tag filter
      if (filters.tags.length > 0) {
        const reviewTags = review.tags || [];
        const hasTagMatch = filters.tags.some(tag => reviewTags.includes(tag));
        if (!hasTagMatch) return false;
      }

      // Rating filter
      if (filters.minRating > 0 && review.rating_overall < filters.minRating) {
        return false;
      }

      // Price range filter (if review has price data)
      if (review.price_per_person) {
        if (review.price_per_person < filters.priceRange[0] || 
            (filters.priceRange[1] < 1000 && review.price_per_person > filters.priceRange[1])) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const reviewDate = new Date(review.created_at);
        const now = new Date();
        const cutoffDate = new Date();
        
        switch (filters.dateRange) {
          case 'week':
            cutoffDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            cutoffDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            cutoffDate.setFullYear(now.getFullYear() - 1);
            break;
        }
        
        if (reviewDate < cutoffDate) {
          return false;
        }
      }

      // Recommended only filter
      if (filters.recommendedOnly && !review.recommend) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'rating':
          return b.rating_overall - a.rating_overall;
        case 'price_low':
          return (a.price_per_person || 0) - (b.price_per_person || 0);
        case 'price_high':
          return (b.price_per_person || 0) - (a.price_per_person || 0);
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  if (!user) {
    return null; // AuthWrapper will handle this
  }

  // Show loading skeleton when auth is loading or data is initially loading
  const hasPages = data?.pages ? data.pages.length > 0 : false;
  const showInitialLoading = authLoading || (isLoading && !hasPages);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Latest Reviews from Your Circle
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See what your friends and family are saying about their latest dining experiences.
            </p>
          </div>
        </section>

        {/* Reviews Section */}
        <section>
          {/* Show loading skeleton on initial load or auth loading */}
          {showInitialLoading ? (
            <>
              <div className="max-w-lg mx-auto mb-8">
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse" /> {/* Filters placeholder */}
              </div>
              <ReviewFeedSkeleton count={3} />
            </>
          ) : isError ? (
            <div className="max-w-lg mx-auto">
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Failed to load reviews
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {error?.message || 'Something went wrong while loading reviews.'}
                  </p>
                  <Button
                    onClick={() => refetch()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : allReviews.length === 0 ? (
            <div className="max-w-lg mx-auto">
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to share a dining experience with your circle.
                  </p>
                  <Button
                    onClick={() => router.push('/restaurants')}
                  >
                    Write a Review
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <EnhancedFilters 
                filters={filters}
                onFiltersChange={setFilters}
                reviewCount={allReviews.length}
                filteredCount={filteredReviews.length}
                showAllFilters={false}
                defaultExpanded={false}
              />

              {filteredReviews.length > 0 ? (
                <div className="max-w-lg mx-auto space-y-6">
                  {filteredReviews.map((review) => (
                    <div key={review.id} className="bg-card border border-border rounded-lg shadow-sm">
                      <ReviewCard 
                        review={review} 
                        onUserClick={handleUserClick}
                        showRestaurant={true}
                      />
                    </div>
                  ))}
                  
                  {/* Load more trigger and loading indicators */}
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading more reviews...</span>
                      </div>
                    ) : hasNextPage ? (
                      <Button
                        variant="ghost"
                        onClick={() => fetchNextPage()}
                        className="text-muted-foreground"
                      >
                        Load more reviews
                      </Button>
                    ) : allReviews.length > 0 ? (
                      <p className="text-muted-foreground text-center">
                        You&apos;ve reached the end of your feed
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="max-w-lg mx-auto">
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        No reviews match your filters
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        Try adjusting your filters to see more results.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default HomeClient;