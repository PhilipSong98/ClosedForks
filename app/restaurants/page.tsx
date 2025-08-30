'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';

export default function RestaurantsPage() {
  const [restaurants] = useState([]); // Will be populated with real data later

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurants</h1>
          <p className="mt-2 text-sm text-gray-600">
            Discover great places recommended by your network
          </p>
        </div>
        <Button asChild>
          <Link href="/restaurants/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Restaurant
          </Link>
        </Button>
      </div>

      {/* Filters - placeholder for now */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600">
          Filters (search, cuisine, price, city) will be implemented here
        </p>
      </div>

      {/* Restaurant Grid */}
      {restaurants.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🍽️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No restaurants yet
          </h3>
          <p className="text-gray-600 mb-6">
            Be the first to add a restaurant to your network
          </p>
          <Button asChild>
            <Link href="/restaurants/new">
              <Plus className="h-4 w-4 mr-2" />
              Add First Restaurant
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurants.map((restaurant: any) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}