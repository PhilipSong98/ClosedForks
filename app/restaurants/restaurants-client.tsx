'use client'

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import SearchBar from '@/components/search/SearchBar';
import EnhancedFilters, { FilterState } from '@/components/filters/EnhancedFilters';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRestaurants } from '@/lib/queries/restaurants';
import { Restaurant } from '@/types';

interface RestaurantsClientProps {
  initialRestaurants?: Restaurant[];
}

const RestaurantsClient: React.FC<RestaurantsClientProps> = ({ 
  initialRestaurants = []
}) => {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterState>({
    tags: [],
    minRating: 0,
    priceRange: [0, 1000],
    dateRange: 'all',
    recommendedOnly: false,
    sortBy: 'recent'
  });

  // Use React Query with initial data from server
  const { data: allRestaurants = initialRestaurants } = useRestaurants();

  const handleRestaurantSelect = () => {
    // SearchBar will handle navigation by default
  };



  // Filter and sort restaurants - ensure allRestaurants is an array
  const restaurantList = Array.isArray(allRestaurants) ? allRestaurants : [];
  const filteredRestaurants = restaurantList
    .filter(restaurant => {
      // Tag filter (from aggregated tags)
      if (filters.tags.length > 0) {
        const restaurantTags = restaurant.aggregated_tags || [];
        const hasTagMatch = filters.tags.some(tag => restaurantTags.includes(tag));
        if (!hasTagMatch) return false;
      }

      // Rating filter
      if (filters.minRating > 0 && (restaurant.avg_rating || 0) < filters.minRating) {
        return false;
      }

      // Price range filter (using price_level)
      const priceValue = restaurant.price_level * 250; // Convert 1-4 scale to price range
      if (priceValue < filters.priceRange[0] || priceValue > filters.priceRange[1]) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return (b.avg_rating || 0) - (a.avg_rating || 0);
      }
    });

  if (!user) {
    return null; // AuthWrapper will handle this
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Hero Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Discover Restaurants
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find and explore restaurants in your network. 
              Add new places or browse recommendations from your circle.
            </p>
          </div>
          
          <SearchBar onRestaurantSelect={handleRestaurantSelect} />
        </section>


        {/* All Restaurants Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              All Restaurants from Your Circle
            </h2>
          </div>

          <EnhancedFilters 
            filters={filters}
            onFiltersChange={setFilters}
            showAllFilters={true}
          />

          {filteredRestaurants.length > 0 ? (
            <>
              {/* Mobile: Single column feed like home page */}
              <div className="md:hidden max-w-lg mx-auto space-y-6">
                {filteredRestaurants.map((restaurant) => (
                  <div key={restaurant.id} className="bg-card border border-border rounded-lg shadow-sm">
                    <RestaurantCard restaurant={restaurant} />
                  </div>
                ))}
              </div>
              
              {/* Desktop: Grid layout */}
              <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantCard 
                    key={restaurant.id}
                    restaurant={restaurant}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {filters.tags.length > 0 || filters.minRating > 0
                    ? 'No restaurants found for current filters' 
                    : 'No restaurants yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {filters.tags.length > 0 || filters.minRating > 0
                    ? 'Try adjusting your filters or clearing all filters to see more results.'
                    : 'Use the search bar above to discover and add new restaurants!'
                  }
                </p>
              </div>
            </div>
          )}
        </section>
      </main>


    </div>
  );
};

export default RestaurantsClient;