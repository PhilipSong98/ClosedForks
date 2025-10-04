'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search, X, AlertCircle, Bookmark, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';
import { useToast } from '@/hooks/use-toast';
import { useAddToEatList, useRemoveFromToEatList } from '@/lib/mutations/toEatList';
import { useToEatList } from '@/lib/queries/toEatList';
import { Restaurant } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface ToEatSectionProps {
  showHeader?: boolean;
}

const ToEatSection: React.FC<ToEatSectionProps> = ({ showHeader = true }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const { data: toEatListData, isLoading, error } = useToEatList();
  const addToEatListMutation = useAddToEatList();
  const removeFromToEatListMutation = useRemoveFromToEatList();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Debounce search query to avoid excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  const toEatRestaurants = useMemo(() => toEatListData?.restaurants || [], [toEatListData?.restaurants]);
  const toEatCount = toEatListData?.count || 0;

  // Filter out restaurants that are already in to-eat list
  const filteredSearchResults = useMemo(() => {
    return searchResults.filter(restaurant => 
      !toEatRestaurants.some(toEatRestaurant => toEatRestaurant.id === restaurant.id)
    );
  }, [searchResults, toEatRestaurants]);

  const handleAddToEatList = async (restaurant: Restaurant) => {
    try {
      // Check if already in to-eat list
      if (toEatRestaurants.some(toEatRestaurant => toEatRestaurant.id === restaurant.id)) {
        toast({
          title: 'Already in to-eat list',
          description: 'This restaurant is already in your to-eat list.',
        });
        return;
      }

      await addToEatListMutation.mutateAsync(restaurant.id);
      
      toast({
        title: 'Added to To-Eat List',
        description: `${restaurant.name} has been added to your to-eat list.`,
      });

      setAddModalOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error adding to to-eat list:', error);
      toast({
        title: 'Failed to add',
        description: 'Could not add restaurant to to-eat list. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveFromToEatList = async (restaurantId: string, restaurantName: string) => {
    try {
      await removeFromToEatListMutation.mutateAsync(restaurantId);
      
      toast({
        title: 'Removed from To-Eat List',
        description: `${restaurantName} has been removed from your to-eat list.`,
      });
    } catch (error) {
      console.error('Error removing from to-eat list:', error);
      toast({
        title: 'Failed to remove',
        description: 'Could not remove restaurant from to-eat list. Please try again.',
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
              onClick={() => handleAddToEatList(restaurant)}
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
                  disabled={addToEatListMutation.isPending}
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
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full" />
            <div className="absolute inset-1 bg-white rounded-full shadow-sm flex items-center justify-center">
              <Search className="h-6 w-6 text-gray-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No restaurants found</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Try a different search term or check the spelling
          </p>
        </div>
      )}
      
      {/* No Search Query */}
      {!searchQuery && (
        <div className="text-center py-8">
          <div className="relative mx-auto w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full animate-pulse" />
            <div className="absolute inset-1 bg-white rounded-full shadow-sm flex items-center justify-center">
              <Search className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Start typing to search</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Find restaurants in your network to add to your to-eat list
          </p>
        </div>
      )}
    </div>
  );

  // Render loading skeleton
  const renderToEatSkeleton = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-8 w-28" />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <Skeleton className="h-4 w-24" />
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
    return renderToEatSkeleton();
  }

  return (
    <>
      <div className="space-y-6">
        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to load to-eat list'}. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}
        
{showHeader && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">
              To-Eat List
            </h2>
            <Button
              size="sm"
              onClick={() => setAddModalOpen(true)}
              disabled={addToEatListMutation.isPending || removeFromToEatListMutation.isPending}
              className="bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        )}

        {!error && toEatCount === 0 ? (
          <div className="text-center py-16">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full" />
              <div className="absolute inset-2 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No restaurants saved yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Save restaurants you want to try to keep track of places you&apos;re excited to visit.
            </p>
            <Button 
              onClick={() => setAddModalOpen(true)}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              disabled={addToEatListMutation.isPending || removeFromToEatListMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              Save Your First Restaurant
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-muted-foreground">
                {toEatCount} restaurant{toEatCount !== 1 ? 's' : ''} saved
              </div>
              {!showHeader && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setAddModalOpen(true)}
                  disabled={addToEatListMutation.isPending || removeFromToEatListMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Restaurant
                </Button>
              )}
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="block md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {toEatRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="relative min-w-[280px] snap-start">
                    <div className="group">
                      <RestaurantCard restaurant={restaurant} showToEatButton={false} />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-3 right-3 h-7 w-7 p-0 opacity-90 hover:opacity-100 shadow-lg transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveFromToEatList(restaurant.id, restaurant.name);
                        }}
                        disabled={removeFromToEatListMutation.isPending}
                      >
                        {removeFromToEatListMutation.isPending ? (
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
              {toEatRestaurants.map((restaurant) => (
                <div key={restaurant.id} className="relative group">
                  <div className="transition-transform group-hover:scale-[1.02]">
                    <RestaurantCard restaurant={restaurant} showToEatButton={false} />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-3 right-3 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 shadow-lg transition-opacity"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFromToEatList(restaurant.id, restaurant.name);
                    }}
                    disabled={removeFromToEatListMutation.isPending}
                  >
                    {removeFromToEatListMutation.isPending ? (
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

      {/* Add Restaurant Modal */}
      {isMobile ? (
        <Sheet open={addModalOpen} onOpenChange={setAddModalOpen}>
          <SheetContent side="bottom" className="h-[85vh]">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-blue-600" />
                Add to To-Eat List
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
                <Bookmark className="h-5 w-5 text-blue-600" />
                Add to To-Eat List
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

export default ToEatSection;