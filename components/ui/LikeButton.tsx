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
  const [lastClickTime, setLastClickTime] = useState(0);

  // Always use props directly - no local state that can get out of sync
  // Validate to prevent NaN
  const validLikeCount = typeof likeCount === 'number' && !isNaN(likeCount) ? likeCount : 0;

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

    // Debounce with reduced timing (300ms to prevent double-clicks)
    if (now - lastClickTime < 300) {
      return;
    }

    if (disabled || likeReview.isPending) {
      return;
    }

    setLastClickTime(now);

    // Trigger haptic feedback only when liking (not unliking)
    if (!isLiked) {
      triggerHapticFeedback();
    }

    // Execute the mutation - React Query will handle optimistic updates
    likeReview.mutate(reviewId, {
      onError: (error) => {
        console.error('Like mutation failed:', error);
      }
    });
  }, [
    reviewId,
    lastClickTime,
    disabled,
    isLiked,
    likeReview,
    triggerHapticFeedback
  ]);

  // Keyboard event handler for accessibility
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLikeClick(event as unknown as React.MouseEvent);
    }
  }, [handleLikeClick]);

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
        ${className}
      `}
      aria-label={isLiked ? 'Unlike this review' : 'Like this review'}
      aria-pressed={isLiked}
      role="button"
      tabIndex={0}
    >
      <Heart
        className={`
          heart
          ${sizeConfig.heart}
          ${isLiked ? 'liked' : ''}
          transition-transform duration-150
          group-hover:scale-110
          group-active:scale-95
        `}
      />
      <span
        className={`
          ${sizeConfig.text}
          font-medium
          transition-colors duration-150 ease-out
          select-none
          tabular-nums
        `}
        aria-live="polite"
        aria-atomic="true"
      >
        {validLikeCount}
      </span>
    </button>
  );
};

export default LikeButton;