
import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine?: string;
}

interface SearchBarProps {
  onRestaurantSelect: (restaurant: Restaurant) => void;
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
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock suggestions - replace with actual Google API integration
  const mockSuggestions: Restaurant[] = [
    { id: '1', name: 'The Italian Corner', address: '123 Main St, Downtown', cuisine: 'Italian' },
    { id: '2', name: 'Burger Palace', address: '456 Oak Ave, Midtown', cuisine: 'American' },
    { id: '3', name: 'Dragon Garden', address: '789 Pine St, Chinatown', cuisine: 'Chinese' },
    { id: '4', name: 'Pasta Prima', address: '321 Elm St, Little Italy', cuisine: 'Italian' },
    { id: '5', name: 'Sushi Zen', address: '654 Maple Dr, Downtown', cuisine: 'Japanese' },
  ];

  useEffect(() => {
    if (query.length > 1) {
      // Simulate API call delay
      const timer = setTimeout(() => {
        const filtered = mockSuggestions.filter(restaurant =>
          restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
          restaurant.address.toLowerCase().includes(query.toLowerCase())
        );
        setSuggestions(filtered);
        setIsOpen(true);
        setSelectedIndex(-1);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsOpen(false);
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

  const handleSelect = (restaurant: Restaurant) => {
    setQuery(restaurant.name);
    setIsOpen(false);
    onRestaurantSelect(restaurant);
  };

  return (
    <div ref={searchRef} className="search-container">
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
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="search-dropdown animate-slide-down">
          {suggestions.map((restaurant, index) => (
            <button
              key={restaurant.id}
              onClick={() => handleSelect(restaurant)}
              className={`w-full text-left px-4 py-3 hover:bg-accent transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                index === selectedIndex ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <div className="font-medium text-foreground">{restaurant.name}</div>
                  <div className="text-sm text-muted-foreground">{restaurant.address}</div>
                  {restaurant.cuisine && (
                    <div className="text-xs text-subtle mt-1">{restaurant.cuisine}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
