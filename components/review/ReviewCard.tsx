'use client'

import React, { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Review, DishRating } from '@/types';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG } from '@/constants';
import { ToEatButton } from '@/components/restaurant/ToEatButton';
import LikeButton from '@/components/ui/LikeButton';
import { Separator } from '@/components/ui/separator';
import { getInitials, formatTimeAgo } from '@/lib/utils';

interface ReviewCardProps {
  review: Review;
  onUserClick?: (userId: string) => void;
  showRestaurant?: boolean;
  priority?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  onUserClick,
  showRestaurant = true,
  priority = false
}) => {
  const formatTime = (timestamp: string) => {
    try {
      return formatTimeAgo(new Date(timestamp), { addSuffix: true });
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

  // Removed old renderStars function - now using StarRating component

  // Handle both old and new API response structures
  const restaurant = review.restaurant || review.restaurants;
  const author = review.author || review.users;
  const legacyAuthorName = (review as unknown as { author_name?: string; author_full_name?: string }).author_name;
  const legacyAuthorFullName = (review as unknown as { author_full_name?: string }).author_full_name;
  const displayName =
    author?.full_name ||
    author?.name ||
    legacyAuthorFullName ||
    legacyAuthorName ||
    author?.email ||
    'Unknown reviewer';

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
  // Handle both empty values and temporary fallback values from API
  const reviewText = review.review && review.review !== 'Quick review - minimal input' ? (review.review || review.text || '') : '';
  const legacyDish = review.dish && review.dish !== 'Quick review' ? review.dish : '';
  const tips = review.tips || '';

  // Get dish ratings (new system) or fall back to legacy single dish
  const dishRatings: DishRating[] = review.dish_ratings || [];
  const hasDishRatings = dishRatings.length > 0;

  // Helper to render dish ratings inline
  const renderDishRatings = () => {
    if (hasDishRatings) {
      return (
        <div className="flex flex-wrap items-center gap-2">
          {dishRatings.map((dr, index) => (
            <span key={index} className="inline-flex items-center text-sm">
              <span className="font-medium text-foreground">{dr.dish_name}</span>
              <Star className="w-3 h-3 text-amber-400 fill-amber-400 mx-0.5" />
              <span className="text-amber-600 font-medium">{dr.rating.toFixed(1)}</span>
              {index < dishRatings.length - 1 && <span className="text-muted-foreground mx-1">•</span>}
            </span>
          ))}
        </div>
      );
    }
    // Fall back to legacy single dish display
    if (legacyDish) {
      return <span className="text-sm font-medium text-primary">Dish: {legacyDish}</span>;
    }
    return null;
  };

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
            <AvatarImage src={author?.avatar_url ?? undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
              {getInitials(displayName)}
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
              {displayName}
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
            <div className="relative w-full aspect-video overflow-hidden">
              {restaurantImage ? (
                <>
                  <Image
                    src={restaurantImage}
                    alt={restaurant.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                    loading={priority ? undefined : "lazy"}
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
              
              {/* To-Eat Button Overlay */}
              <div className="absolute top-3 right-3">
                <ToEatButton
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                  variant="outline"
                  size="icon"
                  showText={false}
                  className="bg-white/90 backdrop-blur-sm border-white/50 hover:bg-white shadow-lg"
                />
              </div>
              
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
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <StarRating rating={rating} size="sm" showNumber={true} />
              </div>
            </div>
            {/* Dish Ratings */}
            {(hasDishRatings || legacyDish) && (
              <div className="mt-2">
                {renderDishRatings()}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Rating and Dish */}
      {!showRestaurant && (
        <div className="px-4 mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <StarRating rating={rating} size="sm" showNumber={true} />
          </div>
          {/* Dish Ratings */}
          {(hasDishRatings || legacyDish) && (
            <div className="mt-2">
              {renderDishRatings()}
            </div>
          )}
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
      <div className="px-4">
        <Separator className="bg-border/60" />
      </div>

      <div className="px-4 pb-2 flex items-center justify-between pt-3">
        <LikeButton
          reviewId={review.id}
          isLiked={review.isLikedByUser || false}
          likeCount={review.like_count || 0}
          size="md"
        />
      </div>
    </div>
  );
};

export default memo(ReviewCard);
