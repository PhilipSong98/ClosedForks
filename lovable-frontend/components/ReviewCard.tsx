
import React from 'react';
import { Star, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Review {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  restaurant: {
    name: string;
    address: string;
    cuisine: string;
    image?: string;
  };
  rating: number;
  dish: string;
  review: string;
  tip?: string;
  timestamp: string;
  likes: number;
}

interface ReviewCardProps {
  review: Review;
  onUserClick: (userId: string) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onUserClick }) => {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatTime = (timestamp: string) => {
    // Simple time formatting - you might want to use date-fns for better formatting
    return new Date(timestamp).toLocaleDateString();
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

  return (
    <div className="review-card-compact">
      {/* User Info */}
      <div className="flex items-center space-x-2 mb-3">
        <button 
          onClick={() => onUserClick(review.user.id)}
          className="avatar-clickable"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={review.user.avatar} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {getInitials(review.user.name)}
            </AvatarFallback>
          </Avatar>
        </button>
        
        <div className="flex-1 min-w-0">
          <button 
            onClick={() => onUserClick(review.user.id)}
            className="text-left hover:text-primary transition-colors"
          >
            <h3 className="font-medium text-sm text-foreground truncate">{review.user.name}</h3>
          </button>
          <p className="text-xs text-muted-foreground">{formatTime(review.timestamp)}</p>
        </div>
      </div>

      {/* Restaurant Cover & Info */}
      <div className="mb-3">
        <div className="relative w-full h-20 rounded-lg overflow-hidden mb-3">
          {review.restaurant.image ? (
            <>
              <img 
                src={review.restaurant.image} 
                alt={review.restaurant.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-2xl text-muted-foreground font-medium">
                {review.restaurant.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2">
            <h4 className="font-medium text-white mb-1 text-sm truncate drop-shadow-sm">{review.restaurant.name}</h4>
            <span className="text-xs bg-white/90 text-gray-900 px-2 py-0.5 rounded-full">
              {review.restaurant.cuisine}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {renderStars(review.rating)}
          <span className="text-xs font-medium text-foreground ml-1">{review.rating}/5</span>
        </div>
      </div>

      {/* Dish */}
      <div className="mb-2">
        <span className="text-xs font-medium text-primary">Dish: </span>
        <span className="text-xs text-foreground">{review.dish}</span>
      </div>

      {/* Review Text */}
      <p className="text-sm text-foreground leading-relaxed mb-3 line-clamp-3">{review.review}</p>

      {/* Tip */}
      {review.tip && (
        <div className="bg-accent/50 rounded-md p-2 mb-3">
          <span className="text-xs font-medium text-primary">💡 </span>
          <span className="text-xs text-foreground line-clamp-2">{review.tip}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-1 text-muted-foreground hover:text-primary transition-colors">
          <Heart className="w-3 h-3" />
          <span className="text-xs">{review.likes}</span>
        </button>
      </div>
    </div>
  );
};

export default ReviewCard;
