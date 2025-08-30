'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Star, ExternalLink, Globe } from 'lucide-react';
import Header from '@/components/layout/Header';
import ReviewCard from '@/components/review/ReviewCard';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/hooks/useAuth';
import { PRICE_LEVELS } from '@/constants';
import type { Restaurant, Review } from '@/types';

interface RestaurantDetailClientProps {
  restaurant: Restaurant | null;
  initialReviews: Review[];
}

export default function RestaurantDetailClient({ 
  restaurant, 
  initialReviews = [] 
}: RestaurantDetailClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };


  const avgRating = restaurant?.avg_rating || 0;
  const reviewCount = restaurant?.review_count || 0;
  const googleData = restaurant?.google_data as any;

  // Debug: Check if we have data
  console.log('Restaurant data:', restaurant);
  console.log('User data:', user);
  console.log('Reviews data:', reviews);

  if (!user) {
    return null; // AuthWrapper will handle this
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Restaurant not found</h1>
            <p className="text-muted-foreground">The restaurant you're looking for doesn't exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Restaurant Header */}
        <div className="mb-8">

          {/* Restaurant Info */}
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {restaurant?.name || 'Loading...'}
              </h1>
              
              <div className="flex items-center gap-1 text-muted-foreground mb-3">
                <MapPin className="h-4 w-4" />
                <span>{restaurant?.address}, {restaurant?.city}</span>
              </div>

              {/* Rating and Reviews */}
              <div className="flex items-center gap-4 mb-4">
                {avgRating > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-lg font-semibold">
                        {avgRating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No reviews yet</span>
                )}

                <span className="text-lg font-semibold">
                  {restaurant?.price_level ? PRICE_LEVELS[restaurant.price_level as keyof typeof PRICE_LEVELS] : ''}
                </span>
              </div>

              {/* Cuisine Tags */}
              {restaurant?.cuisine && restaurant.cuisine.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {restaurant.cuisine.map((cuisine) => (
                    <Badge key={cuisine} variant="secondary">
                      {cuisine}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Google Maps Link */}
              {restaurant?.google_maps_url && (
                <div className="flex items-center gap-4">
                  <a
                    href={restaurant.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Google Maps
                  </a>
                </div>
              )}

              {/* Additional Google Data */}
              {googleData?.rating && (
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Globe className="h-4 w-4" />
                    <span>Google: {googleData.rating}/5</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Reviews ({reviewCount})
            </h2>
          </div>

          {reviews.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-card border border-border rounded-lg shadow-sm">
                  <ReviewCard 
                    review={review} 
                    onUserClick={handleUserClick}
                    showRestaurant={false} // Don't show restaurant info since we're on the restaurant page
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No reviews yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Be the first to share your experience at {restaurant?.name || 'this restaurant'}!
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

    </div>
  );
}