'use client'

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import SearchBar from '@/components/search/SearchBar';
import RatingInput from './RatingInput';

const reviewSchema = z.object({
  restaurant: z.string().min(1, 'Please select a restaurant'),
  rating: z.number().min(1, 'Please give a rating').max(5),
  dish: z.string().min(1, 'What did you eat?'),
  review: z.string().min(10, 'Tell us more about your experience (minimum 10 characters)'),
  recommend: z.boolean(),
  tips: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewComposerProps {
  onClose: () => void;
  onSubmit: (success: boolean) => void;
  prefilledRestaurant?: any;
}

const ReviewComposer: React.FC<ReviewComposerProps> = ({ 
  onClose, 
  onSubmit, 
  prefilledRestaurant 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(prefilledRestaurant);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      restaurant: prefilledRestaurant?.name || '',
      rating: 0,
      dish: '',
      review: '',
      recommend: true,
      tips: '',
    },
  });

  const handleRestaurantSelect = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    
    // If we have a Google Place ID, try to find or create the restaurant
    if (restaurant.google_place_id) {
      try {
        const response = await fetch('/api/restaurants/find-or-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            google_place_id: restaurant.google_place_id,
            name: restaurant.name,
            address: restaurant.address,
          }),
        });
        
        if (response.ok) {
          const { restaurant: dbRestaurant } = await response.json();
          form.setValue('restaurant', dbRestaurant.name);
        }
      } catch (error) {
        console.error('Error finding/creating restaurant:', error);
      }
    } else {
      form.setValue('restaurant', restaurant.name || restaurant);
    }
  };

  const handleSubmit = async (data: ReviewFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // For now, just show success message
      // TODO: Update API to handle simplified review format
      toast({
        title: "Review posted!",
        description: "Your review has been shared with your network.",
      });
      form.reset();
      onSubmit(true);
    } catch (error) {
      console.error('Error posting review:', error);
      toast({
        title: "Error",
        description: "Failed to post your review. Please try again.",
        variant: "destructive",
      });
      onSubmit(false);
    } finally {
      setIsSubmitting(false);
    }
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
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <MapPin className="w-4 h-4" />
                  Restaurant
                </FormLabel>
                <FormControl>
                  <SearchBar
                    placeholder="Search for a restaurant..."
                    onRestaurantSelect={handleRestaurantSelect}
                    className="border-0 bg-gray-50 rounded-xl px-4 py-3"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rating */}
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Rating</FormLabel>
                <FormControl>
                  <RatingInput
                    value={field.value}
                    onChange={field.onChange}
                    size="lg"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Dish */}
          <FormField
            control={form.control}
            name="dish"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">What did you eat?</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Margherita Pizza, Beef Tacos..." 
                    className="border-0 bg-gray-50 rounded-xl px-4 py-3"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Review */}
          <FormField
            control={form.control}
            name="review"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Your Review</FormLabel>
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

          {/* Recommend */}
          <FormField
            control={form.control}
            name="recommend"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border-0 bg-gray-50 p-6">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">Recommend to friends?</FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Would you recommend this place to your circle?
                  </p>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Tips */}
          <FormField
            control={form.control}
            name="tips"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">Pro Tips (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any tips for future visitors? Best time to go, what to order, etc."
                    className="min-h-[100px] border-0 bg-gray-50 rounded-xl px-4 py-3 resize-none"
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Share Review'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReviewComposer;