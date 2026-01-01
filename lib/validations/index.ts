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
  cuisine: z.array(z.enum(CUISINES as unknown as [string, ...string[]])).default([]),
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

// ============================================================================
// DISH RATING SCHEMAS
// ============================================================================

// Schema for individual dish rating
export const dishRatingSchema = z.object({
  dish_name: z.string()
    .min(1, 'Dish name is required')
    .max(100, 'Dish name must be less than 100 characters')
    .transform((val) => val.trim()),
  rating: z.number()
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5')
    .refine(
      (val) => val * 10 === Math.floor(val * 10),
      { message: 'Rating must be in tenth-decimal increments (1.0, 1.1, ..., 5.0)' }
    ),
});

// Schema for dish autocomplete query
export const dishAutocompleteSchema = z.object({
  restaurant_id: z.string().uuid('Invalid restaurant ID'),
  query: z.string().max(100).optional().default(''),
});

// ============================================================================
// REVIEW SCHEMAS
// ============================================================================

// New review schema with dish-level ratings
export const reviewSchema = z.object({
  restaurant_id: z.string().uuid().optional(), // Optional when restaurant_data is provided
  rating_overall: z.number().min(1).max(5).refine(
    (val) => val * 10 === Math.floor(val * 10),
    { message: 'Rating must be in tenth-decimal increments (1.0, 1.1, 1.2, 1.3, ..., 4.8, 4.9, 5.0)' }
  ), // Main rating with tenth-decimal precision
  // New dish-level ratings (required, at least 1 dish)
  dish_ratings: z.array(dishRatingSchema)
    .min(1, 'At least one dish rating is required')
    .max(10, 'Maximum 10 dishes per review')
    .optional(), // Optional for backward compatibility with legacy reviews
  review: z.string().max(1000).optional().default(''), // Review text
  visit_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').default(() => new Date().toISOString()),
  visibility: z.enum(['my_circles', 'public']).default('my_circles'),
  // Legacy fields - kept for backward compatibility
  dish: z.string().max(200).optional().default(''), // Legacy single dish field
  recommend: z.boolean().optional(), // Legacy field
  tips: z.string().max(500).optional().default(''), // Legacy field
  tags: z.array(z.string()).max(5).optional().default([]), // Legacy field
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
  rating_overall: z.number().min(1).max(5).refine(
    (val) => val * 10 === Math.floor(val * 10), 
    { message: 'Rating must be in tenth-decimal increments' }
  ),
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
  full_name: z.string().min(1).max(150).optional(),
  home_city: z.string().max(50).optional(),
  avatar_url: z.string().url().optional(),
});

// Profile update schema (used in /api/users/profile PATCH)
export const profileUpdateSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => val.trim())
    .optional(),
  full_name: z.string()
    .min(1, 'Full name cannot be empty')
    .max(150, 'Full name must be less than 150 characters')
    .transform((val) => val.trim())
    .optional(),
  favorite_restaurants: z.array(
    z.string().uuid('Invalid restaurant ID')
  ).max(10, 'Maximum 10 favorite restaurants allowed').optional(),
});

// ============================================================================
// INVITE CODE VALIDATION SCHEMAS
// ============================================================================

export const inviteCodeValidationSchema = z.object({
  code: z.string()
    .min(6, 'Invite code must be 6 digits')
    .max(6, 'Invite code must be 6 digits')
    .regex(/^\d{6}$/, 'Invite code must contain only numbers'),
});

export const signupSchema = z.object({
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(150, 'Full name must be less than 150 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Full name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z.string()
    .email('Please enter a valid email address')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must be less than 255 characters')
    .toLowerCase(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string(),
  inviteCode: z.string()
    .min(6, 'Invite code must be 6 digits')
    .max(6, 'Invite code must be 6 digits')
    .regex(/^\d{6}$/, 'Invite code must contain only numbers'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const inviteCodeCreationSchema = z.object({
  code: z.string()
    .min(6, 'Invite code must be 6 digits')
    .max(6, 'Invite code must be 6 digits')
    .regex(/^\d{6}$/, 'Invite code must contain only numbers'),
  description: z.string().max(500).optional(),
  max_uses: z.number().int().min(1).max(1000).default(1),
  expires_at: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date').optional(),
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

// New invite code system exports
export type InviteCodeValidationInput = z.infer<typeof inviteCodeValidationSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type InviteCodeCreationInput = z.infer<typeof inviteCodeCreationSchema>;

// Dish rating system exports
export type DishRatingInput = z.infer<typeof dishRatingSchema>;
export type DishAutocompleteInput = z.infer<typeof dishAutocompleteSchema>;

// Profile update exports
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;