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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/useAuth';
import SearchBar from '@/components/search/SearchBar';
import RatingInput from './RatingInput';
import { REVIEW_TAGS } from '@/constants';

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
  prefilledRestaurant?: any;
}

const ReviewComposer: React.FC<ReviewComposerProps> = ({ 
  onClose, 
  onSubmit, 
  prefilledRestaurant 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(prefilledRestaurant);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const handleRestaurantSelect = async (restaurant: any) => {
    setSelectedRestaurant(restaurant);
    
    // Always set the form field first to avoid validation errors
    form.setValue('restaurant', restaurant.name || restaurant);
    
    // If we have a Google Place ID, try to find or create the restaurant in the background
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
          // Update form with database restaurant name if different
          if (dbRestaurant.name !== restaurant.name) {
            form.setValue('restaurant', dbRestaurant.name);
          }
          // Store the database ID for later use in form submission
          setSelectedRestaurant({ ...restaurant, id: dbRestaurant.id });
        } else {
          console.error('Failed to create/find restaurant:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error finding/creating restaurant:', error);
      }
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
    
    setIsSubmitting(true);
    
    try {
      // Map the form data to the API format
      const reviewData = {
        restaurant_id: selectedRestaurant.id, // From the restaurant we selected
        rating_overall: data.rating,
        dish: data.dish,
        review: data.review,
        recommend: data.recommend,
        tips: data.tips || '',
        tags: data.tags || [],
        visit_date: new Date().toISOString(), // Current date
        visibility: 'my_circles' as const,
      };

      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle specific error cases with better messaging
        if (response.status === 409 || errorData.error?.includes('already reviewed')) {
          throw new Error('You have already reviewed this restaurant. Each user can only write one review per restaurant.');
        }
        
        throw new Error(errorData.error || 'Failed to create review');
      }

      const result = await response.json();
      
      toast({
        title: "Review posted!",
        description: "Your review has been shared with your network.",
      });
      
      form.reset();
      setSelectedRestaurant(null);
      onSubmit(true);
    } catch (error) {
      console.error('Error posting review:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post your review. Please try again.",
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

          {/* Tags Selection */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-base font-medium">
                  <Tag className="w-4 h-4" />
                  Tags (Optional - Max 5)
                </FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    {/* Selected Tags Display */}
                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:bg-gray-200 rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Tag Selection Dropdown */}
                    {selectedTags.length < 5 && (
                      <Select onValueChange={addTag}>
                        <SelectTrigger className="border-0 bg-gray-50 rounded-xl px-4 py-3">
                          <SelectValue placeholder="Add tags (cuisine, atmosphere, etc.)" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Cuisine Tags */}
                          <div className="p-2">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Cuisine
                            </div>
                            {REVIEW_TAGS.CUISINE.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                              <SelectItem key={tag} value={tag} className="cursor-pointer">
                                {tag}
                              </SelectItem>
                            ))}
                          </div>
                          
                          {/* Experience Tags */}
                          <div className="p-2">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Experience
                            </div>
                            {REVIEW_TAGS.EXPERIENCE.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                              <SelectItem key={tag} value={tag} className="cursor-pointer">
                                {tag}
                              </SelectItem>
                            ))}
                          </div>
                          
                          {/* Atmosphere Tags */}
                          <div className="p-2">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Atmosphere
                            </div>
                            {REVIEW_TAGS.ATMOSPHERE.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                              <SelectItem key={tag} value={tag} className="cursor-pointer">
                                {tag}
                              </SelectItem>
                            ))}
                          </div>
                          
                          {/* Dietary Tags */}
                          <div className="p-2">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Dietary
                            </div>
                            {REVIEW_TAGS.DIETARY.filter(tag => !selectedTags.includes(tag)).map((tag) => (
                              <SelectItem key={tag} value={tag} className="cursor-pointer">
                                {tag}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
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