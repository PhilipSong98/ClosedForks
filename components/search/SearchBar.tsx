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
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  onRestaurantSelect, 
  placeholder = "Search restaurants...",
  className = ""
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Restaurant[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string>('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Generate session token on component mount for cost optimization
  useEffect(() => {
    const generateSessionToken = () => {
      return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    setSessionToken(generateSessionToken());
  }, []);

  // Debounce search - Search only database restaurants and reviews
  useEffect(() => {
    if (query.length > 2) {
      setIsLoading(true);
      const timer = setTimeout(async () => {
        try {
          // Search in private database only
          const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Search API response:', data);
            
            // Process restaurant results
            const restaurants = data.results
              ?.filter((result: any) => result.type === 'restaurant')
              ?.map((result: any) => ({
                id: result.id,
                name: result.name || result.title,
                address: result.address || result.subtitle,
                cuisine: result.cuisine || result.description
              })) || [];
            
            // Also include restaurants from reviews
            const reviewRestaurants = data.results
              ?.filter((result: any) => result.type === 'review' && result.subtitle)
              ?.map((result: any) => ({
                id: result.restaurantId,
                name: result.subtitle,
                address: 'From review',
                cuisine: result.title
              })) || [];
            
            // Combine and deduplicate
            const allRestaurants = [...restaurants, ...reviewRestaurants];
            const uniqueRestaurants = allRestaurants.filter((restaurant, index, arr) => 
              arr.findIndex(r => r.id === restaurant.id) === index
            );
            
            console.log('Processed restaurants:', uniqueRestaurants);
            
            setSuggestions(uniqueRestaurants);
            setIsOpen(true);
            setSelectedIndex(-1);
          } else {
            console.error('API response not ok:', response.status, response.statusText);
            setSuggestions([]);
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
    setQuery(restaurant.name || '');
    setIsOpen(false);

    if (onRestaurantSelect) {
      // Custom handler provided
      onRestaurantSelect(restaurant);
    } else {
      // Default behavior: navigate to restaurant page (already in database)
      try {
        if (restaurant.id) {
          // Navigate directly to restaurant page since it's from our database
          router.push(`/restaurants/${restaurant.id}`);
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
          value={query || ''}
          onChange={(e) => setQuery(e.target.value || '')}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pl-12 pr-4 py-4 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 ${className}`}
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
              key={restaurant.id || index}
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