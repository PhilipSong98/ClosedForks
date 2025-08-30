'use client'

import React from 'react';
import Link from 'next/link';
import { Star, Heart, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Review } from '@/types';

interface ReviewCardProps {
  review: Review;
  onUserClick?: (userId: string) => void;
  showRestaurant?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ 
  review, 
  onUserClick,
  showRestaurant = true 
}) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-primary text-primary' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const formatPriceLevel = (pricePerPerson?: number) => {
    if (!pricePerPerson) return null;
    if (pricePerPerson <= 200) return '$';
    if (pricePerPerson <= 500) return '$$';
    if (pricePerPerson <= 1000) return '$$$';
    return '$$$$';
  };

  const restaurantImage = review.restaurant?.google_data?.photos?.[0] 
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${review.restaurant.google_data.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`
    : null;

  const handleUserClick = () => {
    if (onUserClick && review.author?.id) {
      onUserClick(review.author.id);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4 hover:shadow-md transition-shadow duration-200">
      {/* User Info */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={handleUserClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          disabled={!onUserClick}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={review.author?.avatar_url} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {getInitials(review.author?.name || review.author?.email || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <h3 className="font-medium text-foreground">
              {review.author?.name || review.author?.email}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{formatTime(review.created_at)}</span>
            </div>
          </div>
        </button>
      </div>

      {/* Restaurant Info */}
      {showRestaurant && review.restaurant && (
        <Link 
          href={`/restaurants/${review.restaurant.id}`}
          className="block group"
        >
          <div className="space-y-3">
            {/* Restaurant Image */}
            {restaurantImage ? (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <img 
                  src={restaurantImage} 
                  alt={review.restaurant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h4 className="font-semibold text-white text-lg mb-1 truncate drop-shadow-sm">
                    {review.restaurant.name}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3 h-3 text-white/90" />
                    <span className="text-sm text-white/90 truncate">
                      {review.restaurant.address}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-20 bg-muted rounded-lg flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                <div className="text-center">
                  <span className="text-2xl font-medium text-muted-foreground">
                    {review.restaurant.name.charAt(0)}
                  </span>
                  <div className="text-sm font-medium text-foreground mt-1">
                    {review.restaurant.name}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center mt-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    {review.restaurant.city}
                  </div>
                </div>
              </div>
            )}

            {/* Cuisine Tags */}
            <div className="flex flex-wrap gap-1">
              {review.restaurant.cuisine?.map((cuisine, index) => (
                <span 
                  key={index}
                  className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full"
                >
                  {cuisine}
                </span>
              ))}
            </div>
          </div>
        </Link>
      )}

      {/* Rating */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {renderStars(review.rating_overall)}
          </div>
          <span className="text-sm font-medium text-foreground">
            {review.rating_overall}/5
          </span>
        </div>
        
        {/* Sub-ratings */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>Food: {review.food}/5</div>
          <div>Service: {review.service}/5</div>
          <div>Vibe: {review.vibe}/5</div>
          <div>Value: {review.value}/5</div>
        </div>
      </div>

      {/* Review Text */}
      {review.text && (
        <p className="text-sm text-foreground leading-relaxed line-clamp-4">
          {review.text}
        </p>
      )}

      {/* Price and Visit Info */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          {review.price_per_person && (
            <div className="flex items-center space-x-1">
              <DollarSign className="w-3 h-3" />
              <span>{formatPriceLevel(review.price_per_person)}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span>
              {new Date(review.visit_date).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Like button placeholder - can be implemented later */}
        <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-sm">0</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;