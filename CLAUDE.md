# CLAUDE.md - AI Assistant Documentation

This file provides comprehensive context for AI assistants working on the Restaurant Reviews project.

## 🎯 Project Overview

**What**: Mobile-first, invite-only restaurant review platform for friends & family
**Goal**: Private group-based network for trusted restaurant recommendations
**Status**: Core MVP with Group System - Airbnb-style UI + Group-Scoped Reviews + Profile Page + To-Eat List + Group Management

### Core Business Rules
- **Invite-Only Group System**: Users join groups via invite codes, reviews are scoped to groups
- **Group-Based Visibility**: Reviews visible only to users in the same groups
- **Multiple reviews allowed**: Users can create multiple reviews per restaurant
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
- [x] **Airbnb-style search & filter system** - Centralized SearchFilterBar with search, sort, tags, and advanced filters in pill format
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
- [x] **Simplified like system** - Streamlined LikeButton using React Query cache directly, no NaN errors or layout jumps
- [x] **Invite-Only Group System** - Users join groups via invite codes, reviews scoped to group membership
- [x] **Group-Scoped Feed** - Homepage shows reviews from users in the same groups
- [x] **Complete Group Management System** - Full create/edit functionality with browser extension protection
- [x] **Database Security Model** - Implemented with security functions instead of complex RLS policies
- [x] **Global Navigation Progress Indicator** - Sleek horizontal progress bar for page navigation with smooth animations
- [x] **Liked Posts Feature** - Private liked posts tab in profile with direct unlike functionality and group-scoped security
- [x] **Database Performance Optimizations** - Comprehensive performance improvements eliminating N+1 queries with 75% query reduction and O(1) pagination
- [x] **Lazy User Review System** - Quick Review mode allows restaurant + rating only, with optional detailed fields for comprehensive reviews
- [x] **Join Group Feature** - Users can join existing groups using invite codes with simplified validation flow
- [x] **Advanced Search Optimization** - Trigram search indexes for full-text search capabilities on restaurants and reviews
- [x] **Cursor-Based Pagination** - Keyset pagination across all API endpoints for consistent performance at scale
- [x] **Sophisticated color palette** - Wine red (#7B2C3A), sage green (#6E7F5C), and gold (#C2A878) theme replacing old purple/teal
- [x] **Modern UI improvements** - Cleaner restaurant cards with better image presentation and bookmark placement

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
│   ├── filters/           # SearchFilterBar (Airbnb-style), legacy EnhancedFilters
│   ├── groups/            # Group management components (CreateGroupModal, EditGroupModal, InviteCodeModal)
│   ├── layout/            # Header, AuthWrapper, FABs, MobileMenu, NavigationProgress
│   ├── profile/           # Profile components (includes ToEatSection, LikedReviews)
│   ├── restaurant/        # Restaurant components (includes ToEatButton)
│   ├── review/            # ReviewComposer, ReviewCard
│   ├── search/            # GlobalSearchModal, SearchFAB
│   └── ui/                # shadcn/ui components (includes LikeButton)
├── lib/
│   ├── supabase/          # Database clients & middleware
│   ├── hooks/             # useAuth, useMediaQuery, etc.
│   ├── mutations/         # React Query mutation hooks (includes toEatList.ts, groups.ts, inviteCode.ts)
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
- `components/filters/SearchFilterBar.tsx`: **NEW** - Airbnb-style centralized search and filter bar with pills
- `components/ui/LikeButton.tsx`: **UPDATED** - Simplified like button using props directly, no local state sync
- `components/profile/ProfileHeader.tsx`: **NEW** - User stats and profile display
- `components/profile/EditProfileModal.tsx`: **NEW** - Simple name editing modal
- `components/profile/RecentReviews.tsx`: **NEW** - User reviews with pagination
- `components/profile/FavoritesSection.tsx`: **NEW** - Favorites management with search
- `components/profile/ToEatSection.tsx`: **NEW** - To-Eat List management with unlimited capacity
- `components/profile/LikedReviews.tsx`: **NEW** - Liked posts tab with direct unlike functionality and pagination
- `components/restaurant/ToEatButton.tsx`: **NEW** - Bookmark button for adding/removing from to-eat list
- `components/groups/CreateGroupModal.tsx`: **NEW** - Modal component for creating new groups with browser extension protection
- `components/groups/EditGroupModal.tsx`: **NEW** - Modal component for editing group names with extension-resistant inputs
- `components/groups/InviteCodeModal.tsx`: **NEW** - Modal component for generating group invite codes
- `components/ui/extension-resistant-input.tsx`: **NEW** - Anti-browser extension input component
- `lib/mutations/inviteCode.ts`: **NEW** - React Query mutation for invite code generation
- `components/review/ReviewComposer.tsx`: **UPDATED** - Modal-based review creation with Quick/Detailed modes and automatic refresh
- `components/review/ReviewCard.tsx`: **UPDATED** - Instagram-style like button with optimistic updates, displays usernames correctly
- `components/restaurant/RestaurantSelector.tsx`: **UPDATED** - Fixed overflow issue with simplified restaurant card display
- `components/search/SearchBar.tsx`: **UPDATED** - Clickable search with navigation
- `components/search/GlobalSearchModal.tsx`: Search with keyboard shortcuts
- `components/search/SearchFAB.tsx`: **UPDATED** - Repositioned to avoid header overlap on mobile
- `components/layout/MobileMenu.tsx`: **NEW** - Professional hamburger menu for mobile navigation
- `components/layout/Header.tsx`: **UPDATED** - Integrated MobileMenu for mobile devices
- `components/layout/NavigationProgress.tsx`: **NEW** - Global page load progress indicator with smooth animations
- `components/layout/NavigationProgressProvider.tsx`: **NEW** - Context provider managing navigation progress state
- `app/providers.tsx`: **UPDATED** - Integrated NavigationProgressProvider for global progress tracking
- `lib/hooks/useAuth.ts`: Authentication with fallback handling
- `lib/mutations/reviews.ts`: **NEW** - React Query mutation for review creation with cache invalidation
- `lib/mutations/likes.ts`: **NEW** - Like/unlike mutations with optimistic updates and proper error handling
- `lib/mutations/profile.ts`: **NEW** - Profile update mutations with optimistic updates
- `lib/mutations/toEatList.ts`: **NEW** - To-Eat List mutations with optimistic updates
- `lib/mutations/groups.ts`: **NEW** - Group create/update mutations with optimistic updates
- `lib/queries/restaurants.ts`: **NEW** - React Query hooks for data fetching with automatic refresh
- `lib/queries/profile.ts`: **NEW** - React Query hooks for profile data and user reviews
- `lib/queries/toEatList.ts`: **NEW** - React Query hooks for to-eat list data with automatic refresh
- `lib/queries/likes.ts`: **NEW** - React Query hooks for user liked reviews with pagination and group filtering
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
- `restaurants`: Restaurant data + Google Places integration + **performance optimizations**
  - `google_place_id`, `google_maps_url`, `google_data`, `last_google_sync`
  - **Denormalized aggregates**: `cached_avg_rating`, `cached_review_count`, `cached_tags`, `last_review_at`
  - **Performance indexes**: Composite BTREE and GIN indexes for keyset pagination and query optimization
  - **Trigger-based maintenance**: Automatic updates of cached data on review changes
- `reviews`: Simplified rating system + tagging + like system + **group scoping** + **lazy review support**
  - `rating_overall`, `dish` (optional), `review` (optional), `recommend`, `tips`, `tags[]`, `like_count`, **`group_id`**
  - **Flexible Schema**: dish and review fields are optional, supporting both quick and detailed reviews
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

### Design System & Color Palette
- **Wine Red Primary** (#7B2C3A): Primary actions, buttons, links, brand color
- **Sage Green Secondary** (#6E7F5C): Secondary actions, success states, nature-inspired accents
- **Gold Accent** (#C2A878): Premium accents, highlights, decorative elements
- **Light Background** (#FAFAFA): Clean, minimal background with warm undertone
- **Professional Gray** (#2C2C2C): Text and foreground elements

### Modern Feed Layout
- **Homepage**: Single-column review feed (max-width: 512px)
- **ReviewCard**: Large 4:3 images, user headers, inline tips, tag badges, streamlined like button
- **Like System**: Simplified heart button using React Query cache, no NaN errors or layout jumps
- **Restaurants Page**: Airbnb-style SearchFilterBar with centralized controls

### Navigation & User Experience
- **Global Progress Indicator**: Safari/YouTube-style horizontal progress bar at top of viewport during navigation
- **Professional Animations**: Industry-standard progress timing (instant 30%, gradual to 80%, complete to 100%)
- **Navigation Integration**: Automatic detection of router.push/replace, link clicks, and browser navigation
- **Visual Feedback**: Blue progress bar with high z-index positioning, smooth fade-out transitions

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

### Review Schema (Flexible)
```typescript
{
  rating_overall: number,  // Single 1-5 star rating (required)
  dish?: string,          // What did you eat? (optional)
  review?: string,        // Main review text (optional)
  recommend: boolean,     // Would recommend? (required)
  tips?: string,          // Pro tips (optional)
  tags?: string[]         // Up to 5 tags from 35 options (optional)
}
```

## 🔍 Key Features

### Invite-Only Group System
- **Group Creation**: Invite codes create new groups or join existing ones
- **Group Membership**: Users can belong to multiple groups with different roles (owner/admin/member)
- **Join Existing Groups**: Users can join existing groups using invite codes through `/api/groups/join` endpoint
- **Review Scoping**: All reviews are scoped to groups - visible only within group boundaries
- **Invite Code Linking**: Each invite code can link to a specific group or auto-create groups
- **Security Functions**: Database functions handle complex group-based queries safely
- **Migration Support**: Existing users automatically added to "Family & Friends" default group
- **API Integration**: All review endpoints use group-aware security functions
- **Simplified Join Flow**: Streamlined `join_group_with_invite_code()` function without unnecessary audit tracking

### Airbnb-Style Search & Filter System
- **SearchFilterBar Component**: Centralized search and filter controls in pill format
- **Search Integration**: Clickable search bar opens GlobalSearchModal with keyboard shortcuts
- **Filter Pills**: Sort, Tags (with badge count), and More Filters buttons in horizontal layout
- **Tag-based Filtering**: 35 food-focused tags in 4 categories, shown in popovers and full dialog
- **Advanced Controls**: Rating slider, price level multi-select, all tags in "More Filters" dialog
- **Responsive Design**: Horizontal scroll on mobile, full layout on desktop
- **Real-time Filtering**: Client-side filtering for instant results
- **Visual Feedback**: Active filter counts, selected state styling, clear all functionality

### Component Reuse Guidelines (Important)
- Always reuse `components/review/ReviewCard.tsx` for review listings (home feed, profile, public profile)
- Always reuse `components/restaurant/RestaurantCard.tsx` for restaurant listings (restaurants page, favorites)
- If a list needs additional data (e.g., avg rating, review count), extend the API to provide it rather than forking the UI
- Current APIs enrich restaurants with `avg_rating` and `review_count` for consistent cards across pages

### Profiles
- Own Profile (`/profile`): Tabs → Favorites (default), Recent Reviews, Liked Posts, To‑Eat List
- Public Profile (`/profile/[id]`): Tabs → Favorites (default), Recent Reviews
- Privacy: Email is hidden on public profiles; public reviews are scoped to shared groups only

### API Notes
- `GET /api/users/[id]/public-profile`: Public profile with favorites enriched with avg rating and review count
- `GET /api/users/[id]/reviews`: Returns all reviews for own profile; returns only shared-group reviews for others
- `GET /api/users/profile`: Favorites enriched with avg rating and review count
- `GET /api/reviews`: Joins restaurants (includes `price_level`) and attaches computed stats for consistent `RestaurantCard`
- **Cursor-Based Pagination**: All endpoints support `cursor_created_at` and `cursor_id` parameters for keyset pagination
- **Restaurant Filtering**: Review endpoints accept optional `restaurant_id` parameter for filtering
- **Optimized Functions**: All major queries use optimized database functions to eliminate N+1 problems

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

### Simplified Like System
- **Streamlined LikeButton Component**: Uses props directly from React Query cache, no local state synchronization
- **No NaN Errors**: Proper validation ensures like counts are always valid numbers (defaults to 0)
- **No Layout Jumps**: Stable rendering without visual bouncing or state conflicts
- **Heart Button Interactions**: Red filled heart when liked, outline when not liked
- **One Like Per User**: Database constraint prevents duplicate likes per review
- **Optimistic Updates**: React Query handles optimistic mutations automatically
- **Like Counts**: Real-time display with tabular-nums for consistent spacing
- **Database Function**: `toggle_review_like()` with fixed ambiguous column references
- **Haptic Feedback**: Mobile vibration on like action for better UX
- **Accessibility**: Full keyboard support and ARIA labels
- **Liked Posts Collection**: Private profile tab showing user's liked reviews with direct unlike functionality

### User Profile System
- **Complete Profile Pages**: Accessible at `/profile` with comprehensive user information
- **Profile Statistics**: Display review count and favorites count with real-time updates
- **Four-Tab Interface**: Recent Reviews, Favorites (10 max), To-Eat List (unlimited), and Liked Posts (private)
- **Recent Reviews Tab**: Paginated user reviews using existing ReviewCard component with like functionality
- **Favorites Management**: Up to 10 favorite restaurants with horizontal scroll display
- **To-Eat List Management**: Unlimited restaurant wishlist with search and add functionality
- **Liked Posts Tab**: Private collection of user's liked reviews with direct unlike functionality
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

### Complete Group Management System
- **Groups Page**: Dedicated `/groups` page displaying all user's group memberships
- **Full Group Creation**: Administrators can create new groups with clean modal interface
  - **Create Button**: Plus icon for admins to create new groups
  - **Browser Extension Protection**: ExtensionResistantInput prevents extension interference
  - **Form Stability**: Optimized React component architecture prevents input blocking
  - **Admin Access**: Only users with admin role can create groups
- **Simplified Group Editing**: Clean name-only editing for group owners and admins
  - **Removed**: Description field from editing interface for cleaner UX
  - **Focused Design**: Single-field modal with essential functionality only
  - **Role-Based Access**: Only owners/admins can edit group names
  - **Extension Resistant**: Protected against browser password manager interference
- **Member Invite System**: Any group member can generate invite codes for their group
  - **Democratic Access**: All members (not just admins) can invite others to grow the group
  - **6-digit Codes**: Follows existing invite code patterns with group-specific linking
  - **Professional UI**: InviteCodeModal with copy-to-clipboard functionality
  - **Usage Tracking**: Shows expiration dates and usage limits for generated codes
- **Hover-to-Reveal**: Clean card interface with action buttons appearing on hover
  - **Create Button**: Plus icon for admins to create new groups
  - **Edit Button**: Pencil icon for owners/admins to edit group names
  - **Invite Button**: UserPlus icon for all members to generate invite codes
- **Responsive Design**: All modals use Sheet (mobile) / Dialog (desktop) pattern
- **Optimistic Updates**: Real-time UI updates with automatic rollback on errors
- **Security Validation**: Backend enforces permissions before allowing operations
- **Browser Extension Compatibility**: Comprehensive protection against form interference
  - **Anti-Extension Attributes**: Prevents LastPass, 1Password, Bitwarden interference
  - **Stable Event Handlers**: useCallback prevents function recreation issues
  - **Component Architecture**: FormContent extracted outside component functions
  - **Input Protection**: Custom ExtensionResistantInput component with fallback handling

### Lazy User Review System (Quick Reviews)
- **Dual Review Modes**: Quick Review (restaurant + rating only) vs Detailed Review (full form)
- **Progressive Enhancement**: Users can start with quick reviews and expand to detailed if desired
- **Collapsible Interface**: Detailed fields collapse by default, expandable with "Add more details" button
- **Flexible Validation**: Only restaurant selection and rating are required, all other fields optional
- **Smart UI**: ReviewComposer adapts interface based on user choice - minimal or comprehensive
- **Database Support**: Optional dish/review fields in schema with proper null handling
- **Backward Compatible**: Existing detailed reviews continue working unchanged
- **UX Optimization**: Reduces friction for casual users while maintaining depth for detailed reviewers
- **ReviewCard Enhancement**: Gracefully handles and displays minimal review data with fallback content
- **Migration Applied**: Database constraints updated to allow optional fields with temporary API fallbacks

### Google Places Integration
- **Stockholm-focused**: 50km bias, cost-optimized with session tokens
- **Auto-import**: Restaurant data, photos, hours on selection
- **Smart caching**: Store Google data permanently, refresh periodically
- **Hero Images**: Cover photos with `getRestaurantPhotoUrl()` utility


### Recent Bug Fixes & Critical Improvements

#### **UI/UX Enhancements & Database Fixes (October 2, 2025)**
- **New Color Palette**: Sophisticated wine red, sage green, and gold theme
  - **Wine Red Primary** (#7B2C3A): Replaced purple with professional burgundy tone
  - **Sage Green Secondary** (#6E7F5C): Natural, calming secondary color
  - **Gold Accent** (#C2A878): Premium highlights and decorative elements
  - **Result**: More sophisticated, restaurant-appropriate design language

- **Airbnb-Style SearchFilterBar**: Centralized search and filter UI component
  - **Problem**: Old EnhancedFilters component was cluttered and less intuitive
  - **Solution**: New SearchFilterBar with pill-based design, popovers, and full filter dialog
  - **Features**: Clickable search bar, sort pills, tag filters with counts, "More Filters" dialog
  - **Result**: Cleaner, more modern filtering experience matching industry standards

- **Simplified LikeButton Component**: Fixed NaN errors and layout jumps
  - **Problem**: Complex local state management caused NaN errors and visual bouncing
  - **Solution**: Streamlined component using props directly from React Query cache
  - **Features**: Proper number validation, no state synchronization, stable rendering
  - **Result**: Reliable like button with no visual glitches or layout shifts

- **Fixed toggle_review_like Database Function**: Resolved ambiguous column reference
  - **Problem**: PostgreSQL error due to ambiguous `like_count` column reference
  - **Solution**: Added table alias `r` to disambiguate column in query
  - **Migration**: `20251002191345_fix_toggle_like_ambiguous_column.sql`
  - **Result**: Like toggle function works reliably without database errors

- **Restaurant Card Improvements**: Cleaner design with better image presentation
  - **Images Fill Top**: Restaurant images now properly fill card tops
  - **Better Bookmark Placement**: To-eat bookmark button positioned correctly
  - **Consistent Styling**: Improved spacing and visual hierarchy

#### **Database Access & RLS Policy Fixes (September 7, 2025)**
- **Fixed Public Profile 404 Error**: Resolved PGRST116 errors in public profile endpoint
  - **Problem**: `/api/users/[id]/public-profile` endpoint failing due to RLS policy restrictions on user data access
  - **Solution**: Created `createServiceClient()` function in `/lib/supabase/server.ts` for secure admin operations that bypass RLS after authentication checks
  - **Result**: Public profiles now load correctly while maintaining security through proper authentication validation
  - **Technical**: Service role client pattern enables safe RLS bypassing for legitimate admin queries

- **Fixed User Reviews Display Issue**: Resolved user names showing as "U" in profile reviews
  - **Problem**: `/api/users/[id]/reviews` endpoint had RLS restrictions preventing proper user data fetching
  - **Solution**: Applied service role client pattern to enable complete user data retrieval
  - **Result**: Profile reviews now display actual usernames instead of fallback "U" values
  - **Security**: Maintains authentication checks while bypassing problematic RLS policies

- **Service Role Client Pattern**: Established reusable pattern for admin operations
  - **Implementation**: New `createServiceClient()` function for endpoints requiring RLS bypass
  - **Security Model**: Only used after proper authentication validation, never for public access
  - **Reusability**: Available for future endpoints with similar RLS complexity issues
  - **Files**: `lib/supabase/server.ts`, `app/api/users/[id]/public-profile/route.ts`, `app/api/users/[id]/reviews/route.ts`

#### **Performance & API Optimizations (September 9, 2025)**
- **Cursor-Based Pagination Implementation**: Migrated from offset-based to keyset pagination across all API endpoints
  - **Problem**: Large offset queries (OFFSET 1000) becoming slow and inconsistent at scale
  - **Solution**: Implemented cursor-based pagination using `cursor_created_at` and `cursor_id` parameters
  - **Result**: Consistent O(1) pagination performance regardless of dataset size
  - **Technical**: All major endpoints now support cursor pagination with optimized database functions

- **Advanced Search Optimization**: Implemented trigram search indexes for full-text search capabilities
  - **Features**: PostgreSQL pg_trgm extension with GIN indexes on restaurant names, addresses, and review content
  - **Performance**: Fast fuzzy matching and case-insensitive search across all text fields
  - **Coverage**: Restaurant names, cities, addresses, review text, dishes, and tips
  - **Benefits**: Enables powerful search functionality without external search services

- **Database Function Optimizations**: Enhanced all optimized functions with additional filtering and pagination
  - **Restaurant Filtering**: Added optional `restaurant_id_filter` parameter to group review functions
  - **Atomic Like Toggle**: Implemented `toggle_review_like()` function for consistent like state management
  - **Code Reduction**: Simplified API routes by 50% lines through better database function usage
  - **N+1 Elimination**: Comprehensive denormalization in database functions prevents query multiplication

- **Join Group Feature**: Streamlined group joining workflow for existing groups
  - **Endpoint**: New `/api/groups/join` endpoint for joining groups via invite codes
  - **Function**: Simplified `join_group_with_invite_code()` database function without unnecessary audit tracking
  - **UX**: Clean validation flow with proper error handling and success messaging
  - **Security**: Maintains all existing access controls while simplifying the join process

#### **UI & User Experience Improvements**
- **Mobile Navigation Enhancement**: Professional hamburger menu system with proper touch targets
- **Restaurant Card Optimization**: Fixed overflow in Create Review modal with simplified display
- **Group Management System**: Complete create/edit functionality with browser extension protection
- **Global Navigation Progress**: Safari/YouTube-style horizontal progress bar for page transitions
- **Extension-Resistant Inputs**: Comprehensive protection against browser extension interference
- **Liked Posts Collection**: Private profile tab for managing liked reviews with direct unlike functionality

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

### Applied Database Migrations

#### **Core System Migrations**
- `20250829233334_reset_and_initialize_database.sql` - Complete database initialization with RLS policies
- `20250830094836_add_google_places_fields.sql` - Google Places integration fields
- `20250830154739_update_reviews_schema_for_lovable.sql` - Simplified review schema
- `20250830180128_add_tags_to_reviews.sql` - Professional tagging system with 35 food-focused tags
- `20250830203214_invite_code_system.sql` - Modern invite code system with 6-digit codes
- `20250831203848_add_to_eat_list_table.sql` - Restaurant wishlist system
- `20250831231918_add_review_likes_system.sql` - Instagram-style like system

#### **Group System Migrations** 
- `20250901142625_group_system_implementation.sql` - Initial group system with tables and RLS
- `20250901152334_fix_user_groups_rls_recursion.sql` - Fixed recursive RLS policies
- `20250901155104_comprehensive_database_fixes.sql` - Security functions and simplified policies
- `20250901160000_fix_ambiguous_columns_in_functions.sql` - Fixed PostgreSQL column ambiguity

#### **Performance Optimization Migrations**
- `20250903_add_denormalized_aggregates.sql` - Cached aggregate columns for instant performance
- `20250903_add_optimized_functions.sql` - Single-query data fetching functions
- `20250903_add_performance_indexes.sql` - Critical performance indexes for query optimization
- `20250906150000_fix_ambiguous_group_id.sql` - Fixed column references in optimized functions
- `20250906150001_fix_restaurant_index.sql` - Fixed production database index issues
- `20250906151000_fix_trigger_recursion.sql` - Fixed trigger recursion problems

#### **User Experience Enhancement Migrations**
- `20250907_make_review_fields_optional.sql` - Made dish and review fields optional for lazy review system
- `20250908195338_join_group_with_invite_code.sql` - Added join group functionality for existing groups
- `20250908204834_fix_join_group_ip_address.sql` - Simplified join group function without IP tracking

#### **Performance & Search Enhancement Migrations**
- `20250909120000_add_trgm_and_search_indexes.sql` - Trigram search indexes for full-text search capabilities
- `20250909121000_add_group_reviews_optimized_and_toggle_like.sql` - Optimized group reviews with keyset pagination and atomic like toggle
- `20250909122000_update_optimized_functions_with_filters_and_groups_pagination.sql` - Enhanced optimized functions with restaurant filtering and pagination
- `20250921151102_fix_ambiguous_joined_at_in_get_user_groups.sql` - Fixed ambiguous column reference in get_user_groups function
- `20250922120000_allow_multiple_reviews_per_user_per_restaurant.sql` - Removed unique constraint to allow multiple reviews per user per restaurant
- `20251002191345_fix_toggle_like_ambiguous_column.sql` - Fixed ambiguous like_count column reference in toggle_review_like function

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
- `GET /api/users/liked-reviews` - Get user's liked reviews with pagination (private, group-scoped)
- `GET /api/users/to-eat-list` - Get user's to-eat list restaurants
- `POST /api/users/to-eat-list` - Add restaurant to to-eat list
- `DELETE /api/users/to-eat-list` - Remove restaurant from to-eat list
- `POST /api/reviews/[id]/like` - Toggle like/unlike status for a review
- `GET /api/reviews/[id]/like` - Get like status and count for a review
- `GET /api/groups` - Get user's groups (uses `get_user_groups()` function)
- `GET /api/groups/[id]/members` - Get group members (uses `get_group_members()` function)
- `PATCH /api/groups/[id]` - Update group name only (owners/admins only)
- `POST /api/groups` - Create new group (admin only)
- `POST /api/groups/[id]/invite-code` - Generate invite code for group (any member)
- `POST /api/groups/join` - Join existing group using invite code (simplified flow)



## 🚀 Next Steps
Ready for photo uploads for reviews, restaurant detail maps, and email notifications!

---
**Last Updated**: 2025-10-02
**Status**: MVP v1.23 - Airbnb-Style UI, New Color Palette & Simplified Like System
