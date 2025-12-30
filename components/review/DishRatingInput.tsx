'use client';

import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DishAutocomplete } from './DishAutocomplete';
import PrecisionRatingSelector from './PrecisionRatingSelector';
import type { DishSuggestion } from '@/types';

interface DishRatingValue {
  dish_name: string;
  rating: number;
}

interface DishRatingInputProps {
  index: number;
  value: DishRatingValue;
  onChange: (index: number, value: DishRatingValue) => void;
  onRemove: (index: number) => void;
  restaurantId: string | undefined;
  canRemove: boolean;
  disabled?: boolean;
}

export function DishRatingInput({
  index,
  value,
  onChange,
  onRemove,
  restaurantId,
  canRemove,
  disabled = false
}: DishRatingInputProps) {
  const handleDishNameChange = useCallback((newName: string) => {
    onChange(index, { ...value, dish_name: newName });
  }, [index, value, onChange]);

  const handleDishSelect = useCallback((dish: DishSuggestion) => {
    // When selecting from autocomplete, optionally pre-fill with avg rating
    onChange(index, { dish_name: dish.dish_name, rating: value.rating });
  }, [index, value.rating, onChange]);

  // Stable callback for rating changes - only depends on index and current dish_name
  const handleRatingChange = useCallback((newRating: number) => {
    onChange(index, { dish_name: value.dish_name, rating: newRating });
  }, [index, value.dish_name, onChange]);

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
      {/* Dish Name Input with Autocomplete */}
      <div className="flex-1 min-w-0">
        <DishAutocomplete
          restaurantId={restaurantId}
          value={value.dish_name}
          onChange={handleDishNameChange}
          onSelect={handleDishSelect}
          placeholder={index === 0 ? "What did you eat?" : "Add another dish..."}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Rating Selector - Compact Mode */}
      <div className="flex-shrink-0">
        <PrecisionRatingSelector
          value={value.rating}
          onChange={handleRatingChange}
          size="sm"
          compact={true}
          disabled={disabled}
        />
      </div>

      {/* Remove Button */}
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(index)}
          disabled={disabled}
          className="flex-shrink-0 h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default DishRatingInput;
