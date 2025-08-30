'use client';

import Link from 'next/link';
import { MapPin, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRICE_LEVELS } from '@/constants';
import type { Restaurant } from '@/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const avgRating = restaurant.avg_rating || 0;
  const reviewCount = restaurant.review_count || 0;

  return (
    <Link href={`/restaurants/${restaurant.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg line-clamp-1">
                {restaurant.name}
              </h3>
              <div className="flex items-center text-sm text-gray-600 gap-1">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{restaurant.address}, {restaurant.city}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {avgRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {avgRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
                {avgRating === 0 && (
                  <span className="text-sm text-gray-500">No reviews yet</span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {PRICE_LEVELS[restaurant.price_level as keyof typeof PRICE_LEVELS]}
                </span>
              </div>
            </div>

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
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}