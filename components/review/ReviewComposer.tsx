'use client'

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { MapPin, Tag, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Restaurant } from '@/types';
import { RestaurantSelector } from '@/components/restaurant/RestaurantSelector';
import RatingInput from './RatingInput';
import { REVIEW_TAGS, TAG_CATEGORY_CONFIG } from '@/constants';
import { useCreateReview } from '@/lib/mutations/reviews';

const reviewSchema = z.object({
  restaurant: z.string().min(1, 'Please select a restaurant'),
  rating: z.number().min(1, 'Please give a rating').max(5),
  dish: z.string().min(1, 'What did you eat?'),
  review: z.string().min(10, 'Tell us more about your experience (minimum 10 characters)'),
  recommend: z.boolean(),
  tips: z.string().optional(),
  tags: z.array(z.string()).max(5, 'Maximum 5 tags allowed').optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewComposerProps {
  onClose: () => void;
  onSubmit: (success: boolean) => void;
  prefilledRestaurant?: Restaurant;
  preselectedRestaurant?: Restaurant;
}

const ReviewComposer: React.FC<ReviewComposerProps> = ({ 
  onClose, 
  onSubmit, 
  prefilledRestaurant,
  preselectedRestaurant 
}) => {
  const [selectedRestaurant, setSelectedRestaurant] = useState(prefilledRestaurant || preselectedRestaurant);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const createReviewMutation = useCreateReview();

  // Helper function to get tag category for styling
  const getTagCategory = (tag: string) => {
    for (const [category, tags] of Object.entries(REVIEW_TAGS)) {
      if ((tags as readonly string[]).includes(tag)) {
        return category as keyof typeof REVIEW_TAGS;
      }
    }
    return 'DISHES'; // fallback
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag) && selectedTags.length < 5) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      form.setValue('tags', newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    form.setValue('tags', newTags);
  };

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      restaurant: prefilledRestaurant?.name || '',
      rating: 0,
      dish: '',
      review: '',
      recommend: true,
      tips: '',
      tags: [],
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

  const handleSubmit = async (data: ReviewFormData) => {
    if (!user || !selectedRestaurant) {
      toast({
        title: "Error",
        description: "Please select a restaurant first.",
        variant: "destructive",
      });
      return;
    }

    // Ensure we have the restaurant ID (either from database or from Google Places)
    if (!selectedRestaurant.id) {
      toast({
        title: "Error", 
        description: "Restaurant information is incomplete. Please select a restaurant again.",
        variant: "destructive",
      });
      return;
    }
    
    // Map the form data to the API format
    const reviewData = {
      restaurant_id: selectedRestaurant.id,
      rating_overall: data.rating,
      dish: data.dish,
      review: data.review,
      recommend: data.recommend,
      tips: data.tips || '',
      tags: data.tags || [],
      visit_date: new Date().toISOString(),
      visibility: 'my_circles' as const,
    };

    createReviewMutation.mutate(reviewData, {
      onSuccess: () => {
        toast({
          title: "Review posted!",
          description: "Your review has been shared with your network.",
        });
        
        form.reset();
        setSelectedRestaurant(undefined);
        setSelectedTags([]);
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
            render={({ field }) => (
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

          {/* Tags Selection */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <Tag className="w-4 h-4" />
                  Tags (Optional - {selectedTags.length}/5)
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {/* Selected Tags Display */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => {
                          const category = getTagCategory(tag);
                          const config = TAG_CATEGORY_CONFIG[category];
                          return (
                            <Badge
                              key={tag}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border ${config.color} transition-colors`}
                            >
                              <span className="text-xs">{config.icon}</span>
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Tag Categories with Chips */}
                    {selectedTags.length < 5 && (
                      <div className="space-y-4">
                        {Object.entries(REVIEW_TAGS).map(([categoryKey, tags]) => {
                          const category = categoryKey as keyof typeof REVIEW_TAGS;
                          const config = TAG_CATEGORY_CONFIG[category];
                          const availableTags = tags.filter(tag => !selectedTags.includes(tag));
                          
                          if (availableTags.length === 0) return null;
                          
                          return (
                            <div key={categoryKey} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <span className="text-base">{config.icon}</span>
                                {config.label}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag) => (
                                  <button
                                    key={tag}
                                    type="button"
                                    onClick={() => addTag(tag)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${config.color} hover:scale-105`}
                                  >
                                    {tag}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedTags.length >= 5 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Maximum 5 tags selected. Remove a tag to add more.
                      </p>
                    )}
                  </div>
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
            disabled={createReviewMutation.isPending}
          >
            {createReviewMutation.isPending ? 'Posting...' : 'Share Review'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ReviewComposer;