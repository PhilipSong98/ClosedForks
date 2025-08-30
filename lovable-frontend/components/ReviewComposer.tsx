import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import RatingInput from './RatingInput';
import SearchBar from './SearchBar';

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
  onSubmit: (data: ReviewFormData) => void;
  prefilledRestaurant?: string;
}

const ReviewComposer: React.FC<ReviewComposerProps> = ({ onClose, onSubmit, prefilledRestaurant }) => {
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      restaurant: prefilledRestaurant || '',
      rating: 0,
      dish: '',
      review: '',
      recommend: true,
      tips: '',
    },
  });

  const handleSubmit = (data: ReviewFormData) => {
    onSubmit(data);
    form.reset();
  };

  const handleRestaurantSelect = (restaurant: any) => {
    form.setValue('restaurant', typeof restaurant === 'string' ? restaurant : restaurant.name);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Write a Review</h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Restaurant Selection */}
          <FormField
            control={form.control}
            name="restaurant"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Restaurant
                </FormLabel>
                <FormControl>
                  <SearchBar
                    placeholder="Search for a restaurant..."
                    onRestaurantSelect={handleRestaurantSelect}
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
                <FormLabel>Rating</FormLabel>
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
                <FormLabel>What did you eat?</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Margherita Pizza, Beef Tacos..." {...field} />
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
                <FormLabel>Your Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about your experience..."
                    className="min-h-[100px]"
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
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Recommend to friends?</FormLabel>
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
                <FormLabel>Pro Tips (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any tips for future visitors? Best time to go, what to order, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg">
            Share Review
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReviewComposer;