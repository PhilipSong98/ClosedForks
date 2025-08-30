import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, MapPin } from 'lucide-react';
import { type Restaurant } from '@/data/mock';

interface TopRestaurantsCarouselProps {
  restaurants: Restaurant[];
  onRestaurantClick: (restaurant: Restaurant) => void;
}

const TopRestaurantsCarousel: React.FC<TopRestaurantsCarouselProps> = ({ 
  restaurants, 
  onRestaurantClick 
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-3 h-3 ${
          i < Math.floor(rating) 
            ? 'fill-yellow-400 text-yellow-400' 
            : 'text-gray-300'
        }`} 
      />
    ));
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Top picks from your circle
      </h2>
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {restaurants.map((restaurant) => (
          <Card 
            key={restaurant.id}
            className="flex-shrink-0 w-64 cursor-pointer hover:shadow-md transition-all duration-300 hover:scale-105"
            onClick={() => onRestaurantClick(restaurant)}
          >
            <CardContent className="p-0">
              <div className="relative w-full h-32 overflow-hidden">
                {restaurant.image ? (
                  <>
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-2xl text-muted-foreground font-medium">
                      {restaurant.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="font-medium text-white mb-1 truncate drop-shadow-sm">
                    {restaurant.name}
                  </h3>
                  <span className="text-xs bg-white/90 text-gray-900 px-2 py-0.5 rounded-full">
                    {restaurant.cuisine}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-1 mb-2">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground truncate">
                    {restaurant.address}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {renderStars(restaurant.averageRating)}
                    <span className="text-xs text-foreground ml-1">
                      {restaurant.averageRating}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {restaurant.reviewCount} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TopRestaurantsCarousel;