'use client'

import React, { useMemo, useEffect, memo } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import SearchFilterBar from '@/components/filters/SearchFilterBar';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { RestaurantFeedSkeleton } from '@/components/ui/skeleton-loader';
import { useAuth } from '@/lib/hooks/useAuth';
import { useInfiniteRestaurants } from '@/lib/queries/restaurants';
import { useIntersectionObserver } from '@/lib/hooks/useIntersectionObserver';
import { useFilterParams } from '@/lib/hooks/useFilterParams';
import type { Restaurant } from '@/types';
import { filterAndSortRestaurants } from '@/lib/utils/filtering';

const RestaurantsClient: React.FC = () => {
  const { user, loading: authLoading } = useAuth();

  // Use URL-synced filters - default sort by rating for restaurants
  const { filters, setFilters } = useFilterParams('rating');

  // Use infinite query for progressive loading
  // Only enable the query when user is authenticated
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteRestaurants({ 
    pageSize: 15,
    enabled: !!user && !authLoading
  });

  // Intersection observer for infinite scroll
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px',
  });

  // Fetch next page when intersection observer triggers
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all restaurants from all pages
  const allRestaurants = useMemo(() => {
    if (!data?.pages) return [];
    return (data.pages as Array<{ restaurants: Restaurant[] }>).flatMap(page => page.restaurants) || [];
  }, [data]);

  // Memoized filter and sort - only recalculates when dependencies change
  const filteredRestaurants = useMemo(
    () => filterAndSortRestaurants(allRestaurants, filters),
    [allRestaurants, filters]
  );

  if (!user) {
    return null; // AuthWrapper will handle this
  }

  // Show loading skeleton when auth is loading or data is initially loading
  const hasPages = data?.pages ? data.pages.length > 0 : false;
  const showInitialLoading = authLoading || (isLoading && !hasPages);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 pb-24">
        {/* Hero Section */}
        <section className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-3">
              Discover Restaurants
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find and explore restaurants in your network.
              Add new places or browse recommendations from your circle.
            </p>
          </div>
        </section>

        {/* Restaurants Section */}
        <section>
          {/* Show loading skeleton on initial load or auth loading */}
          {showInitialLoading ? (
            <>
              <div className="max-w-lg mx-auto mb-8">
                <div className="h-16 bg-gray-100 rounded-lg animate-pulse" /> {/* Filters placeholder */}
              </div>
              <RestaurantFeedSkeleton count={6} />
            </>
          ) : isError ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Failed to load restaurants
                </h3>
                <p className="text-muted-foreground mb-6">
                  {error?.message || 'Something went wrong while loading restaurants.'}
                </p>
                <Button
                  onClick={() => refetch()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : allRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No restaurants yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Use the search bar above to discover and add new restaurants!
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <SearchFilterBar
                  filters={filters}
                  onFiltersChange={setFilters}
                  filteredCount={filteredRestaurants.length}
                />
              </div>

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

                  {/* Load more trigger and loading indicators */}
                  <div ref={loadMoreRef} className="flex justify-center py-8">
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading more restaurants...</span>
                      </div>
                    ) : hasNextPage ? (
                      <Button
                        variant="ghost"
                        onClick={() => fetchNextPage()}
                        className="text-muted-foreground"
                      >
                        Load more restaurants
                      </Button>
                    ) : allRestaurants.length > 0 ? (
                      <p className="text-muted-foreground text-center">
                        You&apos;ve reached the end of your restaurant list
                      </p>
                    ) : null}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <h3 className="text-lg font-medium text-foreground mb-2">
                      No restaurants match your filters
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Try adjusting your filters to see more results.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default memo(RestaurantsClient);
