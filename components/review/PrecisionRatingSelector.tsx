'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeConfig = {
    sm: { star: 'h-6 w-6', container: 'gap-1', text: 'text-lg' },
    md: { star: 'h-8 w-8', container: 'gap-1.5', text: 'text-xl' },
    lg: { star: 'h-12 w-12', container: 'gap-2', text: 'text-3xl' },
    xl: { star: 'h-16 w-16', container: 'gap-3', text: 'text-4xl' }
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

  // Calculate rating from position
  const calculateRatingFromPosition = useCallback((clientX: number) => {
    if (!containerRef.current) return value;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    
    // Map percentage to 1.0-5.0 range with 0.1 precision
    const rawRating = percentage * 4 + 1; // 1.0 to 5.0
    const roundedRating = Math.round(rawRating * 10) / 10; // Round to nearest 0.1
    
    return Math.max(1.0, Math.min(5.0, roundedRating));
  }, [value]);

  // Mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    const newRating = calculateRatingFromPosition(e.clientX);
    onChange(newRating);
  }, [calculateRatingFromPosition, onChange, disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;
    
    const newRating = calculateRatingFromPosition(e.clientX);
    onChange(newRating);
  }, [isDragging, calculateRatingFromPosition, onChange, disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    const newRating = calculateRatingFromPosition(touch.clientX);
    onChange(newRating);
  }, [calculateRatingFromPosition, onChange, disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging || disabled) return;
    
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const newRating = calculateRatingFromPosition(touch.clientX);
    onChange(newRating);
  }, [isDragging, calculateRatingFromPosition, onChange, disabled]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Effect to handle global mouse/touch events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

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

  // Render individual star with precise fill
  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1;
    const fillPercentage = Math.max(0, Math.min(100, (value - starIndex) * 100));
    const isFilled = value >= starValue;
    const isPartial = value > starIndex && value < starValue;

    return (
      <div
        key={starIndex}
        className="relative transition-all duration-200"
        style={{
          transform: isDragging ? 'scale(1.1)' : 'scale(1)',
          filter: isDragging ? 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))' : 'none'
        }}
      >
        {/* Background star */}
        <Star
          className={`${config.star} text-gray-200 transition-all duration-200`}
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
            className={`${config.star} text-amber-400 transition-all duration-200`}
            fill="currentColor"
            style={{
              filter: 'drop-shadow(0 0 4px rgba(251, 191, 36, 0.5))'
            }}
          />
        </div>

        {/* Glow effect during interaction */}
        {isDragging && (isFilled || isPartial) && (
          <div
            className="absolute inset-0 animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%)',
              borderRadius: '50%',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Stars container */}
      <div
        ref={containerRef}
        className={`flex items-center ${config.container} cursor-pointer select-none relative py-4`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          touchAction: 'none', // Prevent default touch behaviors
        }}
      >
        {[0, 1, 2, 3, 4].map(renderStar)}
        
        {/* Invisible overlay for easier dragging */}
        <div className="absolute inset-0 cursor-grab active:cursor-grabbing" />
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
        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-muted-foreground">
            {value.toFixed(1)} / 5.0
          </div>
          <div className="text-lg font-semibold text-foreground">
            {getRatingDescription(value)}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-center text-muted-foreground max-w-sm">
          Drag across stars for precise rating • Click number to edit • Use +/- for fine-tuning
        </div>
      </div>
    </div>
  );
};

export default PrecisionRatingSelector;