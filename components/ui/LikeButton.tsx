'use client'

import React, { useState, useCallback, useRef } from 'react';
import { Heart } from 'lucide-react';
import { useLikeReview } from '@/lib/mutations/reviewLikes';

interface LikeButtonProps {
  reviewId: string;
  isLiked: boolean;
  likeCount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  reviewId,
  isLiked,
  likeCount,
  size = 'md',
  className = '',
  disabled = false
}) => {
  const likeReview = useLikeReview();
  const [isPulsing, setIsPulsing] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localCount, setLocalCount] = useState(likeCount);
  const [isUpdating, setIsUpdating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Size configurations
  const sizes = {
    sm: { heart: 'w-3.5 h-3.5', text: 'text-xs', container: 'space-x-1.5 p-0.5' },
    md: { heart: 'w-4 h-4', text: 'text-sm', container: 'space-x-2 p-1' },
    lg: { heart: 'w-5 h-5', text: 'text-base', container: 'space-x-2.5 p-1.5' }
  };

  const sizeConfig = sizes[size];

  // Haptic feedback for mobile devices
  const triggerHapticFeedback = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10]);
    }
  }, []);

  const handleLikeClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const now = Date.now();
    
    // Debounce with reduced timing (100ms for ultra-responsiveness)
    if (now - lastClickTime < 100) {
      return;
    }
    
    if (disabled || isUpdating) {
      return;
    }
    
    setLastClickTime(now);
    setHasError(false);
    setIsUpdating(true);
    
    // Clear any existing error timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // INSTANT local optimistic update (0ms delay)
    const newLikedState = !localLiked;
    const newCount = newLikedState 
      ? localCount + 1 
      : Math.max(0, localCount - 1);
    
    setLocalLiked(newLikedState);
    setLocalCount(newCount);
    
    // Trigger animation and haptic feedback only when liking (not unliking)
    if (newLikedState) {
      setIsPulsing(true);
      triggerHapticFeedback();
      
      // Reset animation after it completes
      setTimeout(() => setIsPulsing(false), 200);
    }
    
    // Execute the mutation
    likeReview.mutate(reviewId, {
      onSuccess: (data) => {
        // Sync with server response
        setLocalLiked(data.isLiked);
        setLocalCount(data.likeCount);
        setIsUpdating(false);
      },
      onError: (error) => {
        console.error('Like mutation failed:', error);
        
        // Revert local state on error
        setLocalLiked(isLiked);
        setLocalCount(likeCount);
        setHasError(true);
        setIsUpdating(false);
        
        // Clear error state after animation
        timeoutRef.current = setTimeout(() => {
          setHasError(false);
        }, 1000);
      }
    });
  }, [
    reviewId, 
    lastClickTime, 
    disabled, 
    isUpdating,
    localLiked,
    localCount,
    likeReview, 
    triggerHapticFeedback,
    isLiked,
    likeCount
  ]);

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLikeClick(event as unknown as React.MouseEvent);
    }
  }, [handleLikeClick]);

  // Local state is independent after initialization
  // No syncing with props to prevent bouncing

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      onClick={handleLikeClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`
        like-button
        inline-flex items-center justify-center
        ${sizeConfig.container}
        -m-1 rounded-full
        text-muted-foreground hover:text-red-500 
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none
        group
        ${hasError ? 'animate-shake' : ''}
        ${className}
      `}
      aria-label={localLiked ? 'Unlike this review' : 'Like this review'}
      aria-pressed={localLiked}
      role="button"
      tabIndex={0}
    >
      <Heart 
        className={`
          heart
          ${sizeConfig.heart}
          ${localLiked ? 'liked' : ''}
          ${isPulsing ? 'animate-heart-pulse' : ''}
          ${hasError ? 'animate-heart-error' : ''}
          group-hover:scale-105
          group-active:scale-95
        `} 
      />
      <span 
        className={`
          ${sizeConfig.text} 
          font-medium 
          transition-colors duration-150 ease-out
          ${isPulsing && localLiked ? 'animate-count-pulse' : ''}
          ${hasError ? 'text-red-400' : ''}
          select-none
        `}
        aria-live="polite"
        aria-atomic="true"
      >
        {localCount}
      </span>
    </button>
  );
};

export default LikeButton;