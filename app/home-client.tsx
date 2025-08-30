'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import CuisineFilters from '@/components/filters/CuisineFilters';
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
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  // Use React Query with initial data from server
  const { data: reviews = initialReviews } = useReviews();


  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Filter and sort reviews
  const filteredReviews = reviews
    .filter(review => {
      if (selectedCuisines.length === 0) return true;
      return review.restaurant?.cuisine?.some(c => selectedCuisines.includes(c));
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.rating_overall - a.rating_overall;
      }
    });

  if (!user) {
    return null; // AuthWrapper will handle this
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Hero Section */}
        <section className="mb-12">
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
          <CuisineFilters 
            selectedCuisines={selectedCuisines}
            onCuisineToggle={handleCuisineToggle}
            sortBy={sortBy}
            onSortChange={setSortBy}
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
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {selectedCuisines.length > 0 
                    ? 'No reviews found for selected cuisines' 
                    : 'No reviews yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {selectedCuisines.length > 0
                    ? 'Try selecting different cuisine filters or clearing all filters.'
                    : 'Be the first to share a restaurant experience with your network! Visit the Restaurants page to discover new places to review.'
                  }
                </p>
              </div>
            </div>
          )}
        </section>
      </main>


    </div>
  );
};

export default HomeClient;