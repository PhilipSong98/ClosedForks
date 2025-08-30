'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({ 
  rating, 
  size = 'md', 
  showNumber = false,
  interactive = false,
  onChange 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= rating;
          const halfFilled = star - 0.5 <= rating && star > rating;
          
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              disabled={!interactive}
              className={`relative ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            >
              <Star 
                className={`${sizeClasses[size]} ${
                  filled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : halfFilled
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
              {halfFilled && (
                <div className="absolute inset-0 overflow-hidden w-1/2">
                  <Star className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`} />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-sm font-medium ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}