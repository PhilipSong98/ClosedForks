export interface User {
  id: string;
  name: string;
  full_name?: string; // New field for full name
  email: string;
  avatar_url?: string;
  favorite_restaurants?: string[]; // Array of favorite restaurant IDs
  home_city?: string;
  role: 'user' | 'admin';
  created_at: string;
  password_set?: boolean;
  is_admin_user?: boolean;
  first_login_completed?: boolean;
  session_expires_at?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  cuisine: string[];
  price_level: 1 | 2 | 3 | 4;
  website_url?: string;
  booking_url?: string;
  phone?: string;
  place_id?: string;
  source: 'manual' | 'maps';
  created_at: string;
  avg_rating?: number;
  review_count?: number;
  google_place_id?: string;
  google_maps_url?: string;
  google_data?: GooglePlaceData;
  last_google_sync?: string;
  aggregated_tags?: string[]; // Tags aggregated from all reviews for this restaurant
}

export interface GooglePlaceData {
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    weekday_text?: string[];
  };
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  types?: string[];
  business_status?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
}

export interface Review {
  id: string;
  restaurant_id: string;
  author_id: string;
  // Legacy multi-dimensional ratings (optional for backward compatibility)
  rating_overall: number;
  food?: number;
  service?: number;
  vibe?: number;
  value?: number;
  text?: string; // Legacy review text
  // New simplified review fields (Lovable format)
  dish?: string;
  review?: string; // New review text field
  recommend?: boolean;
  tips?: string;
  // Common fields
  visit_date: string;
  price_per_person?: number;
  visibility: 'my_circles' | 'public';
  tags?: string[]; // Array of tags for categorization and filtering
  created_at: string;
  updated_at: string;
  // Relationship data (can be from different API response formats)
  author?: User;
  restaurant?: Restaurant;
  users?: User; // From join query
  restaurants?: Restaurant; // From join query
  photos?: ReviewPhoto[];
}

export interface ReviewPhoto {
  id: string;
  review_id: string;
  path: string;
  width: number;
  height: number;
}

export interface Invite {
  id: string;
  inviter_id: string;
  code: string;
  email?: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
  inviter?: User;
}

export interface Report {
  id: string;
  review_id: string;
  reporter_id: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  review?: Review;
  reporter?: User;
}

export interface UserList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  restaurants: string[];
  created_at: string;
  updated_at: string;
}

export interface MagicLinkRequest {
  id: string;
  email: string;
  requested_by_ip?: string;
  requested_by_user_agent?: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  processor?: User;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  passwordSet: boolean;
  isAdmin: boolean;
  firstLoginCompleted: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}

export interface MagicLinkRequestData {
  email: string;
  userAgent?: string;
  ipAddress?: string;
}

// ============================================================================
// INVITE CODE SYSTEM TYPES
// ============================================================================

export interface InviteCode {
  id: string;
  code: string;
  description?: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface InviteCodeUsage {
  id: string;
  invite_code_id: string;
  user_id: string;
  used_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface InviteCodeValidation {
  valid: boolean;
  message: string;
  code_id?: string;
  description?: string;
  uses_remaining?: number;
}

export interface InviteCodeUsageResult {
  success: boolean;
  message: string;
  code_id?: string;
}

// New auth flow types
export interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  inviteCode: string;
}

export interface InviteCodeSession {
  code: string;
  validatedAt: string;
  codeId: string;
}

export interface AuthError {
  message: string;
  code?: string;
  field?: string;
}