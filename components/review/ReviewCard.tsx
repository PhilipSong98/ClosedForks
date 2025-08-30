'use client'

import React from 'react';
import Link from 'next/link';
import { Star, Heart, MapPin } from 'lucide-react';
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

  // Handle both old and new API response structures
  const restaurant = review.restaurant || review.restaurants;
  const author = review.author || review.users;

  const restaurantImage = restaurant?.google_data?.photos?.[0] 
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${restaurant.google_data.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}`
    : null;

  const handleUserClick = () => {
    if (onUserClick && author?.id) {
      onUserClick(author.id);
    }
  };

  // Use new fields if available, fall back to legacy fields
  const rating = review.rating_overall || 5;
  const reviewText = review.review || review.text || '';
  const dish = review.dish || 'Not specified';
  const tips = review.tips || '';

  return (
    <div className="review-card-compact">
      {/* User Info */}
      <div className="flex items-center space-x-2 mb-3">
        <button 
          onClick={handleUserClick}
          className="avatar-clickable"
          disabled={!onUserClick}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={author?.avatar_url} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {getInitials(author?.name || author?.email || 'U')}
            </AvatarFallback>
          </Avatar>
        </button>
        
        <div className="flex-1 min-w-0">
          <button 
            onClick={handleUserClick}
            className="text-left hover:text-primary transition-colors"
            disabled={!onUserClick}
          >
            <h3 className="font-medium text-sm text-foreground truncate">
              {author?.name || author?.email}
            </h3>
          </button>
          <p className="text-xs text-muted-foreground">{formatTime(review.created_at)}</p>
        </div>
      </div>

      {/* Restaurant Cover & Info */}
      {showRestaurant && restaurant && (
        <div className="mb-3">
          <Link 
            href={`/restaurants/${restaurant.id}`}
            className="block group"
          >
            <div className="relative w-full h-20 rounded-lg overflow-hidden mb-3">
              {restaurantImage ? (
                <>
                  <img 
                    src={restaurantImage} 
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
                <h4 className="font-medium text-white mb-1 text-sm truncate drop-shadow-sm">
                  {restaurant.name}
                </h4>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3 text-white/90" />
                  <span className="text-xs text-white/90 truncate">
                    {restaurant.address}
                  </span>
                </div>
              </div>
            </div>
          </Link>
          
          <div className="flex items-center space-x-1 mb-2">
            {renderStars(rating)}
            <span className="text-xs font-medium text-foreground ml-1">{rating}/5</span>
          </div>
        </div>
      )}

      {/* Dish */}
      <div className="mb-2">
        <span className="text-xs font-medium text-primary">Dish: </span>
        <span className="text-xs text-foreground">{dish}</span>
      </div>

      {/* Review Text */}
      <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-3">{reviewText}</p>

      {/* Tip */}
      {tips && (
        <div className="bg-accent/50 rounded-md p-2 mb-3">
          <span className="text-xs font-medium text-primary">💡 </span>
          <span className="text-xs text-foreground line-clamp-2">{tips}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-3 h-3" />
          <span className="text-xs">0</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;