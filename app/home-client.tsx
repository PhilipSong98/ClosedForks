'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import EnhancedFilters, { FilterState } from '@/components/filters/EnhancedFilters';
import ReviewCard from '@/components/review/ReviewCard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReviews } from '@/lib/queries/reviews';
import { Review } from '@/types';

interface HomeClientProps {
  initialReviews?: Review[];
}

const HomeClient: React.FC<HomeClientProps> = ({ 
  initialReviews = []
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    minRating: 0,
    priceRange: [0, 1000],
    dateRange: 'all',
    recommendedOnly: false,
    sortBy: 'recent'
  });

  // Fetch all user's reviews (already group-scoped by the API)
  const { data: reviews = initialReviews, isLoading: reviewsLoading } = useReviews();

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Filter and sort reviews
  const filteredReviews = reviews
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

  // Show loading state while fetching reviews
  if (reviewsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reviews...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          {reviews.length === 0 ? (
            <div className="max-w-lg mx-auto">
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No reviews yet
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Be the first to share a dining experience with your circle.
                  </p>
                  <button
                    onClick={() => router.push('/restaurants')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <EnhancedFilters 
                filters={filters}
                onFiltersChange={setFilters}
                reviewCount={reviews.length}
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