'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Restaurant } from '@/types';

interface ReviewFormProps {
  restaurant: Restaurant;
  onCancel: () => void;
}

interface RatingInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: React.ReactNode;
}

function RatingInput({ label, value, onChange, icon }: RatingInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {icon}
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-6 w-6 ${
                rating <= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              }`}
            />
          </button>
        ))}
        <span className="text-sm text-gray-600 ml-2">{value}/5</span>
      </div>
    </div>
  );
}

export function ReviewForm({ restaurant, onCancel }: ReviewFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    rating_overall: 5,
    food: 5,
    service: 5,
    vibe: 5,
    value: 5,
    text: '',
    visit_date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    price_per_person: '',
    visibility: 'my_circles' as 'my_circles' | 'public',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reviewData = {
        restaurant_id: restaurant.id,
        rating_overall: formData.rating_overall,
        food: formData.food,
        service: formData.service,
        vibe: formData.vibe,
        value: formData.value,
        text: formData.text.trim() || undefined,
        visit_date: formData.visit_date,
        price_per_person: formData.price_per_person ? parseFloat(formData.price_per_person) : undefined,
        visibility: formData.visibility,
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
        throw new Error(errorData.error || 'Failed to create review');
      }

      // Success! Navigate to restaurant page or reviews list
      router.push(`/restaurants/${restaurant.id}`);
    } catch (error) {
      console.error('Failed to create review:', error);
      alert(error instanceof Error ? error.message : 'Failed to create review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.rating_overall >= 1 &&
      formData.food >= 1 &&
      formData.service >= 1 &&
      formData.vibe >= 1 &&
      formData.value >= 1 &&
      formData.visit_date &&
      restaurant?.id
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write Your Review</CardTitle>
        <div className="text-sm text-gray-600">
          <div className="font-medium">{restaurant.name}</div>
          <div>{restaurant.address}, {restaurant.city}</div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-4">
            <RatingInput
              label="Overall Experience"
              value={formData.rating_overall}
              onChange={(value) => setFormData(prev => ({ ...prev, rating_overall: value }))}
            />
          </div>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RatingInput
              label="Food Quality"
              value={formData.food}
              onChange={(value) => setFormData(prev => ({ ...prev, food: value }))}
            />
            
            <RatingInput
              label="Service"
              value={formData.service}
              onChange={(value) => setFormData(prev => ({ ...prev, service: value }))}
            />
            
            <RatingInput
              label="Atmosphere & Vibe"
              value={formData.vibe}
              onChange={(value) => setFormData(prev => ({ ...prev, vibe: value }))}
            />
            
            <RatingInput
              label="Value for Money"
              value={formData.value}
              onChange={(value) => setFormData(prev => ({ ...prev, value: value }))}
            />
          </div>

          {/* Visit Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit_date" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Visit Date</span>
              </Label>
              <Input
                id="visit_date"
                type="date"
                value={formData.visit_date}
                onChange={(e) => setFormData(prev => ({ ...prev, visit_date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_per_person" className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4" />
                <span>Price per Person (optional)</span>
              </Label>
              <Input
                id="price_per_person"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_person}
                onChange={(e) => setFormData(prev => ({ ...prev, price_per_person: e.target.value }))}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review_text">Your Review (optional)</Label>
            <Textarea
              id="review_text"
              value={formData.text}
              onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Share your experience, favorite dishes, or any tips for other diners..."
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 text-right">
              {formData.text.length}/1000 characters
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Review Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: 'my_circles' | 'public') =>
                setFormData(prev => ({ ...prev, visibility: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="my_circles">My Network Only</SelectItem>
                <SelectItem value="public">Public</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose who can see your review
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Publishing Review...' : 'Publish Review'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}