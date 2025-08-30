import { z } from 'zod';
import { CUISINES } from '@/constants';

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
});

export const reviewSchema = z.object({
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

export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type InviteInput = z.infer<typeof inviteSchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;