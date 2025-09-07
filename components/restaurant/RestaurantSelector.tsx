'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { PlacesAutocomplete } from '@/components/places/PlacesAutocomplete';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Restaurant } from '@/types';

interface RestaurantSelectorProps {
  onSelect: (restaurant: Restaurant | null) => void;
  selectedRestaurant?: Restaurant | null;
  className?: string;
}

export function RestaurantSelector({ onSelect, selectedRestaurant, className = "" }: RestaurantSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlaceSelect = async (placeId: string, _description: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // First get the place details from Google
      const detailsResponse = await fetch('/api/places/details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ placeId }),
      });

      if (!detailsResponse.ok) {
        throw new Error('Failed to get place details');
      }

      const { restaurant: restaurantData } = await detailsResponse.json();

      // Then find or create the restaurant in our database
      const findOrCreateResponse = await fetch('/api/restaurants/find-or-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });

      if (!findOrCreateResponse.ok) {
        throw new Error('Failed to save restaurant');
      }

      const { restaurant, created, updated } = await findOrCreateResponse.json();
      
      // Show success message based on action
      if (created) {
        console.log('Restaurant added to database');
      } else if (updated) {
        console.log('Restaurant updated with Google data');
      } else {
        console.log('Restaurant found in database');
      }

      onSelect(restaurant);
    } catch (err) {
      console.error('Error selecting restaurant:', err);
      setError(err instanceof Error ? err.message : 'Failed to select restaurant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSelection = () => {
    onSelect(null);
    setError(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input */}
      {!selectedRestaurant && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Find Restaurant
          </label>
          <PlacesAutocomplete
            onSelect={handlePlaceSelect}
            placeholder="Search for a restaurant..."
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Start typing to search for restaurants. We&apos;ll check our database first, then Google Places.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium">Finding restaurant...</div>
                <div className="text-sm text-gray-500">
                  Checking our database and Google Places
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Restaurant */}
      {selectedRestaurant && !isLoading && (
        <Card className="w-full overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {selectedRestaurant.name}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {selectedRestaurant.city}
                  </div>
                  {selectedRestaurant.google_data?.opening_hours?.open_now !== undefined && (
                    <div className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${
                      selectedRestaurant.google_data.opening_hours.open_now
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedRestaurant.google_data.opening_hours.open_now ? 'Open' : 'Closed'}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
                className="flex-shrink-0"
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}