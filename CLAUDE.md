# CLAUDE.md - AI Assistant Documentation

This file provides comprehensive context for AI assistants working on the Restaurant Reviews project.

## 🎯 Project Overview

**What**: Mobile-first, invite-only restaurant review platform for friends & family
**Goal**: Private group-based network for trusted restaurant recommendations  
**Status**: Core MVP with Group System - Instagram-style feed + Group-Scoped Reviews + Profile Page + To-Eat List + Group Management

### Core Business Rules
- **Invite-Only Group System**: Users join groups via invite codes, reviews are scoped to groups
- **Group-Based Visibility**: Reviews visible only to users in the same groups
- **One review per user per restaurant**: No duplicate reviews within groups
- **Group Admin Powers**: Group owners/admins can manage memberships and moderate content
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
- [x] **To-Eat List feature** - Complete restaurant wishlist system with unlimited capacity
- [x] **Fixed restaurant card overflow** - Create Review modal restaurant display optimized for mobile
- [x] **Fixed username display** - ReviewCard now shows actual usernames instead of "U"
- [x] **Fixed favorites search** - Restaurant search in favorites modal now finds results correctly
- [x] **Mobile navigation improvements** - Professional hamburger menu with proper touch targets and no FAB overlaps
- [x] **Instagram-style like system** - Heart button interactions with optimistic updates, like counts, and proper database triggers
- [x] **Invite-Only Group System** - Users join groups via invite codes, reviews scoped to group membership
- [x] **Group-Scoped Feed** - Homepage shows reviews from users in the same groups
- [x] **Group Name Editing** - Group owners and admins can edit group names and descriptions with responsive UI
- [x] **Database Security Model** - Implemented with security functions instead of complex RLS policies

### Pending Features
- [ ] Photo upload for reviews
- [ ] Restaurant detail pages with maps
- [ ] Email notifications
- [ ] Admin dashboard

## 🏗️ Architecture & Key Files

### Project Structure
```
restaurant/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── home-client.tsx    # Instagram-style feed
│   ├── restaurants/       # Restaurant discovery page
│   ├── profile/           # User profile page
│   └── to-eat/            # To-Eat List page
├── components/
│   ├── filters/           # EnhancedFilters system  
│   ├── groups/            # Group management components (EditGroupModal)
│   ├── layout/            # Header, AuthWrapper, FABs, MobileMenu
│   ├── profile/           # Profile components (includes ToEatSection)
│   ├── restaurant/        # Restaurant components (includes ToEatButton)
│   ├── review/            # ReviewComposer, ReviewCard
│   ├── search/            # SearchBar, GlobalSearchModal, SearchFAB
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Database clients & middleware
│   ├── hooks/             # useAuth, useMediaQuery, etc.
│   ├── mutations/         # React Query mutation hooks (includes toEatList.ts, groups.ts)
│   ├── queries/           # React Query hooks for data fetching (includes toEatList.ts)
│   └── validations/       # Zod schemas
├── supabase/migrations/   # Database migrations
└── constants/             # Tags, cuisines, cities
```

### Critical Files
- `app/welcome/page.tsx`: **NEW** - Modern landing page with 6-digit invite code entry
- `app/signup/page.tsx`: **NEW** - Complete account creation with validation
- `app/signin/page.tsx`: **NEW** - Email/password authentication (no magic links)
- `app/admin/invite-codes/page.tsx`: **NEW** - Admin invite code management
- `app/groups/page.tsx`: **NEW** - Groups page with membership display and editing functionality
- `app/groups/groups-client.tsx`: **NEW** - Groups client component with edit functionality
- `app/profile/page.tsx`: **NEW** - Complete profile page with stats and favorites
- `app/profile/profile-client.tsx`: **NEW** - Main profile component with tabs
- `app/to-eat/page.tsx`: **NEW** - Dedicated To-Eat List page for wishlist management
- `app/to-eat/to-eat-client.tsx`: **NEW** - To-Eat List client component with search and management
- `app/home-client.tsx`: Instagram-style feed with filtering
- `app/restaurants/page.tsx`: Restaurant discovery page with clickable search
- `app/restaurants/[id]/restaurant-detail-client.tsx`: **UPDATED** - Hero image with gradient overlay
- `components/filters/EnhancedFilters.tsx`: Professional filter system
- `components/profile/ProfileHeader.tsx`: **NEW** - User stats and profile display
- `components/profile/EditProfileModal.tsx`: **NEW** - Simple name editing modal
- `components/profile/RecentReviews.tsx`: **NEW** - User reviews with pagination
- `components/profile/FavoritesSection.tsx`: **NEW** - Favorites management with search
- `components/profile/ToEatSection.tsx`: **NEW** - To-Eat List management with unlimited capacity
- `components/restaurant/ToEatButton.tsx`: **NEW** - Bookmark button for adding/removing from to-eat list
- `components/groups/EditGroupModal.tsx`: **NEW** - Modal component for editing group names and descriptions
- `components/review/ReviewComposer.tsx`: **UPDATED** - Modal-based review creation with automatic refresh
- `components/review/ReviewCard.tsx`: **UPDATED** - Instagram-style like button with optimistic updates, displays usernames correctly
- `components/restaurant/RestaurantSelector.tsx`: **UPDATED** - Fixed overflow issue with simplified restaurant card display
- `components/search/SearchBar.tsx`: **UPDATED** - Clickable search with navigation
- `components/search/GlobalSearchModal.tsx`: Search with keyboard shortcuts
- `components/search/SearchFAB.tsx`: **UPDATED** - Repositioned to avoid header overlap on mobile
- `components/layout/MobileMenu.tsx`: **NEW** - Professional hamburger menu for mobile navigation
- `components/layout/Header.tsx`: **UPDATED** - Integrated MobileMenu for mobile devices
- `lib/hooks/useAuth.ts`: Authentication with fallback handling
- `lib/mutations/reviews.ts`: **NEW** - React Query mutation for review creation with cache invalidation
- `lib/mutations/likes.ts`: **NEW** - Like/unlike mutations with optimistic updates and proper error handling
- `lib/mutations/profile.ts`: **NEW** - Profile update mutations with optimistic updates
- `lib/mutations/toEatList.ts`: **NEW** - To-Eat List mutations with optimistic updates
- `lib/mutations/groups.ts`: **NEW** - Group update mutations with optimistic updates
- `lib/queries/restaurants.ts`: **NEW** - React Query hooks for data fetching with automatic refresh
- `lib/queries/profile.ts`: **NEW** - React Query hooks for profile data and user reviews
- `lib/queries/toEatList.ts`: **NEW** - React Query hooks for to-eat list data with automatic refresh
- `lib/utils.ts`: `getRestaurantPhotoUrl()` for Google Places image optimization
- `app/restaurants/restaurants-client.tsx`: **UPDATED** - Uses React Query hooks for automatic data refresh
- `supabase/migrations/`: Database schema (use migrations, not schema.sql)

## 🗄️ Database Schema

### Core Tables
- `users`: User profiles with roles (user/admin) + `full_name` field + `favorite_restaurants` array
  - `favorite_restaurants`: UUID array field with GIN index for efficient queries
  - Limited to 10 favorites maximum per user
- `groups`: **NEW** - Group system for invite-only access
  - `id`, `name`, `description`, `created_by`, `created_at`, `updated_at`
  - Groups organize users and scope review visibility
- `user_groups`: **NEW** - Junction table for group membership
  - `user_id`, `group_id`, `role` (owner/admin/member), `joined_at`
  - Composite unique constraint prevents duplicate memberships
- `restaurants`: Restaurant data + Google Places integration
  - `google_place_id`, `google_maps_url`, `google_data`, `last_google_sync`
- `reviews`: Simplified rating system + tagging + like system + **group scoping**
  - `rating_overall`, `dish`, `review`, `recommend`, `tips`, `tags[]`, `like_count`, **`group_id`**
  - Reviews are scoped to groups for visibility control
  - GIN index on tags for efficient filtering
- `review_likes`: Instagram-style like system
  - `review_id`, `user_id`, `created_at` (composite primary key)
  - Tracks individual user likes with one like per user per review
- `invite_codes`: 6-digit code management system **with group linking**
  - `code`, `max_uses`, `current_uses`, `is_active`, `expires_at`, **`group_id`**
  - Invite codes now link to specific groups or create new groups
  - Rate limiting and usage tracking
- `invite_code_usage`: Audit trail for code usage
  - `invite_code_id`, `user_id`, `ip_address`, `user_agent`, `used_at`
- `to_eat_list`: Restaurant wishlist system
  - `user_id`, `restaurant_id`, `added_at` (composite primary key)
  - GIN indexes for efficient queries, unlimited capacity

### Security Model
- **Simplified RLS Policies**: Non-recursive policies to avoid infinite loops
- **Security Functions**: `get_user_visible_reviews()`, `get_group_reviews()`, `get_group_members()`
- **Group-Based Access**: Reviews visible only within shared groups
- **Role-Based Permissions**: Group owners/admins can manage memberships
- **User Content Control**: Users can edit only their own reviews and memberships

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
- **ReviewCard**: Large 4:3 images, user headers, inline tips, tag badges, interactive heart button
- **Like System**: Red filled heart when liked, optimistic updates, real-time like counts
- **Restaurants Page**: Separated discovery with SearchBar and filters

### Responsive System
- **Mobile**: Full-screen sheets, collapsible filters, touch-optimized, hamburger menu navigation
- **Desktop**: Centered dialogs, expanded filters, hover effects, dropdown menu navigation
- **Conditional Rendering**: `useMediaQuery` hook for Sheet vs Dialog, MobileMenu vs dropdown

### Mobile Navigation Architecture
- **Header Layout**: DineCircle logo (left) + Hamburger menu (right) on mobile
- **MobileMenu Component**: Right-side Sheet with user profile section and navigation links
- **FAB Positioning**: SearchFAB at `bottom-24 right-6` (mobile) vs `top-4 right-4` (desktop)
- **Touch Targets**: Proper spacing and sizing for mobile interaction
- **No Overlaps**: Fixed SearchFAB overlapping with header elements
- **Navigation Items**: Restaurants, To-Eat List, Profile, Manage Invites, Admin Panel, Sign out

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

### Invite-Only Group System
- **Group Creation**: Invite codes create new groups or join existing ones
- **Group Membership**: Users can belong to multiple groups with different roles (owner/admin/member)
- **Review Scoping**: All reviews are scoped to groups - visible only within group boundaries
- **Invite Code Linking**: Each invite code can link to a specific group or auto-create groups
- **Security Functions**: Database functions handle complex group-based queries safely
- **Migration Support**: Existing users automatically added to "Family & Friends" default group
- **API Integration**: All review endpoints use group-aware security functions

### Enhanced Filtering System
- **Tag-based**: 35 food-focused tags in 4 color-coded categories
- **Advanced Controls**: Rating slider, price range, date filters
- **Collapsed by Default**: Clean interface on both homepage and restaurants page
- **Mobile UX**: Expandable interface with live results counter
- **Real-time**: Client-side filtering for instant results

### Group-Based Search System
- **Group-Scoped Search**: Restaurant page search limited to user's groups
- **API**: `/api/search` searches only group-accessible reviews and restaurants
- **Enhanced UX**: Fixed React controlled input warnings, proper fallbacks
- **Smart Results**: Shows restaurants + restaurants from reviews with deduplication
- **Clickable Results**: Search results navigate directly to restaurant detail pages
- **Security Functions**: Uses `get_user_visible_reviews()` for proper group filtering

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

### Instagram-Style Like System
- **Heart Button Interactions**: Red filled heart when liked, outline when not liked
- **One Like Per User**: Database constraint prevents duplicate likes per review
- **Optimistic Updates**: Instant UI feedback with automatic rollback on errors
- **Like Counts**: Real-time display of total likes with proper pluralization
- **API Endpoints**: Toggle like/unlike, get like status and count
- **Database Triggers**: Automatic like_count updates in reviews table
- **React Query Integration**: Proper cache invalidation and optimistic mutations
- **TypeScript Support**: Fully typed interfaces with comprehensive error handling

### User Profile System
- **Complete Profile Pages**: Accessible at `/profile` with comprehensive user information
- **Profile Statistics**: Display review count and favorites count with real-time updates
- **Three-Tab Interface**: Recent Reviews, Favorites (10 max), and To-Eat List (unlimited)
- **Recent Reviews Tab**: Paginated user reviews using existing ReviewCard component with like functionality
- **Favorites Management**: Up to 10 favorite restaurants with horizontal scroll display
- **To-Eat List Management**: Unlimited restaurant wishlist with search and add functionality
- **Restaurant Search**: Integrated search modal for adding to both favorites and to-eat list
- **Edit Profile**: Simple modal for updating user display name (no image uploads)
- **Mobile-Responsive**: Sheet/Dialog components with `useMediaQuery` hook
- **React Query Integration**: Optimistic updates and cache management for profile changes
- **Database Optimization**: GIN indexes on both favorite_restaurants array and to_eat_list table

### To-Eat List (Restaurant Wishlist) System
- **Unlimited Capacity**: No limit on to-eat list items (unlike 10-item favorites limit)
- **Dedicated Page**: Standalone `/to-eat` page for focused wishlist management
- **Profile Integration**: Third tab in profile page for easy access
- **Bookmark Button**: Hover-to-reveal bookmark button on restaurant cards
- **Professional UI**: Blue/indigo color scheme differentiating from red favorites
- **Optimistic Updates**: Instant UI feedback with automatic error rollback
- **Search Integration**: Reuses existing restaurant search API for adding items
- **Mobile-First Design**: Horizontal scroll on mobile, responsive grid on desktop
- **Consistent Card Heights**: Uniform layout with photo placeholders and proper spacing
- **Remove Functionality**: X button on hover (desktop) or always visible (mobile)
- **Empty States**: Engaging empty states with call-to-action buttons
- **Navigation Integration**: Added to both header navigation and mobile menu
- **TypeScript Support**: Fully typed interfaces with comprehensive error handling

### Group Management System
- **Groups Page**: Dedicated `/groups` page displaying all user's group memberships
- **Role-Based Editing**: Only group owners and admins can edit group names and descriptions
- **Hover-to-Edit**: Pencil icon appears on hover for authorized users, clean UI otherwise
- **Responsive Modal**: EditGroupModal uses Sheet (mobile) / Dialog (desktop) pattern
- **Form Validation**: Name required (1-100 chars), description optional (max 500 chars)
- **Optimistic Updates**: Real-time UI updates with automatic rollback on errors
- **Permission Control**: Backend API enforces role-based access via RLS policies
- **Default Group Names**: Groups created from invite codes get customizable names instead of generic defaults

### Google Places Integration
- **Stockholm-focused**: 50km bias, cost-optimized with session tokens
- **Auto-import**: Restaurant data, photos, hours on selection
- **Smart caching**: Store Google data permanently, refresh periodically
- **Hero Images**: Cover photos with `getRestaurantPhotoUrl()` utility

### Group System Implementation (September 1, 2025)

**Major Feature**: Complete invite-only group system with database security fixes

- **Invite-Only Groups**: Users join groups via invite codes, creating isolated review communities
  - **Problem**: Platform was a single network - all users could see all reviews
  - **Solution**: Implemented group-based access with invite codes linking to specific groups
  - **Result**: Private groups where reviews are visible only to group members
  - **Technical**: New `groups` and `user_groups` tables with role-based permissions

- **Group-Scoped Review Feed**: Homepage now shows reviews only from user's groups
  - **Problem**: Feed showed all reviews regardless of user relationships
  - **Solution**: Created `get_user_visible_reviews()` security function for group-based filtering
  - **Result**: Personalized feed showing only reviews from users in shared groups
  - **Performance**: Efficient queries using join operations on group membership

- **Database Security Model Overhaul**: Fixed RLS recursion issues with security functions
  - **Problem**: Complex RLS policies caused infinite recursion and 500 errors
  - **Solution**: Replaced complex policies with simple ones + security functions
  - **Result**: Stable database operations without recursion, proper access control
  - **Files**: 4 migration files applied to fix all security and performance issues

- **Invite Code Group Integration**: Invite codes now create or join specific groups
  - **Problem**: Invite codes only controlled access, didn't organize users
  - **Solution**: Enhanced invite system to link codes to groups or auto-create groups
  - **Result**: Seamless group creation during signup process
  - **Function**: `use_invite_code_with_group()` handles group assignment logic

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

- **Mobile Navigation Enhancement**: Implemented professional mobile menu system
  - **Problem**: SearchFAB overlapping with profile button, inaccessible Restaurants page on mobile
  - **Solution**: Created MobileMenu component with hamburger icon, repositioned SearchFAB
  - **Result**: Clean mobile header layout with proper touch targets and no overlapping elements
  - **Files**: `components/layout/MobileMenu.tsx` (new), `components/layout/Header.tsx`, `components/search/SearchFAB.tsx`

- **Group Name Editing Feature**: Added group customization for owners and admins
  - **Problem**: Groups had generic default names like "New Group from [invite_code]" with no way to customize
  - **Solution**: Implemented EditGroupModal with role-based permissions and responsive design
  - **Result**: Group owners/admins can now customize group names and descriptions for better organization
  - **Files**: `app/api/groups/[id]/route.ts` (PATCH method), `components/groups/EditGroupModal.tsx` (new), `lib/mutations/groups.ts` (new), `app/groups/groups-client.tsx` (updated)

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

### Group System Database Migrations (Applied)
- `20250901142625_group_system_implementation.sql` - Initial group system with tables and RLS
- `20250901152334_fix_user_groups_rls_recursion.sql` - Fixed recursive RLS policies
- `20250901155104_comprehensive_database_fixes.sql` - Security functions and simplified policies
- `20250901160000_fix_ambiguous_columns_in_functions.sql` - Fixed PostgreSQL column ambiguity

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
- `GET /api/restaurants` - List restaurants (group-scoped)
- `POST /api/reviews` - Create review (automatically scoped to user's groups)
- `GET /api/reviews` - Get reviews using group security functions
- `GET /api/search?q=term` - Search reviews/restaurants (group-scoped)
- `POST /api/invites` - Create invite with optional group linking
- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile
- `GET /api/users/[id]/reviews` - Get user's reviews with pagination (group-visible only)
- `GET /api/users/to-eat-list` - Get user's to-eat list restaurants
- `POST /api/users/to-eat-list` - Add restaurant to to-eat list
- `DELETE /api/users/to-eat-list` - Remove restaurant from to-eat list
- `POST /api/reviews/[id]/like` - Toggle like/unlike status for a review
- `GET /api/reviews/[id]/like` - Get like status and count for a review
- `GET /api/groups` - Get user's groups (uses `get_user_groups()` function)
- `GET /api/groups/[id]/members` - Get group members (uses `get_group_members()` function)
- `PATCH /api/groups/[id]` - Update group name and description (owners/admins only)

## 🚀 Next Steps
Ready for photo uploads for reviews, restaurant detail maps, and email notifications!

---
**Last Updated**: 2025-09-01  
**Status**: MVP v1.14 - Group Name Editing Feature Complete