# Technical Reference

This document contains detailed technical information about the DineCircle implementation.

## Database Migrations History

### Core System Migrations
- `20250829233334_reset_and_initialize_database.sql` - Complete database initialization with RLS policies
- `20250830094836_add_google_places_fields.sql` - Google Places integration fields
- `20250830154739_update_reviews_schema_for_lovable.sql` - Simplified review schema
- `20250830180128_add_tags_to_reviews.sql` - Professional tagging system with 35 food-focused tags
- `20250830203214_invite_code_system.sql` - Modern invite code system with 6-digit codes
- `20250831203848_add_to_eat_list_table.sql` - Restaurant wishlist system
- `20250831231918_add_review_likes_system.sql` - Instagram-style like system

### Group System Migrations
- `20250901142625_group_system_implementation.sql` - Initial group system with tables and RLS
- `20250901152334_fix_user_groups_rls_recursion.sql` - Fixed recursive RLS policies
- `20250901155104_comprehensive_database_fixes.sql` - Security functions and simplified policies
- `20250901160000_fix_ambiguous_columns_in_functions.sql` - Fixed PostgreSQL column ambiguity

### Performance Optimization Migrations
- `20250903_add_denormalized_aggregates.sql` - Cached aggregate columns for instant performance
- `20250903_add_optimized_functions.sql` - Single-query data fetching functions
- `20250903_add_performance_indexes.sql` - Critical performance indexes for query optimization
- `20250906150000_fix_ambiguous_group_id.sql` - Fixed column references in optimized functions
- `20250906150001_fix_restaurant_index.sql` - Fixed production database index issues
- `20250906151000_fix_trigger_recursion.sql` - Fixed trigger recursion problems

### User Experience Enhancement Migrations
- `20250907_make_review_fields_optional.sql` - Made dish and review fields optional for lazy review system
- `20250908195338_join_group_with_invite_code.sql` - Added join group functionality for existing groups
- `20250908204834_fix_join_group_ip_address.sql` - Simplified join group function without IP tracking

### Performance & Search Enhancement Migrations
- `20250909120000_add_trgm_and_search_indexes.sql` - Trigram search indexes for full-text search capabilities
- `20250909121000_add_group_reviews_optimized_and_toggle_like.sql` - Optimized group reviews with keyset pagination and atomic like toggle
- `20250909122000_update_optimized_functions_with_filters_and_groups_pagination.sql` - Enhanced optimized functions with restaurant filtering and pagination
- `20250921151102_fix_ambiguous_joined_at_in_get_user_groups.sql` - Fixed ambiguous column reference in get_user_groups function
- `20250922120000_allow_multiple_reviews_per_user_per_restaurant.sql` - Removed unique constraint to allow multiple reviews per user per restaurant
- `20251002191345_fix_toggle_like_ambiguous_column.sql` - Fixed ambiguous like_count column reference in toggle_review_like function

## Critical File Reference

### Authentication & Core Pages
- `app/welcome/page.tsx` - Modern landing page with 6-digit invite code entry
- `app/signup/page.tsx` - Complete account creation with validation
- `app/signin/page.tsx` - Email/password authentication (no magic links)
- `app/admin/invite-codes/page.tsx` - Admin invite code management

### Main Application Pages
- `app/home-client.tsx` - Instagram-style feed with filtering
- `app/restaurants/page.tsx` - Restaurant discovery page with clickable search
- `app/restaurants/[id]/restaurant-detail-client.tsx` - Hero image with gradient overlay
- `app/groups/page.tsx` - Groups page with membership display and editing functionality
- `app/groups/groups-client.tsx` - Groups client component with edit functionality
- `app/profile/page.tsx` - Complete profile page with stats and favorites
- `app/profile/profile-client.tsx` - Main profile component with tabs
- `app/to-eat/page.tsx` - Dedicated To-Eat List page for wishlist management
- `app/to-eat/to-eat-client.tsx` - To-Eat List client component with search and management

### Core UI Components
- `components/filters/SearchFilterBar.tsx` - Airbnb-style centralized search and filter bar with pills
- `components/ui/LikeButton.tsx` - Simplified like button using props directly, no local state sync
- `components/review/ReviewComposer.tsx` - Modal-based review creation with Quick/Detailed modes
- `components/review/ReviewCard.tsx` - Instagram-style like button with optimistic updates
- `components/restaurant/RestaurantSelector.tsx` - Fixed overflow issue with simplified restaurant card display
- `components/restaurant/ToEatButton.tsx` - Bookmark button for adding/removing from to-eat list

### Profile Components
- `components/profile/ProfileHeader.tsx` - User stats and profile display
- `components/profile/EditProfileModal.tsx` - Simple name editing modal
- `components/profile/RecentReviews.tsx` - User reviews with pagination
- `components/profile/FavoritesSection.tsx` - Favorites management with search
- `components/profile/ToEatSection.tsx` - To-Eat List management with unlimited capacity
- `components/profile/LikedReviews.tsx` - Liked posts tab with direct unlike functionality and pagination

### Group Management Components
- `components/groups/CreateGroupModal.tsx` - Modal component for creating new groups with browser extension protection
- `components/groups/EditGroupModal.tsx` - Modal component for editing group names with extension-resistant inputs
- `components/groups/InviteCodeModal.tsx` - Modal component for generating group invite codes
- `components/ui/extension-resistant-input.tsx` - Anti-browser extension input component

### Search & Navigation Components
- `components/search/SearchBar.tsx` - Clickable search with navigation
- `components/search/GlobalSearchModal.tsx` - Search with keyboard shortcuts
- `components/search/SearchFAB.tsx` - Repositioned to avoid header overlap on mobile
- `components/layout/MobileMenu.tsx` - Professional hamburger menu for mobile navigation
- `components/layout/Header.tsx` - Integrated MobileMenu for mobile devices
- `components/layout/NavigationProgress.tsx` - Global page load progress indicator with smooth animations
- `components/layout/NavigationProgressProvider.tsx` - Context provider managing navigation progress state

### Data Management Layer
- `lib/hooks/useAuth.ts` - Authentication with fallback handling
- `lib/mutations/reviews.ts` - React Query mutation for review creation with cache invalidation
- `lib/mutations/likes.ts` - Like/unlike mutations with optimistic updates and proper error handling
- `lib/mutations/profile.ts` - Profile update mutations with optimistic updates
- `lib/mutations/toEatList.ts` - To-Eat List mutations with optimistic updates
- `lib/mutations/groups.ts` - Group create/update mutations with optimistic updates
- `lib/mutations/inviteCode.ts` - React Query mutation for invite code generation
- `lib/queries/restaurants.ts` - React Query hooks for data fetching with automatic refresh
- `lib/queries/profile.ts` - React Query hooks for profile data and user reviews
- `lib/queries/toEatList.ts` - React Query hooks for to-eat list data with automatic refresh
- `lib/queries/likes.ts` - React Query hooks for user liked reviews with pagination and group filtering
- `lib/utils.ts` - Contains `getRestaurantPhotoUrl()` for Google Places image optimization

### Providers
- `app/providers.tsx` - Integrated NavigationProgressProvider for global progress tracking
- `app/restaurants/restaurants-client.tsx` - Uses React Query hooks for automatic data refresh

## Database Security Functions

### Group-Based Security
- `get_user_visible_reviews()` - Returns all reviews visible to the current user based on group membership
- `get_group_reviews(group_id)` - Returns all reviews for a specific group
- `get_group_members(group_id)` - Returns all members of a specific group
- `toggle_review_like()` - Atomic like/unlike operation with proper column disambiguation

### Performance Functions
- Optimized functions use denormalized aggregates for instant query performance
- All functions support cursor-based pagination for O(1) performance at any page
- Functions include restaurant filtering via optional `restaurant_id_filter` parameter

## Bug Fixes & Improvements History

### UI/UX Enhancements (October 2, 2025)
- **New Color Palette**: Wine red (#7B2C3A), sage green (#6E7F5C), gold (#C2A878)
- **Airbnb-Style SearchFilterBar**: Centralized search and filter UI with pill design
- **Simplified LikeButton**: Fixed NaN errors and layout jumps
- **Fixed toggle_review_like**: Resolved ambiguous column reference with table alias

### Database Access Fixes (September 7, 2025)
- **Fixed Public Profile 404**: Created `createServiceClient()` for RLS bypass
- **Fixed User Reviews Display**: Service role client pattern for complete data retrieval
- **Service Role Pattern**: Reusable pattern for admin operations with authentication validation

### Performance Optimizations (September 9, 2025)
- **Cursor-Based Pagination**: Migrated from offset to keyset pagination
- **Trigram Search Indexes**: Full-text search with pg_trgm extension
- **Database Function Optimizations**: Restaurant filtering, atomic operations, N+1 elimination
- **Join Group Feature**: Simplified workflow with proper validation

### Mobile & Navigation (Various)
- **Mobile Navigation**: Hamburger menu with proper touch targets
- **Restaurant Card Optimization**: Fixed overflow in Create Review modal
- **Global Navigation Progress**: Safari/YouTube-style progress bar
- **Extension-Resistant Inputs**: Protection against browser extension interference

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY=        # Supabase service role key (server-side only)
NEXT_PUBLIC_APP_URL=              # Application URL
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY= # Google Places API key
```

## Database Constants

- **Rating Scale**: 1-5 stars
- **Price Levels**: 1-4 ($-$$$$)
- **Max Tags Per Review**: 5 (from 35 available tags)
- **Max Favorites**: 10 restaurants per user
- **To-Eat List Capacity**: Unlimited
- **Invite Code Length**: 6 digits
- **Default Invite Expiry**: 7 days
- **Rate Limit**: 5 invite code attempts per 15 minutes

## Performance Metrics & Optimizations

### Font Optimization
- Inter font family with `display: swap` and preload
- Prevents Flash of Unstyled Text (FOUT)
- Next.js automatically optimizes and self-hosts fonts
- No external font requests, faster loading

### Image Optimization
- Remote patterns configured for Google Places and Supabase
- Priority loading for above-fold images
- Lazy loading for below-fold content
- 40-60% reduction in image payload

### Code Splitting
- ReviewComposer, SearchFAB, GlobalSearchModal load dynamically
- ~30% reduction in initial JavaScript bundle
- Smart preloading on hover for instant interactions
- Faster Time to Interactive (TTI) and First Contentful Paint (FCP)

### Progressive Web App (PWA)
- Service worker with @ducanh2912/next-pwa
- Offline support for critical pages
- Installable app manifest with wine red theme
- Native app-like experience

### Incremental Static Regeneration (ISR)
- Restaurant pages with 5-minute revalidation
- SEO-optimized metadata per restaurant
- Stale-while-revalidate pattern
- Lightning-fast loads with fresh content

### Database Performance
- Denormalized aggregates: `cached_avg_rating`, `cached_review_count`, `cached_tags`
- Trigger-based automatic updates
- Composite BTREE and GIN indexes for keyset pagination
- Trigram indexes for full-text search
- Cursor-based pagination (O(1) at any page)
- Optimized functions eliminate N+1 queries (75% query reduction)

## Google Places Integration Details

### Configuration
- **Geographic Focus**: Stockholm, Sweden (50km bias)
- **Cost Optimization**: Session tokens for autocomplete
- **Data Storage**: Permanent storage of Google data with periodic refresh

### Features
- Auto-import restaurant data on selection
- Photo retrieval with `getRestaurantPhotoUrl()` utility
- Business hours integration
- Google Maps URL storage
- Last sync timestamp tracking

### Image Optimization
- Next.js Image component with remote patterns
- Priority loading for hero images
- Lazy loading for card images
- Responsive sizing per device
- Fallback gradients when no photo available

---

**Last Updated**: 2025-10-04
**Purpose**: Technical reference for developers and AI assistants
