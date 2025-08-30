'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Restaurant {
  id?: string;
  name: string;
  address: string;
  cuisine?: string;
  google_place_id?: string;
}

interface SearchBarProps {
  onRestaurantSelect?: (restaurant: Restaurant) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onRestaurantSelect, 
  placeholder = "Search restaurants..." 
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Restaurant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    if (query.length > 2) {
      setIsLoading(true);
      const timer = setTimeout(async () => {
        try {
          // Use our existing Google Places API
          const response = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`);
          if (response.ok) {
            const data = await response.json();
            const formattedSuggestions = data.predictions?.map((prediction: any) => ({
              google_place_id: prediction.place_id,
              name: prediction.structured_formatting?.main_text || prediction.description,
              address: prediction.structured_formatting?.secondary_text || prediction.description,
              cuisine: prediction.types?.includes('restaurant') ? 'Restaurant' : undefined
            })) || [];
            
            setSuggestions(formattedSuggestions);
            setIsOpen(true);
            setSelectedIndex(-1);
          }
        } catch (error) {
          console.error('Search error:', error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = async (restaurant: Restaurant) => {
    setQuery(restaurant.name);
    setIsOpen(false);

    if (onRestaurantSelect) {
      // Custom handler provided
      onRestaurantSelect(restaurant);
    } else {
      // Default behavior: navigate to restaurant or create review
      try {
        if (restaurant.google_place_id) {
          // Find or create restaurant in our database
          const response = await fetch('/api/restaurants/find-or-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              google_place_id: restaurant.google_place_id,
              name: restaurant.name,
              address: restaurant.address,
            }),
          });
          
          if (response.ok) {
            const { restaurant: dbRestaurant } = await response.json();
            // Navigate to restaurant page
            router.push(`/restaurants/${dbRestaurant.id}`);
          }
        }
      } catch (error) {
        console.error('Error handling restaurant selection:', error);
      }
    }
  };

  return (
    <div ref={searchRef} className="search-container relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-top-2 duration-200">
          {suggestions.map((restaurant, index) => (
            <button
              key={restaurant.google_place_id || index}
              onClick={() => handleSelect(restaurant)}
              className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground truncate">{restaurant.name}</div>
                  <div className="text-sm text-muted-foreground truncate">{restaurant.address}</div>
                  {restaurant.cuisine && (
                    <div className="text-xs text-muted-foreground/80 mt-1">{restaurant.cuisine}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length > 2 && suggestions.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg p-4 text-center text-muted-foreground">
          No restaurants found for "{query}"
        </div>
      )}
    </div>
  );
};

export default SearchBar;