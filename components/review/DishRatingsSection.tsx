'use client';

import React, { useCallback } from 'react';
import { Plus, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DishRatingInput } from './DishRatingInput';

interface DishRatingValue {
  dish_name: string;
  rating: number;
}

interface DishRatingsSectionProps {
  value: DishRatingValue[];
  onChange: (dishes: DishRatingValue[]) => void;
  restaurantId: string | undefined;
  maxDishes?: number;
  disabled?: boolean;
}

const DEFAULT_RATING = 3.0;
const MAX_DISHES_DEFAULT = 10;

export function DishRatingsSection({
  value,
  onChange,
  restaurantId,
  maxDishes = MAX_DISHES_DEFAULT,
  disabled = false
}: DishRatingsSectionProps) {
  // Initialize with one empty dish rating if none provided
  const dishes = value.length > 0 ? value : [{ dish_name: '', rating: DEFAULT_RATING }];

  const handleDishChange = useCallback((index: number, updatedDish: DishRatingValue) => {
    const newDishes = [...dishes];
    newDishes[index] = updatedDish;
    onChange(newDishes);
  }, [dishes, onChange]);

  const handleAddDish = useCallback(() => {
    if (dishes.length < maxDishes) {
      onChange([...dishes, { dish_name: '', rating: DEFAULT_RATING }]);
    }
  }, [dishes, maxDishes, onChange]);

  const handleRemoveDish = useCallback((index: number) => {
    // Only allow removing if there's more than one dish
    if (dishes.length > 1) {
      const newDishes = dishes.filter((_, i) => i !== index);
      onChange(newDishes);
    }
  }, [dishes, onChange]);

  const canAddMore = dishes.length < maxDishes;
  const canRemove = dishes.length > 1;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Utensils className="w-4 h-4 text-muted-foreground" />
        <span className="text-base font-medium">What did you eat?</span>
        <span className="text-xs text-muted-foreground">
          ({dishes.length}/{maxDishes})
        </span>
      </div>

      {/* Dish Rating Inputs */}
      <div className="space-y-3">
        {dishes.map((dish, index) => (
          <DishRatingInput
            key={index}
            index={index}
            value={dish}
            onChange={handleDishChange}
            onRemove={handleRemoveDish}
            restaurantId={restaurantId}
            canRemove={canRemove}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Add Another Dish Button */}
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddDish}
          disabled={disabled || !restaurantId}
          className="w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add another dish
        </Button>
      )}

      {/* Helper text when no restaurant selected */}
      {!restaurantId && (
        <p className="text-xs text-muted-foreground text-center">
          Select a restaurant first to add dish ratings
        </p>
      )}
    </div>
  );
}

export default DishRatingsSection;
