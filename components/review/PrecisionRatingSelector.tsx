'use client';

import React, { useState } from 'react';
import { Star, Edit3, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PrecisionRatingSelectorProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const PrecisionRatingSelector: React.FC<PrecisionRatingSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  size = 'lg'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const sizeConfig = {
    sm: { star: 'h-6 w-6', text: 'text-lg' },
    md: { star: 'h-8 w-8', text: 'text-xl' },
    lg: { star: 'h-12 w-12', text: 'text-3xl' },
    xl: { star: 'h-16 w-16', text: 'text-4xl' }
  };

  const config = sizeConfig[size];

  // Get rating description
  const getRatingDescription = (rating: number) => {
    if (rating === 0) return 'No rating';
    if (rating >= 4.7) return 'Outstanding';
    if (rating >= 4.4) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.5) return 'Below Average';
    if (rating >= 2.0) return 'Poor';
    return 'Terrible';
  };

  // Star interaction handlers
  const handleStarClick = (event: React.MouseEvent, starIndex: number) => {
    if (disabled) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    // Calculate precise rating based on click position within the star
    const baseRating = starIndex + 1;
    const preciseRating = Math.max(1.0, Math.min(5.0, Math.round((starIndex + percentage) * 10) / 10));
    
    onChange(preciseRating);
  };

  const handleStarHover = (event: React.MouseEvent, starIndex: number) => {
    // Completely disable hover during dragging
    if (disabled || isDragging) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    const preciseRating = Math.max(1.0, Math.min(5.0, Math.round((starIndex + percentage) * 10) / 10));
    setHoverRating(preciseRating);
  };

  const handleStarLeave = () => {
    // Only clear hover if not dragging
    if (!isDragging) {
      setHoverRating(null);
    }
  };

  const handleContainerMouseMove = (event: React.MouseEvent) => {
    // Only handle hover during non-drag state
    if (disabled || isDragging) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const containerWidth = rect.width;
    const starWidth = containerWidth / 5;
    const starIndex = Math.floor(x / starWidth);
    const positionWithinStar = (x % starWidth) / starWidth;
    
    if (starIndex >= 0 && starIndex < 5) {
      const preciseRating = Math.max(1.0, Math.min(5.0, Math.round((starIndex + positionWithinStar) * 10) / 10));
      setHoverRating(preciseRating);
    }
  };

  const handleMouseDown = (event: React.MouseEvent, starIndex: number) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(true);
    handleStarClick(event, starIndex);
  };

  // Touch handler for mobile start
  const handleTouchStart = (event: React.TouchEvent, starIndex: number) => {
    if (disabled) return;
    event.preventDefault();
    setIsDragging(true);
    const touch = event.touches[0];
    const rect = event.currentTarget.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    
    const preciseRating = Math.max(1.0, Math.min(5.0, Math.round((starIndex + percentage) * 10) / 10));
    onChange(preciseRating);
  };

  // Number input handlers
  const handleEditStart = () => {
    if (disabled) return;
    setIsEditing(true);
    setTempValue(value.toFixed(1));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const handleEditComplete = () => {
    const numValue = parseFloat(tempValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(1.0, Math.min(5.0, Math.round(numValue * 10) / 10));
      onChange(clampedValue);
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempValue(value.toFixed(1));
    }
  };

  // Increment/decrement handlers
  const handleIncrement = () => {
    const newValue = Math.min(5.0, Math.round((value + 0.1) * 10) / 10);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(1.0, Math.round((value - 0.1) * 10) / 10);
    onChange(newValue);
  };

  // Global event handlers for smooth dragging
  React.useEffect(() => {
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (!isDragging || disabled) return;
      
      // Find the stars container to calculate position
      const starsContainer = document.querySelector('[data-stars-container]') as HTMLElement;
      if (!starsContainer) return;
      
      const rect = starsContainer.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const containerWidth = rect.width;
      const starWidth = containerWidth / 5;
      const starIndex = Math.floor(x / starWidth);
      const positionWithinStar = (x % starWidth) / starWidth;
      
      if (starIndex >= 0 && starIndex < 5) {
        const preciseRating = Math.max(1.0, Math.min(5.0, Math.round((starIndex + positionWithinStar) * 10) / 10));
        onChange(preciseRating);
        setHoverRating(preciseRating);
      }
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      // Clear hover rating when drag ends
      setHoverRating(null);
    };

    const handleGlobalTouchMove = (event: TouchEvent) => {
      if (!isDragging || disabled) return;
      event.preventDefault();
      
      const touch = event.touches[0];
      const starsContainer = document.querySelector('[data-stars-container]') as HTMLElement;
      if (!starsContainer) return;
      
      const rect = starsContainer.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const containerWidth = rect.width;
      const starWidth = containerWidth / 5;
      const starIndex = Math.floor(x / starWidth);
      const positionWithinStar = (x % starWidth) / starWidth;
      
      if (starIndex >= 0 && starIndex < 5) {
        const preciseRating = Math.max(1.0, Math.min(5.0, Math.round((starIndex + positionWithinStar) * 10) / 10));
        onChange(preciseRating);
        setHoverRating(preciseRating);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
      document.addEventListener('touchend', handleGlobalMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
        document.removeEventListener('touchend', handleGlobalMouseUp);
      };
    }
  }, [isDragging, disabled, onChange]);

  // Render interactive stars
  const renderInteractiveStars = () => {
    const displayRating = hoverRating || value;
    
    return (
      <div 
        className="flex items-center gap-1 select-none touch-none"
        data-stars-container
        onMouseMove={handleContainerMouseMove}
        onMouseLeave={handleStarLeave}
      >
        {[0, 1, 2, 3, 4].map((starIndex) => {
          const fillPercentage = Math.max(0, Math.min(100, (displayRating - starIndex) * 100));
          const isHovered = hoverRating !== null && starIndex < Math.ceil(hoverRating);
          
          return (
            <div 
              key={starIndex} 
              className="relative cursor-pointer touch-manipulation"
              onClick={(e) => handleStarClick(e, starIndex)}
              onMouseDown={(e) => handleMouseDown(e, starIndex)}
              onTouchStart={(e) => handleTouchStart(e, starIndex)}
            >
              {/* Background star */}
              <Star
                className={`${config.star} text-gray-200 transition-all duration-200 ${
                  isHovered ? 'scale-110' : 'scale-100'
                }`}
                fill="currentColor"
              />
              
              {/* Filled portion */}
              <div
                className="absolute inset-0 overflow-hidden transition-all duration-300 ease-out"
                style={{
                  clipPath: `inset(0 ${100 - fillPercentage}% 0 0)`,
                }}
              >
                <Star
                  className={`${config.star} text-amber-400 transition-all duration-200 ${
                    isHovered ? 'scale-110' : 'scale-100'
                  }`}
                  fill="currentColor"
                  style={{
                    filter: isHovered 
                      ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))' 
                      : 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Interactive Stars */}
      <div className="flex flex-col items-center">
        <div className="flex items-center justify-center py-4 px-4">
          {renderInteractiveStars()}
        </div>
        
        {/* Rating labels for reference */}
        <div className="flex justify-between text-xs text-muted-foreground mt-2 w-full max-w-xs px-2">
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
        </div>
      </div>

      {/* Rating display and input */}
      <div className="flex flex-col items-center space-y-3">
        <div className="flex items-center space-x-3">
          {/* Decrement button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDecrement}
            disabled={disabled || value <= 1.0}
            className="w-8 h-8 p-0 rounded-full"
          >
            <Minus className="w-3 h-3" />
          </Button>

          {/* Rating value - editable */}
          {isEditing ? (
            <Input
              type="number"
              value={tempValue}
              onChange={handleEditChange}
              onBlur={handleEditComplete}
              onKeyDown={handleEditKeyDown}
              min="1.0"
              max="5.0"
              step="0.1"
              className="w-20 text-center font-bold"
              autoFocus
            />
          ) : (
            <button
              onClick={handleEditStart}
              disabled={disabled}
              className={`${config.text} font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent hover:from-amber-700 hover:to-amber-600 transition-all duration-200 flex items-center gap-1 group`}
            >
              {value.toFixed(1)}
              <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          )}

          {/* Increment button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleIncrement}
            disabled={disabled || value >= 5.0}
            className="w-8 h-8 p-0 rounded-full"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Rating description */}
        <div className="text-center">
          <div className="text-lg font-semibold text-foreground">
            {getRatingDescription(value)}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-center text-muted-foreground max-w-sm">
          Click or drag across stars for precise rating • Click number to edit • Use +/- for fine-tuning
        </div>
      </div>
    </div>
  );
};

export default PrecisionRatingSelector;