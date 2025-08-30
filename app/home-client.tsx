'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import Header from '@/components/layout/Header';
import SearchBar from '@/components/search/SearchBar';
import CuisineFilters from '@/components/filters/CuisineFilters';
import ReviewCard from '@/components/review/ReviewCard';
import TopRestaurantsCarousel from '@/components/restaurant/TopRestaurantsCarousel';
import ReviewComposer from '@/components/review/ReviewComposer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/lib/hooks/useAuth';
import { useReviews } from '@/lib/queries/reviews';
import { useTopRestaurants } from '@/lib/queries/restaurants';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { Review, Restaurant } from '@/types';

interface HomeClientProps {
  initialReviews?: Review[];
  initialTopRestaurants?: Restaurant[];
}

const HomeClient: React.FC<HomeClientProps> = ({ 
  initialReviews = [], 
  initialTopRestaurants = [] 
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [isReviewComposerOpen, setIsReviewComposerOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Use React Query with initial data from server
  const { data: reviews = initialReviews } = useReviews();
  const { data: topRestaurants = initialTopRestaurants } = useTopRestaurants(8);

  const handleRestaurantSelect = (restaurant: any) => {
    // SearchBar will handle navigation by default
  };

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

  const handleWriteReview = () => {
    setIsReviewComposerOpen(true);
  };

  const handleReviewSubmit = (success: boolean) => {
    if (success) {
      setIsReviewComposerOpen(false);
      // Optionally refresh the reviews list
      // We could use React Query's refetch here if needed
    }
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
              Discover Great Food with Friends
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find restaurant recommendations from your friends and family, 
              and share your own dining experiences.
            </p>
          </div>
          
          <SearchBar onRestaurantSelect={handleRestaurantSelect} />
        </section>

        {/* Top Restaurants Carousel */}
        {topRestaurants.length > 0 && (
          <TopRestaurantsCarousel 
            restaurants={topRestaurants}
          />
        )}

        {/* Reviews Section */}
        <section>
          <CuisineFilters 
            selectedCuisines={selectedCuisines}
            onCuisineToggle={handleCuisineToggle}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {filteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReviews.map((review) => (
                <ReviewCard 
                  key={review.id}
                  review={review} 
                  onUserClick={handleUserClick}
                  showRestaurant={true}
                />
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
                    : 'Be the first to share a restaurant experience with your network!'
                  }
                </p>
                <Button onClick={handleWriteReview} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Write Your First Review
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Action Button (All Screen Sizes) */}
      <div className="fixed bottom-6 right-6 z-50 fab-safe-area">
        <Button 
          onClick={handleWriteReview}
          size="icon" 
          className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Write a review"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Review Composer Popup - Conditional Rendering */}
      {isMobile ? (
        <Sheet open={isReviewComposerOpen} onOpenChange={setIsReviewComposerOpen}>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="sr-only">Write a Review</SheetTitle>
              <SheetDescription className="sr-only">
                Share your dining experience and help others discover great food.
              </SheetDescription>
            </SheetHeader>
            <ReviewComposer 
              onClose={() => setIsReviewComposerOpen(false)}
              onSubmit={handleReviewSubmit}
            />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isReviewComposerOpen} onOpenChange={setIsReviewComposerOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Write a Review</DialogTitle>
            <DialogDescription className="sr-only">
              Share your dining experience and help others discover great food.
            </DialogDescription>
            <ReviewComposer 
              onClose={() => setIsReviewComposerOpen(false)}
              onSubmit={handleReviewSubmit}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default HomeClient;