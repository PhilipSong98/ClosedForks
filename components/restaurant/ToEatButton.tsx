'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsInToEatList } from '@/lib/queries/toEatList';
import { useAddToEatList, useRemoveFromToEatList } from '@/lib/mutations/toEatList';
import { cn } from '@/lib/utils';

interface ToEatButtonProps {
  restaurantId: string;
  restaurantName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export function ToEatButton({ 
  restaurantId, 
  restaurantName = 'restaurant',
  variant = 'ghost', 
  size = 'sm',
  showText = true,
  className 
}: ToEatButtonProps) {
  const { toast } = useToast();
  const isInToEatList = useIsInToEatList(restaurantId);
  const addToEatListMutation = useAddToEatList();
  const removeFromToEatListMutation = useRemoveFromToEatList();

  const isLoading = addToEatListMutation.isPending || removeFromToEatListMutation.isPending;

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isInToEatList) {
        await removeFromToEatListMutation.mutateAsync(restaurantId);
        toast({
          title: 'Removed from To-Eat List',
          description: `${restaurantName} has been removed from your to-eat list.`,
        });
      } else {
        await addToEatListMutation.mutateAsync(restaurantId);
        toast({
          title: 'Added to To-Eat List',
          description: `${restaurantName} has been saved to your to-eat list.`,
        });
      }
    } catch (error) {
      console.error('Error toggling to-eat list:', error);
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Saving...';
    if (isInToEatList) return 'Saved';
    return 'Save to List';
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return (
      <Bookmark 
        className={cn(
          "h-4 w-4",
          isInToEatList ? "fill-current" : ""
        )} 
      />
    );
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading}
      className={cn(
        "shrink-0 transition-all",
        isInToEatList && variant === 'ghost' && "bg-primary/10 text-primary hover:bg-primary/20",
        isInToEatList && variant === 'outline' && "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
        className
      )}
      aria-label={isInToEatList ? 'Remove from to-eat list' : 'Add to to-eat list'}
    >
      {getButtonIcon()}
      {showText && (
        <span className="ml-2">
          {getButtonText()}
        </span>
      )}
    </Button>
  );
}