'use client'

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Restaurant } from '@/types';
import { RestaurantSelector } from '@/components/restaurant/RestaurantSelector';
import PrecisionRatingSelector from './PrecisionRatingSelector';
import { DishRatingsSection } from './DishRatingsSection';
import { useCreateReview } from '@/lib/mutations/reviews';

// Dish rating schema
const dishRatingSchema = z.object({
  dish_name: z.string().min(1, 'Dish name is required'),
  rating: z.number().min(1).max(5),
});

// Updated review schema with dish ratings
const reviewSchema = z.object({
  restaurant: z.string().min(1, 'Please select a restaurant'),
  rating: z.number().min(1, 'Please give a rating').max(5).refine(
    (val) => val * 10 === Math.floor(val * 10),
    { message: 'Rating must be in tenth-decimal increments' }
  ),
  dish_ratings: z.array(dishRatingSchema).min(1, 'Please rate at least one dish'),
  review: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface DishRatingValue {
  dish_name: string;
  rating: number;
}

interface ReviewComposerProps {
  onClose: () => void;
  onSubmit: (success: boolean) => void;
  prefilledRestaurant?: Restaurant;
  preselectedRestaurant?: Restaurant;
}

const ReviewComposer: React.FC<ReviewComposerProps> = ({
  onClose: _onClose,
  onSubmit,
  prefilledRestaurant,
  preselectedRestaurant
}) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState(prefilledRestaurant || preselectedRestaurant);
  const [dishRatings, setDishRatings] = useState<DishRatingValue[]>([{ dish_name: '', rating: 3.0 }]);
  const { user } = useAuth();
  const { toast } = useToast();
  const createReviewMutation = useCreateReview();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      restaurant: prefilledRestaurant?.name || '',
      rating: 3.0,
      dish_ratings: [{ dish_name: '', rating: 3.0 }],
      review: '',
    },
  });

  const handleRestaurantSelect = (restaurant: Restaurant | null) => {
    if (restaurant) {
      setSelectedRestaurant(restaurant);
      form.setValue('restaurant', restaurant.name || '');
    } else {
      setSelectedRestaurant(undefined);
      form.setValue('restaurant', '');
    }
  };

  const handleDishRatingsChange = (newDishRatings: DishRatingValue[]) => {
    setDishRatings(newDishRatings);
    form.setValue('dish_ratings', newDishRatings, { shouldValidate: true });
  };

  const handleSubmit = async (data: ReviewFormData) => {
    if (!user || !selectedRestaurant) {
      toast({
        title: "Error",
        description: "Please select a restaurant first.",
        variant: "destructive",
      });
      return;
    }

    // Filter out empty dish names
    const validDishRatings = dishRatings.filter(dr => dr.dish_name.trim() !== '');

    if (validDishRatings.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one dish with a name.",
        variant: "destructive",
      });
      return;
    }

    // Map the form data to the API format
    const reviewData = {
      rating_overall: data.rating,
      dish_ratings: validDishRatings,
      review: data.review || '',
      visit_date: new Date().toISOString(),
      visibility: 'my_circles' as const,
      // Include restaurant data for creation if it's from Google
      ...(selectedRestaurant.id ? { restaurant_id: selectedRestaurant.id } : { restaurant_data: selectedRestaurant }),
    };

    createReviewMutation.mutate(reviewData, {
      onSuccess: () => {
        toast({
          title: "Review posted!",
          description: "Your review has been shared with your network.",
        });

        form.reset();
        setSelectedRestaurant(undefined);
        setDishRatings([{ dish_name: '', rating: 3.0 }]);
        onSubmit(true);
      },
      onError: (error) => {
        console.error('Error posting review:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to post your review. Please try again.",
          variant: "destructive",
        });
        onSubmit(false);
      },
    });
  };

  return (
    <div className="p-8 space-y-8 bg-white">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Write a Review</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Restaurant Selection */}
          <FormField
            control={form.control}
            name="restaurant"
            render={({ field: _field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <MapPin className="w-4 h-4" />
                  Restaurant
                </FormLabel>
                <FormControl>
                  <RestaurantSelector
                    onSelect={handleRestaurantSelect}
                    selectedRestaurant={selectedRestaurant}
                    className="w-full"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Overall Rating */}
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Overall Rating</FormLabel>
                <FormControl>
                  <PrecisionRatingSelector
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dish Ratings Section */}
          <FormField
            control={form.control}
            name="dish_ratings"
            render={() => (
              <FormItem>
                <FormControl>
                  <DishRatingsSection
                    value={dishRatings}
                    onChange={handleDishRatingsChange}
                    restaurantId={selectedRestaurant?.id}
                    maxDishes={10}
                    disabled={!selectedRestaurant}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Review Text */}
          <FormField
            control={form.control}
            name="review"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  Your Review <span className="text-xs text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your experience..."
                    className="min-h-[120px] border-0 bg-gray-50 rounded-xl px-4 py-3 resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white rounded-xl py-4 text-base font-medium"
            size="lg"
            disabled={createReviewMutation.isPending || !selectedRestaurant}
          >
            {createReviewMutation.isPending ? 'Posting...' : 'Share Review'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReviewComposer;
