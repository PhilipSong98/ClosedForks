'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, X, AlertCircle, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useToast } from '@/hooks/use-toast';
import { useUpdateFavorites } from '@/lib/mutations/profile';
import { Restaurant } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface FavoritesSectionProps {
  favorites?: Restaurant[];
  isLoading?: boolean;
  error?: string | null;
  onUpdateFavorites?: () => void;
}

const FavoritesSection: React.FC<FavoritesSectionProps> = ({ 
  favorites = [],
  isLoading = false,
  error = null,
  onUpdateFavorites,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const updateFavoritesMutation = useUpdateFavorites();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Filter out duplicate restaurants that are already in favorites
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter(restaurant => 
      !favorites.some(fav => fav.id === restaurant.id)
    );
  }, [searchResults, favorites]);

  const handleRemoveFavorite = async (restaurantId: string) => {
    try {
      const updatedFavorites = favorites
        .filter(fav => fav.id !== restaurantId)
        .map(fav => fav.id);
      
      await updateFavoritesMutation.mutateAsync(updatedFavorites);
      
      toast({
        title: 'Removed from favorites',
        description: 'Restaurant has been removed from your favorites.',
      });
      
      // Call the callback to refresh data
      onUpdateFavorites?.();
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast({
        title: 'Failed to remove',
        description: 'Could not remove restaurant from favorites. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAddFavorite = async (restaurant: Restaurant) => {
    try {
      // Check if already in favorites
      if (favorites.some(fav => fav.id === restaurant.id)) {
        toast({
          title: 'Already in favorites',
          description: 'This restaurant is already in your favorites.',
        });
        return;
      }

      // Check if at maximum favorites (10)
      if (favorites.length >= 10) {
        toast({
          title: 'Too many favorites',
          description: 'You can only have up to 10 favorite restaurants.',
          variant: 'destructive',
        });
        return;
      }

      const updatedFavorites = [...favorites.map(fav => fav.id), restaurant.id];
      await updateFavoritesMutation.mutateAsync(updatedFavorites);
      
      toast({
        title: 'Added to favorites',
        description: `${restaurant.name} has been added to your favorites.`,
      });

      setAddModalOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Call the callback to refresh data
      onUpdateFavorites?.();
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast({
        title: 'Failed to add',
        description: 'Could not add restaurant to favorites. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Filter to only show restaurants (not from reviews)
      const restaurants = data.results?.filter((r: { type: string }) => r.type === 'restaurant') || [];
      setSearchResults(restaurants);
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Trigger search when debounced query changes
  React.useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      return; // Don't search if query is still changing
    }
    handleSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, searchQuery]);

  const searchModalContent = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for restaurants to add..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Error */}
      {searchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{searchError}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {isSearching && searchQuery && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-12" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search Results */}
      {!isSearching && filteredSearchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="text-sm text-muted-foreground mb-2">
            {filteredSearchResults.length} restaurant{filteredSearchResults.length !== 1 ? 's' : ''} found
          </div>
          {filteredSearchResults.map((restaurant) => (
            <div
              key={restaurant.id}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group"
              onClick={() => handleAddFavorite(restaurant)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-base truncate group-hover:text-primary transition-colors">
                    {restaurant.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                    {restaurant.address}, {restaurant.city}
                  </p>
                  
                  {/* Rating and Reviews */}
                  {restaurant.avg_rating && restaurant.review_count && restaurant.review_count > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">
                          ⭐ {restaurant.avg_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({restaurant.review_count} review{restaurant.review_count !== 1 ? 's' : ''})
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Cuisine Tags */}
                  {restaurant.cuisine.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {restaurant.cuisine.slice(0, 2).map((cuisine) => (
                        <Badge key={cuisine} variant="secondary" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                      {restaurant.cuisine.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{restaurant.cuisine.length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  disabled={updateFavoritesMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {searchQuery && !isSearching && filteredSearchResults.length === 0 && !searchError && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No restaurants found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try a different search term or check the spelling
          </p>
        </div>
      )}
      
      {/* No Search Query */}
      {!searchQuery && (
        <div className="text-center py-8">
          <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Start typing to search</p>
          <p className="text-sm text-muted-foreground mt-1">
            Find restaurants in your network to add to favorites
          </p>
        </div>
      )}
    </div>
  );

  // Render loading skeleton
  const renderFavoritesSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <Skeleton className="h-4 w-20" />
      </div>
      
      {/* Mobile skeleton */}
      <div className="block md:hidden">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="min-w-[280px] space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Desktop skeleton */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return renderFavoritesSkeleton();
  }

  return (
    <>
      <div className="space-y-6">
        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold text-foreground">
              Your Favorites
            </h2>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAddModalOpen(true)}
            disabled={favorites.length >= 10 || updateFavoritesMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Favorite
          </Button>
        </div>

        {!error && favorites.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-pink-100 rounded-full" />
              <div className="absolute inset-2 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No favorites yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add restaurants you love to quickly find them later. Build your personal collection of go-to spots.
            </p>
            <Button 
              onClick={() => setAddModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Favorite
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {favorites.length}/10 favorites
              </div>
              {favorites.length >= 8 && (
                <div className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  {favorites.length >= 10 ? 'Maximum reached' : `${10 - favorites.length} spots left`}
                </div>
              )}
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="block md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {favorites.map((restaurant) => (
                  <div key={restaurant.id} className="relative min-w-[280px] snap-start">
                    <div className="group">
                      <RestaurantCard restaurant={restaurant} />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-3 right-3 h-7 w-7 p-0 opacity-90 hover:opacity-100 shadow-lg transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFavorite(restaurant.id);
                        }}
                        disabled={updateFavoritesMutation.isPending}
                      >
                        {updateFavoritesMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((restaurant) => (
                <div key={restaurant.id} className="relative group">
                  <div className="transition-transform group-hover:scale-[1.02]">
                    <RestaurantCard restaurant={restaurant} />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-3 right-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 shadow-lg transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFavorite(restaurant.id);
                    }}
                    disabled={updateFavoritesMutation.isPending}
                  >
                    {updateFavoritesMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Favorite Modal */}
      {isMobile ? (
        <Sheet open={addModalOpen} onOpenChange={setAddModalOpen}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Add to Favorites
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-hidden">
              {searchModalContent}
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Add to Favorites
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {searchModalContent}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FavoritesSection;