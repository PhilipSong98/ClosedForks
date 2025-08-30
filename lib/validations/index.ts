import { z } from 'zod';
import { CUISINES } from '@/constants';

export const googlePlaceDataSchema = z.object({
  formatted_address: z.string(),
  formatted_phone_number: z.string().optional(),
  website: z.string().optional(),
  opening_hours: z.object({
    open_now: z.boolean().optional(),
    weekday_text: z.array(z.string()).optional(),
  }).optional(),
  photos: z.array(z.object({
    photo_reference: z.string(),
    height: z.number(),
    width: z.number(),
  })).optional(),
  types: z.array(z.string()).optional(),
  business_status: z.string().optional(),
  rating: z.number().optional(),
  user_ratings_total: z.number().optional(),
  price_level: z.number().optional(),
});

export const restaurantSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required').max(100),
  address: z.string().min(1, 'Address is required').max(200),
  city: z.string().min(1, 'City is required').max(50),
  cuisine: z.array(z.enum(CUISINES as [string, ...string[]])).default([]),
  price_level: z.number().int().min(1).max(4),
  website_url: z.string().url().optional().or(z.literal('')),
  booking_url: z.string().url().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  place_id: z.string().optional(),
  source: z.enum(['manual', 'maps']).default('manual'),
  google_place_id: z.string().optional(),
  google_maps_url: z.string().optional(),
  google_data: googlePlaceDataSchema.optional(),
  last_google_sync: z.string().optional(),
});

export const findOrCreateRestaurantSchema = z.object({
  google_place_id: z.string().optional(),
  name: z.string().min(1, 'Restaurant name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().optional(),
  phone: z.string().optional(),
  website_url: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  google_maps_url: z.string().optional(),
  google_data: googlePlaceDataSchema.optional(),
});

export const placesAutocompleteSchema = z.object({
  input: z.string().min(1),
  sessionToken: z.string(),
  country: z.string().optional().default('se'),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  radius: z.string().optional().default('50000'),
});

export const placeDetailsSchema = z.object({
  placeId: z.string().min(1),
});

// New simplified review schema for Lovable UI
export const reviewSchema = z.object({
  restaurant_id: z.string().uuid(),
  rating_overall: z.number().int().min(1).max(5), // Main rating (maps to lovable 'rating')
  dish: z.string().min(1, 'Please specify what dish you had').max(200),
  review: z.string().min(10, 'Review must be at least 10 characters').max(1000),
  recommend: z.boolean().default(true),
  tips: z.string().max(500).optional().default(''),
  visit_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').default(() => new Date().toISOString()),
  visibility: z.enum(['my_circles', 'public']).default('my_circles'),
  // Legacy fields - optional for backward compatibility
  food: z.number().int().min(1).max(5).optional(),
  service: z.number().int().min(1).max(5).optional(),
  vibe: z.number().int().min(1).max(5).optional(),
  value: z.number().int().min(1).max(5).optional(),
  text: z.string().max(1000).optional(),
  price_per_person: z.number().positive().optional(),
});

// Legacy schema for backward compatibility if needed
export const legacyReviewSchema = z.object({
  restaurant_id: z.string().uuid(),
  rating_overall: z.number().int().min(1).max(5),
  food: z.number().int().min(1).max(5),
  service: z.number().int().min(1).max(5),
  vibe: z.number().int().min(1).max(5),
  value: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
  visit_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
  price_per_person: z.number().positive().optional(),
  visibility: z.enum(['my_circles', 'public']).default('my_circles'),
});

export const inviteSchema = z.object({
  email: z.string().email().optional(),
  expires_at: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date'),
});

export const reportSchema = z.object({
  review_id: z.string().uuid(),
  reason: z.string().min(1, 'Reason is required').max(200),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  home_city: z.string().max(50).optional(),
  avatar_url: z.string().url().optional(),
});

export type GooglePlaceDataInput = z.infer<typeof googlePlaceDataSchema>;
export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type FindOrCreateRestaurantInput = z.infer<typeof findOrCreateRestaurantSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type LegacyReviewInput = z.infer<typeof legacyReviewSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type PlacesAutocompleteInput = z.infer<typeof placesAutocompleteSchema>;
export type PlaceDetailsInput = z.infer<typeof placeDetailsSchema>;