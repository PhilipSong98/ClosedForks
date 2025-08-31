'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRICE_LEVELS } from '@/constants';
import { getRestaurantPhotoUrl } from '@/lib/utils';
import { ToEatButton } from './ToEatButton';
import type { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  showToEatButton?: boolean;
}

export function RestaurantCard({ restaurant, showToEatButton = true }: RestaurantCardProps) {
  const avgRating = restaurant.avg_rating ?? 0;
  const reviewCount = restaurant.review_count ?? 0;
  const photoUrl = getRestaurantPhotoUrl(restaurant, 400);

  return (
    <div className="relative group">
      <Link href={`/restaurants/${restaurant.id}`}>
        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
          <CardContent className="p-0">
            {/* Cover Image */}
            {photoUrl && (
              <div className="relative w-full h-48 overflow-hidden">
                <Image
                  src={photoUrl}
                  alt={`${restaurant.name} cover photo`}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            )}
          
          <div className="p-4 space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg line-clamp-1">
                {restaurant.name}
              </h3>
              <div className="flex items-center text-sm text-muted-foreground gap-1">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{restaurant.address}, {restaurant.city}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {reviewCount > 0 && avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
                {reviewCount === 0 && (
                  <span className="text-sm text-muted-foreground">No reviews yet</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {PRICE_LEVELS[restaurant.price_level as keyof typeof PRICE_LEVELS]}
                </span>
              </div>
            </div>

            {/* Cuisine Categories */}
            {restaurant.cuisine.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {restaurant.cuisine.slice(0, 3).map((cuisine) => (
                  <Badge key={cuisine} variant="secondary" className="text-xs">
                    {cuisine}
                  </Badge>
                ))}
                {restaurant.cuisine.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{restaurant.cuisine.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Aggregated Tags from Reviews */}
            {restaurant.aggregated_tags && restaurant.aggregated_tags.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground font-medium">Popular:</div>
                <div className="flex flex-wrap gap-1">
                  {restaurant.aggregated_tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {restaurant.aggregated_tags.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{restaurant.aggregated_tags.length - 4}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
    
    {/* To-Eat Button Overlay */}
    {showToEatButton && (
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ToEatButton
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          variant="outline"
          size="icon"
          showText={false}
          className="bg-white/90 backdrop-blur-sm border-white/20 hover:bg-white shadow-lg"
        />
      </div>
    )}
  </div>
  );
}