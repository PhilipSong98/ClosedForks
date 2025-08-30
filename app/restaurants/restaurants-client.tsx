'use client'

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import SearchBar from '@/components/search/SearchBar';
import CuisineFilters from '@/components/filters/CuisineFilters';
import TopRestaurantsCarousel from '@/components/restaurant/TopRestaurantsCarousel';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRestaurants } from '@/lib/queries/restaurants';
import { Restaurant } from '@/types';

interface RestaurantsClientProps {
  initialRestaurants?: Restaurant[];
  initialTopRestaurants?: Restaurant[];
}

const RestaurantsClient: React.FC<RestaurantsClientProps> = ({ 
  initialRestaurants = [], 
  initialTopRestaurants = [] 
}) => {
  const { user } = useAuth();
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  // Use React Query with initial data from server
  const { data: allRestaurants = initialRestaurants } = useRestaurants();

  const handleRestaurantSelect = () => {
    // SearchBar will handle navigation by default
  };

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisines(prev => 
      prev.includes(cuisine)
        ? prev.filter(c => c !== cuisine)
        : [...prev, cuisine]
    );
  };


  // Filter and sort restaurants - ensure allRestaurants is an array
  const restaurantList = Array.isArray(allRestaurants) ? allRestaurants : [];
  const filteredRestaurants = restaurantList
    .filter(restaurant => {
      if (selectedCuisines.length === 0) return true;
      return restaurant.cuisine?.some(c => selectedCuisines.includes(c));
    })
    .sort((a, b) => {
      if (sortBy === 'recent') {
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

        {/* Top Restaurants Carousel */}
        {initialTopRestaurants.length > 0 && (
          <TopRestaurantsCarousel 
            restaurants={initialTopRestaurants}
          />
        )}

        {/* All Restaurants Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              All Restaurants
            </h2>
          </div>

          <CuisineFilters 
            selectedCuisines={selectedCuisines}
            onCuisineToggle={handleCuisineToggle}
            sortBy={sortBy}
            onSortChange={setSortBy}
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
                  {selectedCuisines.length > 0 
                    ? 'No restaurants found for selected cuisines' 
                    : 'No restaurants yet'
                  }
                </h3>
                <p className="text-muted-foreground mb-6">
                  {selectedCuisines.length > 0
                    ? 'Try selecting different cuisine filters or clearing all filters.'
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