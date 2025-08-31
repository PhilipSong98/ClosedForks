'use client';

import React, { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
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

interface FavoritesSectionProps {
  favorites: Restaurant[];
  onUpdateFavorites: () => void;
}

const FavoritesSection: React.FC<FavoritesSectionProps> = ({ 
  favorites,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { toast } = useToast();
  const updateFavoritesMutation = useUpdateFavorites();
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        // Filter to only show restaurants (not from reviews)
        const restaurants = data.results?.filter((r: { type: string }) => r.type === 'restaurant') || [];
        setSearchResults(restaurants);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchModalContent = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for restaurants to add..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          className="pl-10"
        />
      </div>

      {isSearching && (
        <div className="text-center py-4">
          <div className="text-muted-foreground">Searching...</div>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.map((restaurant) => (
            <div
              key={restaurant.id}
              className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
              onClick={() => handleAddFavorite(restaurant)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{restaurant.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {restaurant.address}, {restaurant.city}
                  </p>
                  {restaurant.cuisine.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {restaurant.cuisine.slice(0, 2).map((cuisine) => (
                        <Badge key={cuisine} variant="secondary" className="text-xs">
                          {cuisine}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline">
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {searchQuery && !isSearching && searchResults.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No restaurants found</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Your Favorites
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setAddModalOpen(true)}
            disabled={favorites.length >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Favorite
          </Button>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No favorites yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Add restaurants you love to quickly find them later
            </p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Favorite
            </Button>
          </div>
        ) : (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              {favorites.length}/10 favorites
            </div>
            
            {/* Mobile: Horizontal scroll */}
            <div className="block md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4">
                {favorites.map((restaurant) => (
                  <div key={restaurant.id} className="relative min-w-[280px]">
                    <RestaurantCard restaurant={restaurant} />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveFavorite(restaurant.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Grid layout */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((restaurant) => (
                <div key={restaurant.id} className="relative">
                  <RestaurantCard restaurant={restaurant} />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-6 w-6 p-0"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveFavorite(restaurant.id);
                    }}
                  >
                    <X className="h-3 w-3" />
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
          <SheetContent side="bottom" className="h-[80vh]">
            <SheetHeader className="mb-6">
              <SheetTitle>Add to Favorites</SheetTitle>
            </SheetHeader>
            {searchModalContent}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Add to Favorites</DialogTitle>
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