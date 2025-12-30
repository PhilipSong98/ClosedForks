'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { Utensils, Loader2, Star, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { DishSuggestion } from '@/types';

interface DishAutocompleteProps {
  restaurantId: string | undefined;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (dish: DishSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DishAutocomplete({
  restaurantId,
  value,
  onChange,
  onSelect,
  placeholder = "Enter dish name...",
  className = "",
  disabled = false
}: DishAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<DishSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSelectedFromDropdown, setIsSelectedFromDropdown] = useState(false);

  // Track the last selected value to prevent re-showing dropdown after selection
  const justSelectedRef = useRef<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchInput: string, restId: string | undefined) => {
      if (!restId || searchInput.length < 1) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          restaurant_id: restId,
          query: searchInput,
        });

        const response = await fetch(`/api/dishes/autocomplete?${params}`);

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setShowDropdown(data.suggestions?.length > 0);
        } else {
          console.error('Dish autocomplete error:', response.statusText);
          setSuggestions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Dish autocomplete error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Effect to trigger search when input changes
  useEffect(() => {
    // Skip search if this value was just selected from the dropdown
    if (justSelectedRef.current === value.trim()) {
      justSelectedRef.current = null; // Reset for next time
      return;
    }

    if (value.trim() && restaurantId) {
      debouncedSearch(value.trim(), restaurantId);
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [value, restaurantId, debouncedSearch]);

  const handleInputChange = (newValue: string) => {
    // If user types while a chip is shown, clear everything and start fresh
    if (isSelectedFromDropdown) {
      setIsSelectedFromDropdown(false);
      onChange('');
      // Focus the input after clearing
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    onChange(newValue);
  };

  const handleSelect = (dish: DishSuggestion) => {
    // Mark this value as just selected to prevent re-triggering search
    justSelectedRef.current = dish.dish_name.trim();
    onChange(dish.dish_name);
    setShowDropdown(false);
    setSuggestions([]);
    setIsSelectedFromDropdown(true);
    onSelect?.(dish);
  };

  const handleClearSelection = () => {
    setIsSelectedFromDropdown(false);
    onChange('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicks on suggestions
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If chip is shown and user presses backspace or any character, clear it
    if (isSelectedFromDropdown && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      handleClearSelection();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      // If dropdown is open with suggestions, select the first one
      if (showDropdown && suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {isSelectedFromDropdown && value ? (
          // Chip UI for selected dish
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
            <Check className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-medium text-amber-800 truncate flex-1">
              {value}
            </span>
            <button
              type="button"
              onClick={handleClearSelection}
              disabled={disabled}
              className="flex-shrink-0 p-0.5 rounded-full hover:bg-amber-200 text-amber-600 hover:text-amber-800 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          // Regular input
          <>
            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onKeyDown={handleInputKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="pr-10 border-0 bg-gray-50 rounded-xl"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              ) : (
                <Utensils className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 z-50 mt-1 max-h-48 overflow-y-auto shadow-lg min-w-[280px] w-max">
          <div className="py-1">
            {suggestions.map((dish, index) => (
              <div
                key={`${dish.dish_name}-${index}`}
                className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelect(dish)}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <Utensils className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-sm text-gray-900">
                      {dish.dish_name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 flex-shrink-0">
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-amber-400 fill-amber-400 mr-0.5" />
                      <span>{dish.avg_rating.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <span className="whitespace-nowrap">{dish.rating_count} {dish.rating_count === 1 ? 'rating' : 'ratings'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!restaurantId && value.length > 0 && (
        <div className="text-xs text-gray-400 mt-1">
          Select a restaurant first to see dish suggestions
        </div>
      )}
    </div>
  );
}

export default DishAutocomplete;
