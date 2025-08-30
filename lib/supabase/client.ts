import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          home_city: string | null;
          role: 'user' | 'admin';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          home_city?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar_url?: string | null;
          home_city?: string | null;
          role?: 'user' | 'admin';
          created_at?: string;
        };
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          address: string;
          city: string;
          lat: number | null;
          lng: number | null;
          cuisine: string[];
          price_level: number;
          website_url: string | null;
          booking_url: string | null;
          phone: string | null;
          place_id: string | null;
          source: 'manual' | 'maps';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address: string;
          city: string;
          lat?: number | null;
          lng?: number | null;
          cuisine: string[];
          price_level: number;
          website_url?: string | null;
          booking_url?: string | null;
          phone?: string | null;
          place_id?: string | null;
          source?: 'manual' | 'maps';
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          city?: string;
          lat?: number | null;
          lng?: number | null;
          cuisine?: string[];
          price_level?: number;
          website_url?: string | null;
          booking_url?: string | null;
          phone?: string | null;
          place_id?: string | null;
          source?: 'manual' | 'maps';
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          restaurant_id: string;
          author_id: string;
          rating_overall: number;
          food: number;
          service: number;
          vibe: number;
          value: number;
          text: string | null;
          visit_date: string;
          price_per_person: number | null;
          visibility: 'my_circles' | 'public';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          author_id: string;
          rating_overall: number;
          food: number;
          service: number;
          vibe: number;
          value: number;
          text?: string | null;
          visit_date: string;
          price_per_person?: number | null;
          visibility?: 'my_circles' | 'public';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          author_id?: string;
          rating_overall?: number;
          food?: number;
          service?: number;
          vibe?: number;
          value?: number;
          text?: string | null;
          visit_date?: string;
          price_per_person?: number | null;
          visibility?: 'my_circles' | 'public';
          created_at?: string;
          updated_at?: string;
        };
      };
      review_photos: {
        Row: {
          id: string;
          review_id: string;
          path: string;
          width: number;
          height: number;
        };
        Insert: {
          id?: string;
          review_id: string;
          path: string;
          width: number;
          height: number;
        };
        Update: {
          id?: string;
          review_id?: string;
          path?: string;
          width?: number;
          height?: number;
        };
      };
      invites: {
        Row: {
          id: string;
          inviter_id: string;
          code: string;
          email: string | null;
          status: 'pending' | 'accepted' | 'expired';
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          inviter_id: string;
          code: string;
          email?: string | null;
          status?: 'pending' | 'accepted' | 'expired';
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          inviter_id?: string;
          code?: string;
          email?: string | null;
          status?: 'pending' | 'accepted' | 'expired';
          expires_at?: string;
          created_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          review_id: string;
          reporter_id: string;
          reason: string;
          status: 'pending' | 'resolved' | 'dismissed';
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          reporter_id: string;
          reason: string;
          status?: 'pending' | 'resolved' | 'dismissed';
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          reporter_id?: string;
          reason?: string;
          status?: 'pending' | 'resolved' | 'dismissed';
          created_at?: string;
        };
      };
    };
  };
};