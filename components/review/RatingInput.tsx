import React from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

const RatingInput: React.FC<RatingInputProps> = ({ 
  value, 
  onChange, 
  size = 'md',
  disabled = false
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          className={`transition-all duration-200 ${
            !disabled ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
          }`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              star <= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground hover:text-yellow-400'
            } ${disabled ? 'opacity-50' : ''}`}
          />
        </button>
      ))}
    </div>
  );
};

export default RatingInput;