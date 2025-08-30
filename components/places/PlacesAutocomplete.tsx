'use client';

import { useState, useCallback, useEffect } from 'react';
import { debounce } from 'lodash';
import { MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

interface PlacesAutocompleteProps {
  onSelect: (placeId: string, description: string) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

export function PlacesAutocomplete({ 
  onSelect, 
  placeholder = "Search for a restaurant...",
  className = "",
  initialValue = ""
}: PlacesAutocompleteProps) {
  const [input, setInput] = useState(initialValue);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sessionToken] = useState(() => Math.random().toString(36).substring(7));

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchInput: string) => {
      if (searchInput.length < 2) {
        setPredictions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch('/api/places/autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: searchInput,
            sessionToken,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setPredictions(data.predictions || []);
          setShowDropdown(true);
        } else {
          console.error('Autocomplete API error:', response.statusText);
          setPredictions([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Autocomplete error:', error);
        setPredictions([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [sessionToken]
  );

  // Effect to trigger search when input changes
  useEffect(() => {
    if (input.trim()) {
      debouncedSearch(input.trim());
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [input, debouncedSearch]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleSelect = (place: PlacePrediction) => {
    setInput(place.structured_formatting.main_text);
    setShowDropdown(false);
    setPredictions([]);
    onSelect(place.place_id, place.description);
  };

  const handleInputBlur = () => {
    // Delay hiding dropdown to allow clicks on predictions
    setTimeout(() => setShowDropdown(false), 150);
  };

  const handleInputFocus = () => {
    if (predictions.length > 0) {
      setShowDropdown(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {showDropdown && predictions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto">
          <div className="py-1">
            {predictions.map((place) => (
              <div
                key={place.place_id}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleSelect(place)}
              >
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {place.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {place.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {showDropdown && predictions.length === 0 && input.length >= 2 && !isLoading && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No restaurants found. Try a different search term.
          </div>
        </Card>
      )}
    </div>
  );
}