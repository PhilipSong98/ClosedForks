'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Review } from '@/types';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG } from '@/constants';

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

  // Helper function to get tag category for styling
  const getTagCategory = (tag: string) => {
    for (const [category, tags] of Object.entries(REVIEW_TAGS)) {
      if ((tags as readonly string[]).includes(tag)) {
        return category as keyof typeof REVIEW_TAGS;
      }
    }
    return 'DISHES'; // fallback
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
    <div className="p-4">
      {/* User Info */}
      <div className="flex items-center space-x-3 mb-4">
        <button 
          onClick={handleUserClick}
          className="avatar-clickable"
          disabled={!onUserClick}
        >
          <Avatar className="w-10 h-10">
            <AvatarImage src={author?.avatar_url} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
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

      {/* Restaurant Image - Full Width */}
      {showRestaurant && restaurant && (
        <div className="mb-4 -mx-4">
          <Link 
            href={`/restaurants/${restaurant.id}`}
            className="block group"
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              {restaurantImage ? (
                <>
                  <Image 
                    src={restaurantImage} 
                    alt={restaurant.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </>
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-4xl text-muted-foreground font-medium">
                    {restaurant.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="font-semibold text-white mb-2 text-lg drop-shadow-sm">
                  {restaurant.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-white/90" />
                  <span className="text-sm text-white/90">
                    {restaurant.address}
                  </span>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Restaurant Info Below Image */}
          <div className="px-4 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {renderStars(rating)}
                <span className="text-sm font-medium text-foreground ml-1">{rating}/5</span>
              </div>
              <span className="text-sm font-medium text-primary">Dish: {dish}</span>
            </div>
          </div>
        </div>
      )}


      {/* Rating and Dish */}
      {!showRestaurant && (
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {renderStars(rating)}
              <span className="text-sm font-medium text-foreground ml-1">{rating}/5</span>
            </div>
            {dish && dish !== 'Not specified' && (
              <span className="text-sm font-medium text-primary">Dish: {dish}</span>
            )}
          </div>
        </div>
      )}

      {/* Review Text */}
      <div className="px-4 mb-4">
        <p className="text-sm text-foreground leading-relaxed mb-3">{reviewText}</p>
        
        {/* Tip - Inline Style */}
        {tips && (
          <p className="text-sm text-foreground">
            <span className="text-primary font-medium">💡 Pro tip: </span>
            <span className="italic">{tips}</span>
          </p>
        )}
      </div>

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="px-4 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {review.tags.map((tag, index) => {
              const category = getTagCategory(tag);
              const config = TAG_CATEGORY_CONFIG[category];
              return (
                <Badge
                  key={index}
                  className={`text-xs px-2.5 py-1 font-medium border ${config.color} transition-colors`}
                >
                  <span className="text-xs mr-1">{config.icon}</span>
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-2 flex items-center justify-between border-t border-border pt-3">
        <button className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-4 h-4" />
          <span className="text-sm">0</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;