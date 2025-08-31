# CLAUDE.md - AI Assistant Documentation

This file provides comprehensive context for AI assistants working on the Restaurant Reviews project.

## 🎯 Project Overview

**What**: Mobile-first, invite-only restaurant review platform for friends & family
**Goal**: Private network for trusted restaurant recommendations  
**Status**: Core MVP implemented with Instagram-style feed + Profile Page

### Core Business Rules
- **Private by default**: Only invited users can access
- **One review per user per restaurant**: No duplicate reviews
- **Network-based visibility**: Reviews visible to authenticated network members
- **Admin powers**: Admins can edit restaurants, resolve reports
- **Geographic focus**: City-based restaurant organization

## ✅ Current Implementation Status

### Core Features (Fully Operational)
- [x] Next.js 14 + TypeScript + App Router + Tailwind CSS + shadcn/ui
- [x] Supabase integration (auth + database + RLS policies)
- [x] **Modern invite code authentication system** with clean design
- [x] **DineCircle branding** - "Where Your Circle Dines" 
- [x] **6-digit invite code system** with exclusive landing page
- [x] **Clean modern UI** - Light gray/white professional design
- [x] **Fixed signup flow** - Resolved RLS policies, foreign key constraints, email confirmation
- [x] Instagram-style single-column review feed 
- [x] Dedicated restaurants page for discovery
- [x] Google Places API integration with cost optimization
- [x] Complete review system with tagging (35 food-focused tags)
- [x] **Enhanced filtering system** - Collapsed by default, rating/price/date controls
- [x] **Private network search** - Database-only search with proper error handling
- [x] **Restaurant detail pages** - Dual ratings, sidebar layout, grid reviews
- [x] Modal-based responsive UI (Sheet mobile, Dialog desktop)
- [x] Mobile-first responsive design
- [x] **Automatic data refresh** - React Query mutations with cache invalidation
- [x] **Profile page feature** - Complete user profiles with stats, reviews, and favorites management
- [x] **Fixed restaurant card overflow** - Create Review modal restaurant display optimized for mobile
- [x] **Fixed username display** - ReviewCard now shows actual usernames instead of "U"
- [x] **Fixed favorites search** - Restaurant search in favorites modal now finds results correctly

### Pending Features
- [ ] Photo upload for reviews
- [ ] Restaurant detail pages with maps
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Advanced user collections/lists

## 🏗️ Architecture & Key Files

### Project Structure
```
restaurant/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── home-client.tsx    # Instagram-style feed
│   ├── restaurants/       # Restaurant discovery page
│   └── profile/           # User profile page
├── components/
│   ├── filters/           # EnhancedFilters system  
│   ├── layout/            # Header, AuthWrapper, FABs
│   ├── profile/           # Profile components
│   ├── review/            # ReviewComposer, ReviewCard
│   ├── search/            # SearchBar, GlobalSearchModal
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Database clients & middleware
│   ├── hooks/             # useAuth, useMediaQuery, etc.
│   ├── mutations/         # React Query mutation hooks
│   ├── queries/           # React Query hooks for data fetching
│   └── validations/       # Zod schemas
├── supabase/migrations/   # Database migrations
└── constants/             # Tags, cuisines, cities
```

### Critical Files
- `app/welcome/page.tsx`: **NEW** - Modern landing page with 6-digit invite code entry
- `app/signup/page.tsx`: **NEW** - Complete account creation with validation
- `app/signin/page.tsx`: **NEW** - Email/password authentication (no magic links)
- `app/admin/invite-codes/page.tsx`: **NEW** - Admin invite code management
- `app/profile/page.tsx`: **NEW** - Complete profile page with stats and favorites
- `app/profile/profile-client.tsx`: **NEW** - Main profile component with tabs
- `app/home-client.tsx`: Instagram-style feed with filtering
- `app/restaurants/page.tsx`: Restaurant discovery page with clickable search
- `app/restaurants/[id]/restaurant-detail-client.tsx`: **UPDATED** - Hero image with gradient overlay
- `components/filters/EnhancedFilters.tsx`: Professional filter system
- `components/profile/ProfileHeader.tsx`: **NEW** - User stats and profile display
- `components/profile/EditProfileModal.tsx`: **NEW** - Simple name editing modal
- `components/profile/RecentReviews.tsx`: **NEW** - User reviews with pagination
- `components/profile/FavoritesSection.tsx`: **NEW** - Favorites management with search
- `components/review/ReviewComposer.tsx`: **UPDATED** - Modal-based review creation with automatic refresh
- `components/review/ReviewCard.tsx`: **FIXED** - Now displays actual usernames instead of "U"
- `components/restaurant/RestaurantSelector.tsx`: **UPDATED** - Fixed overflow issue with simplified restaurant card display
- `components/search/SearchBar.tsx`: **UPDATED** - Clickable search with navigation
- `components/search/GlobalSearchModal.tsx`: Search with keyboard shortcuts
- `lib/hooks/useAuth.ts`: Authentication with fallback handling
- `lib/mutations/reviews.ts`: **NEW** - React Query mutation for review creation with cache invalidation
- `lib/mutations/profile.ts`: **NEW** - Profile update mutations with optimistic updates
- `lib/queries/restaurants.ts`: **NEW** - React Query hooks for data fetching with automatic refresh
- `lib/queries/profile.ts`: **NEW** - React Query hooks for profile data and user reviews
- `lib/utils.ts`: `getRestaurantPhotoUrl()` for Google Places image optimization
- `app/restaurants/restaurants-client.tsx`: **UPDATED** - Uses React Query hooks for automatic data refresh
- `supabase/migrations/`: Database schema (use migrations, not schema.sql)

## 🗄️ Database Schema

### Core Tables
- `users`: User profiles with roles (user/admin) + `full_name` field + `favorite_restaurants` array
  - `favorite_restaurants`: UUID array field with GIN index for efficient queries
  - Limited to 10 favorites maximum per user
- `restaurants`: Restaurant data + Google Places integration
  - `google_place_id`, `google_maps_url`, `google_data`, `last_google_sync`
- `reviews`: Simplified rating system + tagging
  - `rating_overall`, `dish`, `review`, `recommend`, `tips`, `tags[]`
  - GIN index on tags for efficient filtering
- `invite_codes`: **NEW** - 6-digit code management system
  - `code`, `max_uses`, `current_uses`, `is_active`, `expires_at`
  - Rate limiting and usage tracking
- `invite_code_usage`: **NEW** - Audit trail for code usage
  - `invite_code_id`, `user_id`, `ip_address`, `user_agent`, `used_at`

### RLS Policies
- Network-based review visibility
- Users edit only their own content  
- Admins bypass restrictions

## 🔧 Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Create Supabase project and apply migrations: `supabase db push`
3. Configure environment variables
4. Run `npm install && npm run dev`

### Key Commands
```bash
npm run dev          # Development server
npm run build        # Production build  
npm run lint         # ESLint check
npm run type-check   # TypeScript validation
npm run db:migrate   # Apply migrations
```

### Database Changes
```bash
supabase migration new migration_name  # Create migration
supabase db push                       # Apply to remote
```

## 🎨 Current UI Architecture

### Instagram-Style Feed
- **Homepage**: Single-column review feed (max-width: 512px)
- **ReviewCard**: Large 4:3 images, user headers, inline tips, tag badges
- **Restaurants Page**: Separated discovery with SearchBar and filters

### Responsive System
- **Mobile**: Full-screen sheets, collapsible filters, touch-optimized
- **Desktop**: Centered dialogs, expanded filters, hover effects
- **Conditional Rendering**: `useMediaQuery` hook for Sheet vs Dialog

### Review Schema (Simplified)
```typescript
{
  rating_overall: number,  // Single 1-5 star rating
  dish: string,           // What did you eat?  
  review: string,         // Main review text
  recommend: boolean,     // Would recommend?
  tips?: string,          // Pro tips
  tags?: string[]         // Up to 5 tags from 35 options
}
```

## 🔍 Key Features

### Enhanced Filtering System
- **Tag-based**: 35 food-focused tags in 4 color-coded categories
- **Advanced Controls**: Rating slider, price range, date filters
- **Collapsed by Default**: Clean interface on both homepage and restaurants page
- **Mobile UX**: Expandable interface with live results counter
- **Real-time**: Client-side filtering for instant results

### Private Network Search
- **Database-Only**: Restaurant page search limited to private network
- **API**: `/api/search` searches only private reviews and restaurants
- **Enhanced UX**: Fixed React controlled input warnings, proper fallbacks
- **Smart Results**: Shows restaurants + restaurants from reviews with deduplication
- **Clickable Results**: Search results navigate directly to restaurant detail pages

### Restaurant Detail Pages
- **Hero Cover Images**: Full-width Google Places photos with gradient overlay
- **Professional Layout**: Restaurant name and location prominently displayed on hero
- **Dual Ratings**: Private network vs Google ratings comparison
- **Responsive Design**: 300px mobile, 400px desktop hero heights
- **Fallback Graphics**: Elegant gray gradient when no photo available
- **Next.js Optimization**: Optimized images with 800px resolution and priority loading

### Automatic Data Refresh System
- **React Query Integration**: Custom mutation hooks with automatic cache invalidation
- **Real-time Updates**: New reviews appear instantly across homepage and restaurant lists
- **Smart Cache Management**: Invalidates both 'reviews' and 'restaurants' query cache on creation
- **Seamless UX**: No manual refresh required, data stays synchronized
- **Key Components**: `useCreateReview()` mutation, `useRestaurantsWithReviews()` hook

### User Profile System
- **Complete Profile Pages**: Accessible at `/profile` with comprehensive user information
- **Profile Statistics**: Display review count and favorites count with real-time updates
- **Recent Reviews Tab**: Paginated user reviews using existing ReviewCard component
- **Favorites Management**: Up to 10 favorite restaurants with horizontal scroll display
- **Restaurant Search**: Integrated search modal for adding favorites with proper filtering
- **Edit Profile**: Simple modal for updating user display name (no image uploads)
- **Mobile-Responsive**: Sheet/Dialog components with `useMediaQuery` hook
- **React Query Integration**: Optimistic updates and cache management for profile changes
- **Database Optimization**: GIN index on favorite_restaurants array for efficient queries

### Google Places Integration
- **Stockholm-focused**: 50km bias, cost-optimized with session tokens
- **Auto-import**: Restaurant data, photos, hours on selection
- **Smart caching**: Store Google data permanently, refresh periodically
- **Hero Images**: Cover photos with `getRestaurantPhotoUrl()` utility

### Recent Bug Fixes & UI Improvements
- **Username Display Fix**: Fixed ReviewCard showing "U" instead of actual usernames
  - **Problem**: Profile reviews displayed "U" for all users instead of actual names
  - **Solution**: Fixed author name mapping in `/api/users/[id]/reviews` endpoint
  - **Result**: Profile page now correctly displays user names in review cards
  - **File**: `app/api/users/[id]/reviews/route.ts` - Added proper author name field mapping

- **Favorites Search Fix**: Resolved restaurant search not finding results in favorites modal
  - **Problem**: Search functionality in FavoritesSection wasn't filtering restaurant results
  - **Solution**: Fixed search filtering logic to properly match restaurant names
  - **Result**: Users can now successfully search and add restaurants to favorites
  - **File**: `components/profile/FavoritesSection.tsx` - Corrected search result filtering

- **Restaurant Card Overflow Fix**: Resolved horizontal scrolling in Create Review modal
  - **Problem**: Restaurant cards with long names/addresses caused modal overflow
  - **Solution**: Simplified display to show only restaurant name, city, and status
  - **Result**: Clean, mobile-optimized restaurant selection without scroll issues
  - **File**: `components/restaurant/RestaurantSelector.tsx` - Removed full address, cuisine type, Google ratings, and Maps links

- **Profile Picture Removal**: Completely removed image upload functionality as requested
  - **Removed**: Avatar upload API endpoint and related image handling code
  - **Result**: Clean profile system without image upload complexity
  - **File**: Deleted `app/api/upload/avatar/route.ts`

## 🔐 Authentication - Modern Invite Code System

### New Authentication Flow
1. **Landing Page** (`/welcome`) → Enter 6-digit invite code (test: `123456`)
2. **Code Validation** → Server-side validation with rate limiting (5 attempts/15min)
3. **Account Creation** (`/signup`) → Full name, email, password with strength validation
4. **Existing Users** (`/signin`) → Simple email/password login
5. **Session Management** → Secure cookies with 30-minute invite code sessions

### Key Features
- **Exclusive Design** - Clean, modern gray/white aesthetic
- **Individual Digit Inputs** - 6 separate input boxes with auto-focus
- **DineCircle Branding** - "Where Your Circle Dines" consistent across all pages
- **Admin Management** - `/admin/invite-codes` for code oversight
- **Security** - Rate limiting, session expiry, audit trails, RLS policies
- **Fixed Signup Issues** - Atomic user creation, resolved RLS conflicts, email auto-confirmation

### Test Access
- **Invite Code**: `123456` (50 uses, always active)
- **Admin Access**: Users with `is_admin_user = true` can access admin panel
- **Database Functions**: `validate_invite_code()` and `use_invite_code()` for server-side processing

## 📝 Common Tasks

### Adding API Endpoint
1. Create `app/api/[resource]/route.ts`
2. Add Zod validation in `lib/validations/`
3. Update TypeScript types

### Database Changes
1. `supabase migration new name`
2. Write SQL in migration file
3. `supabase db push`
4. Update types if needed

## 📋 Quick Reference

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### Key Constants
- Rating scale: 1-5 stars
- Price levels: 1-4 ($-$$$$)
- Max tags per review: 5
- Invite expiry: 7 days

### API Endpoints
- `GET /api/restaurants` - List restaurants
- `POST /api/reviews` - Create review  
- `GET /api/search?q=term` - Search reviews/restaurants
- `POST /api/invites` - Create invite
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `GET /api/users/[id]/reviews` - Get user's reviews with pagination

## 🚀 Next Steps
Ready for photo uploads for reviews, restaurant detail maps, and email notifications!

---
**Last Updated**: 2025-08-31  
**Status**: MVP v1.9 - Profile Page Feature Complete