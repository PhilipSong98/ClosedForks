
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import CuisineFilters from '@/components/CuisineFilters';
import ReviewCard from '@/components/ReviewCard';
import ProfilePage from '@/components/ProfilePage';
import TopRestaurantsCarousel from '@/components/TopRestaurantsCarousel';
import ReviewComposer from '@/components/ReviewComposer';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { slugify } from '@/lib/utils';
import { 
  currentUser, 
  mockUsers, 
  mockReviews as initialMockReviews, 
  topRestaurants,
  circleUserIds,
  type Restaurant,
  type User,
  type Review
} from '@/data/mock';

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<'home' | 'profile'>('home');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [reviews, setReviews] = useState(initialMockReviews);
  const [isReviewComposerOpen, setIsReviewComposerOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    const slug = slugify(restaurant.name);
    navigate(`/restaurants/${slug}`);
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };

  const handleUserClick = (userId: string) => {
    setCurrentUserId(userId);
    setCurrentView('profile');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentUserId(null);
  };

  const handleReviewSubmit = (data: any) => {
    const newReview: Review = {
      id: Date.now().toString(),
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatar: currentUser.avatar
      },
      restaurant: {
        name: data.restaurant,
        address: 'Address not provided',
        cuisine: 'Various',
        image: undefined
      },
      rating: data.rating,
      dish: data.dish,
      review: data.review,
      tip: data.tips,
      timestamp: new Date().toISOString(),
      likes: 0
    };

    setReviews(prev => [newReview, ...prev]);
    setIsReviewComposerOpen(false);
    toast({
      title: "Review posted!",
      description: "Your review has been shared with your circle.",
    });
  };

  // Filter by circle (friends/family only), then by cuisine, then sort
  const filteredReviews = reviews
    .filter(review => circleUserIds.includes(review.user.id)) // Circle only
    .filter(review => selectedCuisines.length === 0 || selectedCuisines.includes(review.restaurant.cuisine))
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } else {
        return b.rating - a.rating;
      }
    });

  if (currentView === 'profile' && currentUserId) {
    const profileUser = mockUsers[currentUserId];
    const userReviews = reviews.filter(review => review.user.id === currentUserId);
    
    return (
      <ProfilePage
        user={profileUser}
        reviews={userReviews}
        onBack={handleBackToHome}
        onUserClick={handleUserClick}
        isOwnProfile={currentUserId === currentUser.id}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        onProfileClick={() => handleUserClick(currentUser.id)}
        onHomeClick={handleBackToHome}
        currentUser={currentUser}
      />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Search Section */}
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
          
          {/* Desktop Write Review Button */}
          <div className="hidden md:flex justify-center mt-6">
            <Button 
              onClick={() => setIsReviewComposerOpen(true)}
              size="lg"
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Write Review
            </Button>
          </div>
        </section>

        {/* Top Restaurants Carousel */}
        <TopRestaurantsCarousel 
          restaurants={topRestaurants}
          onRestaurantClick={handleRestaurantSelect}
        />

        {/* Reviews Section */}
        <section>
          <CuisineFilters 
            selectedCuisines={selectedCuisines}
            onCuisineToggle={handleCuisineToggle}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {filteredReviews.length > 0 ? (
            <div className="masonry-grid">
              {filteredReviews.map((review) => (
                <div key={review.id} className="masonry-item">
                  <ReviewCard 
                    review={review} 
                    onUserClick={handleUserClick}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No reviews found for the selected cuisines.
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Floating Action Button */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 fab-safe-area">
        <Sheet open={isReviewComposerOpen} onOpenChange={setIsReviewComposerOpen}>
          <SheetTrigger asChild>
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              aria-label="Write a review"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
            <ReviewComposer 
              onClose={() => setIsReviewComposerOpen(false)}
              onSubmit={handleReviewSubmit}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Dialog */}
      <div className="hidden md:block">
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
      </div>
    </div>
  );
};

export default Index;
