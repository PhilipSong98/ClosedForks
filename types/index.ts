export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
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
  rating_overall: number;
  food: number;
  service: number;
  vibe: number;
  value: number;
  text?: string;
  visit_date: string;
  price_per_person?: number;
  visibility: 'my_circles' | 'public';
  created_at: string;
  updated_at: string;
  author?: User;
  restaurant?: Restaurant;
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