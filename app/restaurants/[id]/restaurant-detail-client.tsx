'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Star, ExternalLink, Globe, Phone, Clock, DollarSign } from 'lucide-react';
import Header from '@/components/layout/Header';
import ReviewCard from '@/components/review/ReviewCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StarRating } from '@/components/ui/StarRating';
import { useAuth } from '@/lib/hooks/useAuth';
import { PRICE_LEVELS } from '@/constants';
import type { Restaurant, Review, GooglePlaceData } from '@/types';

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
  const [reviews, _setReviews] = useState<Review[]>(initialReviews);

  const handleUserClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  // Calculate average rating from private reviews
  const privateReviews = reviews.filter(review => review.rating_overall);
  const privateAvgRating = privateReviews.length > 0 
    ? privateReviews.reduce((sum, review) => sum + review.rating_overall, 0) / privateReviews.length 
    : 0;
  const privateReviewCount = privateReviews.length;

  const googleData = restaurant?.google_data as GooglePlaceData | undefined;

  // Debug: Check if we have data
  console.log('Restaurant data:', restaurant);
  console.log('User data:', user);
  console.log('Reviews data:', reviews);
  console.log('Private reviews:', privateReviews);
  console.log('Private average rating:', privateAvgRating);
  console.log('Private review count:', privateReviewCount);

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
            <p className="text-muted-foreground">The restaurant you&apos;re looking for doesn&apos;t exist.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Restaurant Info Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {restaurant?.name || 'Loading...'}
                </CardTitle>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{restaurant?.address}, {restaurant?.city}</span>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Rating Section */}
                <div className="space-y-4">
                  {/* Private Network Rating */}
                  {privateAvgRating > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <StarRating rating={privateAvgRating} size="lg" showNumber />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Based on {privateReviewCount} review{privateReviewCount !== 1 ? 's' : ''} from your network
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <StarRating rating={0} size="md" />
                      </div>
                      <p className="text-sm text-muted-foreground">No reviews from your network yet</p>
                    </div>
                  )}
                  
                  {/* Google Rating */}
                  {googleData?.rating && (
                    <div className="pt-3 border-t">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">Google Rating</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <StarRating rating={googleData.rating} size="md" showNumber />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Based on {googleData.user_ratings_total?.toLocaleString()} Google reviews
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Restaurant Details */}
                <div className="space-y-3">
                  {/* Price Level */}
                  {restaurant?.price_level && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {PRICE_LEVELS[restaurant.price_level as keyof typeof PRICE_LEVELS]}
                      </span>
                    </div>
                  )}
                  
                  {/* Phone */}
                  {restaurant?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`tel:${restaurant.phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {restaurant.phone}
                      </a>
                    </div>
                  )}
                  
                  {/* Opening Hours */}
                  {googleData?.opening_hours?.open_now !== undefined && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm font-medium ${
                        googleData.opening_hours.open_now ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {googleData.opening_hours.open_now ? 'Open now' : 'Closed'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cuisine Tags */}
                {restaurant?.cuisine && restaurant.cuisine.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Cuisine</h4>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.cuisine.map((cuisine) => (
                        <Badge key={cuisine} variant="secondary" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-4 border-t">
                  {/* Website */}
                  {restaurant?.website_url && (
                    <a
                      href={restaurant.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full p-2 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Website
                    </a>
                  )}
                  
                  {/* Google Maps */}
                  {(restaurant?.google_maps_url || (restaurant?.lat && restaurant?.lng)) && (
                    <a
                      href={restaurant.google_maps_url || `https://www.google.com/maps?q=${restaurant.lat},${restaurant.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 w-full p-2 text-sm text-primary hover:bg-primary/5 rounded-md transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View on Google Maps
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reviews Grid */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Reviews
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {privateReviewCount} review{privateReviewCount !== 1 ? 's' : ''} from your network
              </p>
            </div>

            {reviews.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-1 xl:grid-cols-2">
                {reviews.map((review) => (
                  <Card key={review.id} className="overflow-hidden">
                    <ReviewCard 
                      review={review} 
                      onUserClick={handleUserClick}
                      showRestaurant={false}
                    />
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Be the first to share your experience at {restaurant?.name || 'this restaurant'}!
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}