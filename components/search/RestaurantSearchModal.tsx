'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Star, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { PRICE_LEVELS } from '@/constants';
import type { Restaurant } from '@/types';

interface RestaurantSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RestaurantSearchModal({ open, onOpenChange }: RestaurantSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/restaurants/search?q=${encodeURIComponent(query)}&limit=20`);
        
        if (!response.ok) {
          throw new Error('Search failed');
        }

        const data = await response.json();
        setResults(data.restaurants || []);
      } catch (err) {
        console.error('Search error:', err);
        setError('Failed to search restaurants');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const handleRestaurantClick = (restaurantId: string) => {
    onOpenChange(false);
    setQuery('');
    setResults([]);
    router.push(`/restaurants/${restaurantId}`);
  };

  const handleClose = () => {
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  const SearchContent = () => (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search restaurants you've reviewed..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      <div className="max-h-[400px] overflow-y-auto">
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Searching...
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && query && results.length === 0 && (
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">No restaurants found</div>
            <div className="text-sm text-muted-foreground">
              Try searching for restaurants that have been reviewed by your network
            </div>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="space-y-2">
            {results.map((restaurant) => (
              <div
                key={restaurant.id}
                onClick={() => handleRestaurantClick(restaurant.id)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{restaurant.name}</div>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{restaurant.address}, {restaurant.city}</span>
                  </div>

                  {/* Rating and Cuisine */}
                  <div className="flex items-center gap-2 mt-2">
                    {restaurant.avg_rating && restaurant.avg_rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                          {restaurant.avg_rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                    
                    <span className="text-xs font-medium">
                      {PRICE_LEVELS[restaurant.price_level as keyof typeof PRICE_LEVELS]}
                    </span>

                    {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                      <Badge variant="secondary" className="text-xs h-5">
                        {restaurant.cuisine[0]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!query && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <div>Search for restaurants reviewed by your network</div>
            <div className="text-sm mt-1">
              Find places by name, location, or cuisine type
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="top" className="h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Search Restaurants</h2>
            <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
          <SearchContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Search Restaurants</h2>
        </div>
        <SearchContent />
      </DialogContent>
    </Dialog>
  );
}