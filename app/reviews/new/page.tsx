'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RestaurantSelector } from '@/components/restaurant/RestaurantSelector';
import { ReviewForm } from '@/components/review/ReviewForm';
import type { Restaurant } from '@/types';

export default function NewReviewPage() {
  const router = useRouter();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const handleRestaurantSelect = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleCancel = () => {
    if (selectedRestaurant) {
      // If restaurant is selected, go back to selection
      setSelectedRestaurant(null);
    } else {
      // If no restaurant selected, go back to previous page
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900">
          Write a Review
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Share your dining experience with your network
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 text-sm">
          <div className={`flex items-center ${selectedRestaurant ? 'text-green-600' : 'text-blue-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              selectedRestaurant ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'
            }`}>
              {selectedRestaurant ? '✓' : '1'}
            </div>
            <span className="ml-2">Select Restaurant</span>
          </div>
          
          <div className={`w-8 h-px ${selectedRestaurant ? 'bg-green-600' : 'bg-gray-300'}`} />
          
          <div className={`flex items-center ${selectedRestaurant ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              selectedRestaurant ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
            }`}>
              2
            </div>
            <span className="ml-2">Write Review</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {!selectedRestaurant ? (
          /* Step 1: Restaurant Selection */
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Which restaurant would you like to review?
              </h2>
              <p className="text-sm text-gray-600">
                Search for the restaurant using Google Places. We'll save it to our database if it's new.
              </p>
            </div>
            
            <RestaurantSelector
              onSelect={handleRestaurantSelect}
              selectedRestaurant={selectedRestaurant}
            />

            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                Can't find your restaurant? Make sure you're typing the exact name and location.
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Review Form */
          <div>
            <ReviewForm
              restaurant={selectedRestaurant}
              onCancel={handleCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}