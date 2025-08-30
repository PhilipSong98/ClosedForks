import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ReviewCard from '@/components/ReviewCard';
import ReviewComposer from '@/components/ReviewComposer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { mockReviews, topRestaurants, circleUserIds, type Restaurant, type Review } from '@/data/mock';
import { slugify } from '@/lib/utils';

const RestaurantPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');
  const [isReviewComposerOpen, setIsReviewComposerOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Find restaurant by slug
  const restaurant = topRestaurants.find(r => slugify(r.name) === slug);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Restaurant not found</h1>
          <p className="text-muted-foreground mb-4">The restaurant you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  // Filter reviews for this restaurant from circle users only
  const restaurantReviews = mockReviews.filter(review => 
    review.restaurant.name === restaurant.name && 
    circleUserIds.includes(review.user.id)
  );

  // Sort reviews
  const sortedReviews = [...restaurantReviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return b.rating - a.rating;
    }
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`} 
      />
    ));
  };

  const handleUserClick = (userId: string) => {
    // TODO: Navigate to user profile or implement user detail view
    console.log('User clicked:', userId);
  };

  const handleReviewSubmit = (data: any) => {
    // Handle review submission
    setIsReviewComposerOpen(false);
    toast({
      title: "Review posted!",
      description: "Your review has been shared with your circle.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {restaurant.name}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.address}</span>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {restaurant.cuisine}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {renderStars(restaurant.averageRating)}
                  <span className="text-sm font-medium ml-1">
                    {restaurant.averageRating}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {restaurant.reviewCount} total reviews
                </span>
              </div>
              
              {/* Desktop Write Review Button */}
              <div className="hidden md:block">
                <Button 
                  onClick={() => setIsReviewComposerOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Write Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Restaurant Image */}
        {restaurant.image && (
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden mb-8">
            <img 
              src={restaurant.image} 
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Reviews Section */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Reviews from your circle
              <span className="text-muted-foreground font-normal ml-2">
                ({restaurantReviews.length})
              </span>
            </h2>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: 'recent' | 'rating') => setSortBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="rating">Best Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedReviews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedReviews.map((review) => (
                <ReviewCard 
                  key={review.id}
                  review={review} 
                  onUserClick={handleUserClick}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No reviews from your circle yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Be the first in your circle to share your experience at {restaurant.name}!
                </p>
                <Button onClick={() => setIsReviewComposerOpen(true)}>
                  Write a Review
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
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
              prefilledRestaurant={restaurant.name}
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
              prefilledRestaurant={restaurant.name}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default RestaurantPage;