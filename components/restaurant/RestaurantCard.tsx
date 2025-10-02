'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PRICE_LEVELS } from '@/constants';
import { getRestaurantPhotoUrl } from '@/lib/utils';
import { ToEatButton } from './ToEatButton';
import type { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
  showToEatButton?: boolean;
  priority?: boolean;
}

export function RestaurantCard({ restaurant, showToEatButton = true, priority = false }: RestaurantCardProps) {
  const avgRating = restaurant.avg_rating ?? 0;
  const reviewCount = restaurant.review_count ?? 0;
  const photoUrl = getRestaurantPhotoUrl(restaurant, 400);

  return (
    <div className="relative group">
      <Link href={`/restaurants/${restaurant.id}`}>
        <div className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden rounded-lg bg-card border-0 shadow-sm">
          {/* Cover Image */}
          {photoUrl ? (
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image
                src={photoUrl}
                alt={`${restaurant.name} cover photo`}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={priority}
                loading={priority ? undefined : "lazy"}
              />
            </div>
          ) : (
            <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-gray-500" />
                </div>
                <span className="text-xs">No photo</span>
              </div>
            </div>
          )}

          <div className="p-3 space-y-1">
            {/* Restaurant Name */}
            <h3 className="font-semibold text-base line-clamp-1">
              {restaurant.name}
            </h3>

            {/* Location */}
            <div className="flex items-center text-sm text-muted-foreground gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{restaurant.address}, {restaurant.city}</span>
            </div>

            {/* Rating and Price */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                {reviewCount > 0 && avgRating > 0 && (
                  <>
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                  </>
                )}
                {reviewCount === 0 && (
                  <span className="text-xs text-muted-foreground">No reviews yet</span>
                )}
              </div>

              <span className="text-sm font-medium">
                {PRICE_LEVELS[restaurant.price_level as keyof typeof PRICE_LEVELS]}
              </span>
            </div>

            {/* Popular Tags */}
            {restaurant.aggregated_tags && restaurant.aggregated_tags.length > 0 && (
              <div className="pt-1">
                <div className="text-xs text-muted-foreground">Popular:</div>
                <div className="flex gap-1 mt-0.5">
                  <Badge variant="outline" className="text-xs px-2 py-0">
                    {restaurant.aggregated_tags[0]}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>
    
    {/* To-Eat Button Overlay - Airbnb style */}
    {showToEatButton && (
      <div className="absolute top-2 right-2">
        <ToEatButton
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          variant="outline"
          size="icon"
          showText={false}
          className="bg-white/95 backdrop-blur-sm border-0 hover:bg-white shadow-md hover:shadow-lg transition-all hover:scale-105"
        />
      </div>
    )}
  </div>
  );
}

export const MemoizedRestaurantCard = memo(RestaurantCard);