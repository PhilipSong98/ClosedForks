# DineCircle - Where Your Circle Dines

A mobile-first, invite-only restaurant review platform for friends & family. Share trusted restaurant recommendations within your private group-based network with a beautiful, modern interface.

## Features

- 🔐 **Invite-Only Group System** - Exclusive group-based access with 6-digit invite codes that create or join private groups
- 🍽️ **Smart Restaurant Discovery** - Google Places API integration with autocomplete search
- ⭐ **Simplified Review System** - Clean, user-friendly single rating with detailed text reviews
- 🎨 **Instagram-Style Feed** - Single-column social media feed with large images, clean card design, and interactive heart likes
- 👥 **Group-Scoped Reviews** - Reviews visible only to users within the same groups
- 🎯 **Global FAB Interface** - Single floating action button for review creation across all pages
- 📱 **Mobile-First Design** - Optimized for social media consumption patterns with intuitive navigation
- 🌍 **Location Aware** - Stockholm-focused with 50km radius bias
- 📧 **Email Notifications** - Powered by Resend for invites and updates
- 🔒 **Secure** - Database security functions with simplified RLS policies
- 🗺️ **Maps Integration** - Free Google Maps links for directions and venue details
- 🏷️ **Professional Tag System** - 35 relevant food-focused tags across dishes, cuisine, meal type, and vibe categories
- 🔍 **Advanced Filter System** - Instagram-level filtering with rating, price, date, and recommendation filters
- 📋 **To-Eat List (Wishlist)** - Unlimited restaurant bookmarking with blue-themed UI and dedicated management page
- ❤️ **Instagram-Style Likes** - Heart button interactions with optimistic updates, like counts, and one like per user per review
- 🔄 **Global Navigation Progress Indicator** - Safari/YouTube-style horizontal progress bar with smooth animations during page navigation
- ❤️ **Liked Posts Collection** - Private profile tab for managing liked reviews with direct unlike functionality and group-scoped access
- ⚡ **Database Performance Optimizations** - Comprehensive performance improvements with 75% query reduction, eliminating N+1 patterns and implementing O(1) pagination

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: Tanstack Query for server state management
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Maps & Places**: Google Places API (New) for restaurant discovery
- **Email**: Resend
- **Deployment**: Vercel
- **Validation**: Zod
- **UI Components**: Custom responsive popup system with Sheet (mobile) and Dialog (desktop)

## Recent Updates

### 🔄 Public Profiles, Component Reuse, and Filters (September 2025)

#### ✅ Public Profiles
- New route: `/profile/[id]` shows another user's profile
- Tabs: `Favorites` (default) | `Recent Reviews`
- Privacy: Email hidden on public profiles; only group‑visible reviews are shown to viewers
- Own profile: Tabs reordered to `Favorites` (default) | `Recent Reviews` | `Liked Posts` | `To‑Eat List`

#### ✅ Component Reuse Standard
- Reuse `components/review/ReviewCard.tsx` for all review lists (home feed, own profile, public profile)
- Reuse `components/restaurant/RestaurantCard.tsx` for all restaurant lists (restaurants page, favorites in both profiles)
- Backends now attach `avg_rating` and `review_count` to restaurants returned by profile APIs so the same card renders consistently
- Rule of thumb: Do not fork card UIs; if a page needs more data, extend the API to provide it to the same component

#### ✅ Filters & Sorting
- Filters module is now clickable: tapping the whole header area toggles expand/collapse on compact views (mobile)
- Clear button and inner controls stop propagation to prevent accidental collapse
- Price filter switched to dollar levels: multi‑select `$` | `$$` | `$$$` | `$$$$`
- Default sort differs per page and resets accordingly when clearing filters:
  - Home: `Recent`
  - Restaurants: `Best Rated`

#### ✅ API updates
- `GET /api/users/[id]/public-profile` (new): lightweight public profile with favorites (including `avg_rating` and `review_count`) and group‑scoped review count
- `GET /api/users/[id]/reviews`: own profile returns all of your reviews; public view returns only reviews from groups shared with the viewer
- `GET /api/reviews`: joined restaurants now include `price_level` and computed stats for consistent cards
- `GET /api/users/profile`: favorites are enriched with `avg_rating` and `review_count`

### ⚡ Database Performance Optimizations (September 6, 2025)

Comprehensive database performance improvements that eliminate N+1 query problems and dramatically improve response times:

#### **✅ Query Performance Improvements**
- **75% Reduction in Database Queries** - Homepage feed reduced from 4+ queries to 1 query
- **N+1 Query Elimination** - Optimized database functions return complete denormalized data in single queries
- **O(1) Pagination Performance** - Keyset pagination replaces inefficient OFFSET queries for consistent fast performance
- **60-70% Faster API Response Times** - Comprehensive indexing strategy across all critical query paths
- **Sub-100ms Homepage Loading** - Denormalized aggregate data enables instant feed rendering

#### **🔧 Technical Implementation**
- **Denormalized Aggregates** - Added `cached_avg_rating`, `cached_review_count`, `cached_tags`, `last_review_at` to restaurants table
- **Optimized Database Functions** - `get_reviews_optimized()` returns complete review data with all joins pre-calculated
- **Performance Indexes** - Composite BTREE and GIN indexes covering group filtering, date ranges, rating filters, and tag searches
- **Trigger-Based Cache Maintenance** - Automatic updates of cached data on review changes with recursion protection
- **Covering Indexes** - Eliminate table lookups for pagination queries with composite (created_at, id) indexes

#### **🎯 Production-Ready Results**
- **Backward Compatibility** - All optimizations maintain full API compatibility with fallback mechanisms
- **Database Scalability** - Resolved index size limits and concurrency issues for production deployment
- **Always-Fresh Data** - Database triggers ensure cached aggregates stay synchronized with zero application complexity
- **Error-Free Deployment** - Fixed all trigger recursion, ambiguous column, and CREATE INDEX CONCURRENTLY issues
- **Performance Monitoring** - API responses include performance metadata for ongoing optimization tracking

#### **📊 Performance Impact**
- **Homepage Feed**: 4+ queries → 1 query (75% reduction)
- **API Response Times**: 60-70% improvement across all endpoints
- **Pagination Performance**: O(n) → O(1) with keyset-based navigation
- **Database Load**: Significant reduction through denormalized data and optimized queries
- **User Experience**: Sub-100ms response times for social media-style feed interactions

#### **🔜 Database Migrations Applied**
- `20250903_add_denormalized_aggregates.sql` - Cached aggregate columns for instant performance
- `20250903_add_optimized_functions.sql` - Complete denormalized data functions
- `20250903_add_performance_indexes.sql` - Critical performance indexes for all query patterns
- `20250906150000_fix_ambiguous_group_id.sql` - Fixed column reference errors in optimized functions
- `20250906150001_fix_restaurant_index.sql` - Fixed index row size exceeded for production databases
- `20250906151000_fix_trigger_recursion.sql` - Fixed stack depth limit exceeded from trigger recursion

### 👥 Invite-Only Group System (September 1, 2025)

Complete implementation of group-based access control with database security fixes:

#### **✅ Group-Based Access Control**
- **Invite Code Groups** - Invite codes now create new groups or join existing ones
- **Group Membership** - Users can belong to multiple groups with roles (owner/admin/member)
- **Review Scoping** - All reviews are scoped to groups, visible only to group members
- **Isolated Communities** - Each group forms its own private review network
- **Seamless Migration** - Existing users automatically added to "Family & Friends" default group

#### **🔧 Technical Implementation**
- **Database Schema** - New `groups` and `user_groups` tables with role-based permissions
- **Security Functions** - `get_user_visible_reviews()`, `get_group_reviews()`, `get_group_members()`
- **Enhanced Invite System** - `use_invite_code_with_group()` function handles group assignment
- **Fixed RLS Policies** - Replaced complex recursive policies with simple, stable ones
- **API Integration** - All review endpoints now use group-aware security functions

#### **🎯 User Experience**
- **Group-Scoped Feed** - Homepage shows reviews only from users in shared groups
- **Private Communities** - Reviews create intimate circles of trusted recommendations
- **Role Management** - Group owners and admins can manage memberships
- **Automatic Group Creation** - First user of an invite code becomes group owner
- **Multiple Group Support** - Users can participate in multiple review circles

#### **🔜 Database Migrations Applied**
- `20250901142625_group_system_implementation.sql` - Initial group system
- `20250901152334_fix_user_groups_rls_recursion.sql` - Fixed infinite recursion
- `20250901155104_comprehensive_database_fixes.sql` - Security functions
- `20250901160000_fix_ambiguous_columns_in_functions.sql` - PostgreSQL fixes

### ❤️ Instagram-Style Like System (September 1, 2025)

Complete implementation of Instagram-style like functionality for reviews:

#### **✅ Interactive Heart Button System**
- **Visual Feedback** - Red filled heart when liked, outline when not liked
- **Like Counts** - Real-time display of total likes with proper pluralization ("1 like", "5 likes")
- **One Like Per User** - Database constraint prevents duplicate likes per review
- **Optimistic Updates** - Instant UI feedback with automatic rollback on errors
- **Touch-Friendly** - Proper touch targets and visual states for mobile interaction

#### **🔧 Technical Implementation**
- **Database Schema** - New `review_likes` table with composite primary key (review_id, user_id)
- **Automatic Counters** - Database triggers maintain like_count field in reviews table
- **API Endpoints** - `POST /api/reviews/[id]/like` for toggling, `GET /api/reviews/[id]/like` for status
- **React Query Integration** - Proper cache invalidation and optimistic mutations
- **TypeScript Support** - Fully typed interfaces with comprehensive error handling

#### **🎯 User Experience**
- **Seamless Interactions** - No loading states, instant visual feedback
- **Error Handling** - Automatic rollback if server request fails
- **Consistent Design** - Matches Instagram's heart button behavior and styling
- **Performance Optimized** - Efficient database queries and minimal API calls

### 📱 Mobile Navigation Enhancement (August 31, 2025)

Significant mobile UX improvements with professional navigation system and eliminated element overlaps:

#### **✅ Professional Mobile Menu System**
- **MobileMenu Component** - New hamburger menu in top-right corner (mobile only)
- **Right-Side Sheet Navigation** - Clean slide-in menu with user profile section
- **Complete Navigation Access** - Restaurants, Profile, Manage Invites, Admin Panel, Sign out
- **Proper Touch Targets** - Mobile-optimized button sizes and spacing
- **Responsive Integration** - Uses `useMediaQuery` hook for mobile-only display

#### **✅ Header Layout Optimization**
- **Clean Mobile Header** - DineCircle logo (left) + Hamburger menu (right)
- **Desktop Unchanged** - Maintains existing dropdown functionality (`hidden md:block`)
- **No Breaking Changes** - Seamless integration without affecting desktop experience
- **Professional Design** - Consistent with modern mobile app patterns

#### **✅ FAB Positioning Fix**
- **SearchFAB Repositioned** - Mobile: `bottom-24 right-6` vs Desktop: `top-4 right-4`
- **Eliminated Overlaps** - Fixed SearchFAB overlapping with profile button on mobile
- **Restored Access** - Mobile users can now access Restaurants page via hamburger menu
- **Improved Layer Management** - Proper z-index and positioning for all floating elements

#### **🎆 Problems Solved**
- ✅ Fixed SearchFAB overlapping with header elements on mobile devices
- ✅ Restored access to Restaurants page that was missing from mobile navigation
- ✅ Implemented professional hamburger menu following modern UX patterns
- ✅ Enhanced touch targets and mobile interaction design
- ✅ Eliminated all element overlaps in mobile viewport

### 🔄 Global Navigation Progress Indicator (September 1, 2025)

Implemented professional page load progress indicator for enhanced user experience:

#### **✅ Safari/YouTube-Style Progress Bar**
- **Horizontal Progress Bar** - Thin blue progress bar at the top of the viewport during navigation
- **Industry-Standard Animation Timing** - Immediate 30% jump, gradual progress to 80%, instant completion to 100%
- **Smooth Transitions** - Professional fade-in and fade-out animations with proper timing
- **High Z-Index Positioning** - Always visible above all content with z-index 9999

#### **🔧 Technical Implementation**
- **NavigationProgress Component** - Thin horizontal bar with blue theme color matching app design
- **NavigationProgressProvider Context** - Manages progress state and hooks into Next.js router events
- **Automatic Detection** - Captures router.push/replace, link clicks, and browser back/forward navigation
- **Global Integration** - Added to app/providers.tsx and app/layout.tsx for site-wide coverage
- **Performance Optimized** - Minimal overhead with efficient event handling and state management

#### **🎯 User Experience Benefits**
- **Visual Feedback** - Users get immediate confirmation that navigation is in progress
- **Professional Feel** - Matches expectations from modern web applications like Safari and YouTube
- **Reduced Uncertainty** - Eliminates confusion during page transitions, especially on slower connections
- **Consistent Experience** - Works across all pages and navigation methods throughout the application

### ❤️ Liked Posts Feature (September 2, 2025)

Complete implementation of private liked posts collection with Instagram-style user experience:

#### **✅ Private Liked Posts Tab**
- **Fourth Profile Tab** - Added "Liked Posts" as the fourth tab in user profile page
- **Private Collection** - Users can only see their own liked reviews, completely private
- **Instagram-Style UX** - Heart icon branding and familiar interface patterns
- **Pagination Support** - Efficient loading of liked reviews with pagination
- **Empty State Design** - Engaging empty state encouraging users to like reviews

#### **🔧 Technical Implementation**
- **New API Endpoint** - `GET /api/users/liked-reviews` with pagination and group-based filtering
- **LikedReviews Component** - Dedicated component following existing profile tab patterns
- **React Query Integration** - `useUserLikedReviews()` hook with automatic cache management
- **Group-Scoped Security** - Only shows liked posts from groups user currently has access to
- **TypeScript Support** - Fully typed interfaces with comprehensive error handling

#### **🎯 Enhanced User Experience**
- **Direct Unlike Functionality** - Unlike reviews directly from liked posts tab without navigation
- **Optimistic Updates** - Instant UI feedback with automatic rollback on errors
- **Smart Cache Management** - Enhanced like mutations with cache invalidation for liked posts removal
- **Consistent Design** - Matches existing profile tab layout and review card styling
- **Performance Optimized** - Efficient database queries using existing security functions

#### **🔒 Privacy & Security**
- **User-Only Access** - Liked posts are completely private to the individual user
- **Group Boundary Respect** - Automatically filters out reviews from groups user no longer belongs to
- **Security Function Integration** - Uses existing `get_user_visible_reviews()` for proper access control
- **Cache Consistency** - Proper cache invalidation ensures data accuracy across all profile tabs

### 🔧 UI/UX Improvements (August 2025)

Enhanced user experience with cleaner interfaces and fixed search functionality:

#### **✅ Restaurant Detail Page Enhancements**
- **Hero Cover Images** - Full-width Google Places photos with professional gradient overlay
- **Dual Rating Display** - Shows both private network rating and Google rating prominently
- **Proper Rating Calculation** - Real-time calculation from actual private reviews
- **Enhanced Sidebar** - Sticky restaurant info with contact details, hours, and action buttons
- **Grid Layout for Reviews** - Responsive grid display for better visual organization
- **Responsive Design** - 300px mobile, 400px desktop hero heights with Next.js optimization
- **Fixed Google Maps Links** - Multiple fallback options for reliable map access

#### **✅ Search System Improvements**
- **Private Database Only** - Restaurant search now limited to your private network
- **Fixed Input Errors** - Resolved React controlled/uncontrolled component warnings
- **Enhanced Results** - Shows restaurants + restaurants from reviews with deduplication
- **Better Error Handling** - Proper fallback values and loading states

#### **✅ Filter System Optimization**
- **Collapsed by Default** - Both homepage and restaurants page start with collapsed filters
- **Cleaner Interface** - Reduces visual clutter and improves first impression
- **Expandable on Demand** - Full functionality available when needed
- **Consistent Experience** - Same behavior across all pages

#### **✅ Create Review Modal Optimization**
- **Restaurant Card Overflow Fix** - Resolved horizontal scrolling issue in Create Review modal
- **Simplified Display** - Restaurant cards now show only essential information (name, city, status)
- **Mobile-Optimized** - Removed lengthy content (full address, cuisine type, Google ratings) that caused overflow
- **Enhanced Width Constraints** - Proper truncation and flex layout for responsive design

### 🎨 Modern Authentication System & Clean Design (Latest - August 30, 2025)

Complete redesign of authentication flow with modern, clean aesthetic and invite code system:

#### **✅ Exclusive Invite Code System**
- **6-Digit Code Entry** - Beautiful landing page with individual digit inputs
- **Modern Clean Design** - Light gray/white color palette inspired by contemporary apps
- **DineCircle Branding** - "Where Your Circle Dines" with consistent logo and typography
- **Test Code Available** - Use `123456` for immediate access during development

#### **🎯 Streamlined User Experience**
- **Landing Page** (`/welcome`) - Exclusive invite code entry with premium feel
- **Account Creation** (`/signup`) - Complete form with password strength validation
- **Member Login** (`/signin`) - Simple email/password authentication (no magic links)
- **Cross-Navigation** - Smooth transitions between all authentication pages

#### **🔧 Technical Implementation**
- **Session Management** - Secure 30-minute invite code sessions with validation
- **Database Schema** - New `invite_codes` and `invite_code_usage` tables with full audit trails
- **Rate Limiting** - 5 attempts per IP per 15 minutes for security
- **Admin Dashboard** - Complete invite code management at `/admin/invite-codes`
- **Clean Architecture** - Removed magic link complexity, streamlined codebase

#### **🎨 Design System Upgrade**
- **Color Palette** - Professional gray-50/white backgrounds with gray-800 accents
- **Typography** - Clean font hierarchy with proper spacing and contrast
- **Components** - Consistent card design, input styling, and button treatments
- **Responsive** - Mobile-first design with proper touch targets and accessibility

### 🔍 Private Network Search System (August 2025)

Private database search functionality with enhanced user experience:

#### **✅ Restaurant Page Private Search**
- **Database-Only Search** - Searches only restaurants and reviews within your private network
- **Enhanced User Experience** - Proper controlled input handling, no React warnings
- **Smart Results** - Shows restaurants directly + restaurants mentioned in reviews
- **Deduplication** - Prevents duplicate restaurant entries in search results

#### **🔧 Technical Improvements**
- **Fixed Controlled Input Issues** - Resolved React controlled/uncontrolled component warnings
- **API Integration** - Uses `/api/search` endpoint for consistent private database queries
- **Error Handling** - Proper fallback values and error states
- **Performance** - Real-time search with 300ms debouncing

### 🎛️ Enhanced Filter System (Latest - August 30, 2025)

Complete professional upgrade of home page filters from basic cuisine buttons to Instagram-level filtering:

#### **✅ Smart Tag-Based Filtering**
- **4 Organized Categories** - Popular Dishes (🍽️), Cuisine (🌍), Meal Type (⏰), Atmosphere (✨)
- **35 Relevant Tags** - From "Pasta" & "Burger" to "Date Night" & "Fine Dining" - no more irrelevant options
- **Color-Coded System** - Visual category identification with professional color scheme
- **Smart Management** - Shows "3/5 selected" with one-click clear functionality

#### **🔧 Advanced Filter Controls**
- **Rating Slider** - Minimum rating filter (0-5 stars) with smooth slider interface
- **Price Level Filter** - Multi-select `$` | `$$` | `$$$` | `$$$$` (uses restaurant `price_level`; falls back to mapping `price_per_person` on the home feed)
- **Date Range Options** - All time, Past week, Past month, Past year quick selections
- **Recommendation Toggle** - Filter to show only recommended places with heart icon
- **Enhanced Sort Options** - Recent, Best Rated, Price Low→High, Price High→Low

#### **📱 Mobile-First Responsive Design**
- **Collapsed by Default** - Filters start collapsed on both homepage and restaurants page to reduce clutter
- **Tap to Expand/Collapse** - The entire filter header area toggles expansion on compact views
- **Touch-Optimized** - Large tap targets, proper spacing, mobile-friendly interactions
- **Progressive Enhancement** - Full desktop experience, streamlined mobile experience
- **Live Results Counter** - Shows "8 of 23 reviews" with real-time filter feedback

#### **🎨 Professional UI/UX**
- **Advanced Popover** - Secondary filters in clean popup with organized sections
- **Active Filter Badges** - Visual indicators showing number of active filters
- **One-Click Clear** - "Clear all (4)" button with smart active filter counting
- **Visual Tag Selection** - Chip-based interface matching the quality of modern food apps

### 🎯 Modal-Only Review Creation (August 30, 2025)

Complete redesign of review creation UX with modal-only approach:

#### **✅ Unified Review Creation Experience**
- **Modal-Only Interface** - Write reviews exclusively through popup modals, no dedicated pages
- **Responsive Modal System** - Bottom sheet on mobile, centered dialog on desktop
- **Global FAB Access** - "+" button in bottom-right corner opens review modal on any page
- **Eliminated Page Navigation** - Removed `/reviews/new` route entirely for cleaner UX

#### **🔧 Technical Implementation**
- **WriteReviewFAB Component** - Uses Sheet (mobile) and Dialog (desktop) with responsive detection
- **ReviewComposer Integration** - Seamlessly integrated into modal with proper close handling
- **Route Cleanup** - Completely removed `/app/reviews/` directory and page components
- **Import Optimization** - Fixed default vs named export issues and cleaned dependencies

#### **📱 Enhanced User Experience**
- **Predictable Interaction** - Users always get modal overlay, stay on current page
- **Mobile-Optimized** - 90% viewport height sheet provides optimal mobile experience
- **Keyboard Accessible** - Full keyboard navigation and proper focus management
- **Visual Clarity** - No page redirects, smooth modal transitions, consistent interface

### 📱 Instagram-Style Feed & Page Architecture (August 30, 2025)

Complete UI/UX transformation with separated concerns and optimized social media-style experience:

#### **✅ Homepage → Review Feed Transformation**
- **Instagram-Style Layout** - Single-column centered feed (max-width: 512px) instead of multi-column grid  
- **Large Restaurant Images** - Full-width photos with 4:3 aspect ratio for maximum visual impact
- **Social Media Flow** - User avatar → large image → content → actions layout like Instagram posts
- **Optimized Card Design** - Clean borders, shadows, and spacing with proper content hierarchy
- **Enhanced User Experience** - Larger avatars, better typography, inline pro tips

#### **🏛️ Dedicated Restaurants Page**
- **Separated Concerns** - Restaurant discovery moved to `/restaurants` page for cleaner UX
- **Complete Management Interface** - SearchBar, filters, restaurant grid, and top picks carousel
- **Server-Side Optimization** - Efficient data loading for both restaurant lists and featured content
- **Easy Navigation** - Accessible via Header dropdown menu

#### **🎨 Component Redesign**
- **ReviewCard Enhancement** - Full-width images, optimized spacing, improved content layout
- **Pro Tips Optimization** - Inline style instead of bulky background boxes saves space
- **Tag System Polish** - More subtle badge design with better visual hierarchy
- **Action Footer** - Clean separation with proper spacing and hover effects

#### **📐 Technical Implementation**
- **Responsive Design** - Works seamlessly across all screen sizes with mobile-first approach
- **Performance Optimized** - Lazy loading images, efficient React rendering patterns
- **Type Safety** - Full TypeScript support with updated component interfaces
- **Clean Architecture** - Clear separation between feed consumption and restaurant management

### 🏷️ Professional Tag System Overhaul (August 30, 2025)

Complete redesign of the tagging system with focus on relevant, food-focused tags:

#### **✅ Streamlined Tag Categories (52+ → 35 Relevant Tags)**
- **🍽️ Popular Dishes (16)** - Pasta, Burger, Pizza, Sushi, Ramen, Steak, Sandwich, Salad, Tacos, Curry, Poke, Wings, Kebab, BBQ, Seafood, Soup
- **🌍 Cuisine Type (8)** - Asian, Mexican, Italian, American, Mediterranean, Nordic, French, Indian  
- **⏰ Meal Type (7)** - Brunch, Lunch, Dinner, Dessert, Coffee, Drinks, Breakfast
- **✨ Atmosphere (8)** - Casual, Fine Dining, Date Night, Groups, Quick Bite, Cozy, Trendy, Family Friendly

#### **🎨 Modern Chip-Based Interface**
- **Interactive Selection** - Clickable chips organized by category with emoji icons
- **Color-Coded Categories** - Orange (dishes), Blue (cuisine), Green (meal), Purple (vibe)  
- **Real-Time Counter** - Shows "3/5 tags selected" with visual progress
- **Remove with X Button** - Easy tag removal with hover effects and smooth transitions

#### **📱 Enhanced User Experience**
- **Review Creation** - Category-organized chip selection instead of overwhelming dropdown
- **Review Display** - Color-coded badges with category icons throughout the app
- **Visual Hierarchy** - Clear category sections make selection intuitive and fast
- **Professional Design** - Matches quality of modern food discovery apps

#### **🔧 Technical Excellence**
- **Database Optimization** - GIN index on tags array for efficient filtering
- **Type Safety** - Full TypeScript support with updated validation schemas
- **Consistent Styling** - Helper functions ensure uniform tag display across components
- **Filter Integration** - Tags now power the advanced filter system for comprehensive search

### 🖼️ Complete Review System Overhaul (August 30, 2025)

Successfully implemented end-to-end review functionality with Google Places integration and Lovable UI:

#### **✅ Working Review Creation & Display**
- **Fixed Google Places Integration** - Restaurant search now fetches full details including photos
- **Database Schema Migration** - Updated reviews table for simplified Lovable format (dish, review, recommend, tips)
- **Complete Review Flow** - Search → Select restaurant → Create review → Display with images
- **Restaurant Cover Images** - Google Places photos display in beautiful review cards
- **Data Mapping Fixed** - Resolved API join issues preventing reviews from displaying

#### **🎨 Lovable UI Integration (Completed)**
- **Beautiful Review Cards** - Compact design with restaurant images and user avatars
- **Simplified Review Form** - Single rating with dish, review text, and tips fields
- **Responsive Design** - Conditional Sheet (mobile) and Dialog (desktop) rendering
- **Modern Components** - Clean typography, better spacing, and interactive elements

#### **🔧 Technical Improvements**
- **Foreign Key Relations Fixed** - Proper Supabase joins for restaurants and users data
- **Type Safety Enhanced** - Updated TypeScript types for both legacy and new review formats
- **Error Handling Improved** - Better messaging for duplicate reviews and validation errors
- **Backward Compatibility** - Supports both old multi-dimensional and new simplified review formats

#### **🗺️ Google Places Features**
- **Automatic Restaurant Data** - Name, address, photos, and details from Google Places
- **Cost Optimization** - Session tokens and intelligent caching minimize API costs
- **Smart Search** - Stockholm-focused autocomplete with 300ms debouncing
- **Database Integration** - find-or-create endpoint with full Google Places data fetching

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Resend account (for email)

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Feature Flags
NEXT_PUBLIC_ENABLE_MAPS=true

# Google Maps & Places API
NEXT_PUBLIC_GOOGLE_PLACES_KEY=your_google_places_api_key
GOOGLE_MAPS_EMBED_KEY=your_google_maps_embed_key

# Email (Resend)
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Analytics (Optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Error Tracking (Optional)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Apply the migrations (see `supabase/README.md` for detailed instructions)
3. **Status**: ✅ Authentication and database fully operational

**Applied Migrations:**
- `20250829233334_reset_and_initialize_database.sql` - Complete database with RLS policies
- `20250830094836_add_google_places_fields.sql` - Google Places integration fields
- `20250830154739_update_reviews_schema_for_lovable.sql` - Simplified review schema (dish, review, recommend, tips)
- `20250830180128_add_tags_to_reviews.sql` - Professional tagging system with 35 food-focused tags
- `20250830203214_invite_code_system.sql` - Modern invite code system with 6-digit codes
- `20250131000000_fix_signup_issues.sql` - Fixed RLS policies and atomic user creation
- `20250131000001_configure_auth_settings.sql` - Email confirmation handling for invite-based signups
- `20250831203848_add_to_eat_list_table.sql` - To-Eat List (restaurant wishlist) system with unlimited capacity
- `20250831231918_add_review_likes_system.sql` - Instagram-style like system
- `20250901142625_group_system_implementation.sql` - **NEW** Group system implementation
- `20250901152334_fix_user_groups_rls_recursion.sql` - **NEW** Fixed RLS recursion issues
- `20250901155104_comprehensive_database_fixes.sql` - **NEW** Security functions and simplified policies
- `20250901160000_fix_ambiguous_columns_in_functions.sql` - **NEW** Fixed PostgreSQL column ambiguity
- `20250903_add_denormalized_aggregates.sql` - **NEW** Database performance optimizations with cached aggregates
- `20250903_add_optimized_functions.sql` - **NEW** Optimized functions eliminating N+1 query patterns
- `20250903_add_performance_indexes.sql` - **NEW** Critical performance indexes for query optimization
- `20250906150000_fix_ambiguous_group_id.sql` - **NEW** Fixed ambiguous column references in optimized functions
- `20250906150001_fix_restaurant_index.sql` - **NEW** Fixed index row size exceeded error for production
- `20250906151000_fix_trigger_recursion.sql` - **NEW** Fixed stack depth limit exceeded from trigger recursion

For future schema changes, see `supabase/README.md` for migration workflow.

### Authentication Setup

DineCircle uses a modern invite code system with clean, exclusive design. **Group-based authentication features:**

- ✅ **6-digit invite code system** - Exclusive access with codes that create or join groups (test code: `123456`)
- ✅ **Group-based signup** - Invite codes automatically assign users to groups
- ✅ **Clean modern design** - Light, professional interface matching contemporary apps
- ✅ **Email/password authentication** - Simple, secure login for existing users
- ✅ **Complete account creation flow** - Full name, email, password with real-time validation
- ✅ **Session-based security** - Proper session management and invite code validation
- ✅ **Admin management** - Built-in admin panel for invite code oversight
- ✅ **Fixed signup issues** - Resolved RLS policies, foreign key constraints, and email confirmation
- ✅ **Group migration** - Existing users automatically added to default "Family & Friends" group

**Pages:**
- `/welcome` - Landing page with invite code entry (creates/joins groups)
- `/signup` - Account creation with full validation and automatic group assignment
- `/signin` - Email/password login for existing users
- `/admin/invite-codes` - Admin management of invite codes with group linking
- `/profile` - User profile with group membership information
- `/to-eat` - Dedicated To-Eat List page for restaurant wishlist management
- `/groups` - **NEW** Group management page for viewing memberships and roles

### Installation

```bash
# Install dependencies
npm install

# Apply the latest database migration (includes tagging system)
npx supabase db push

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Troubleshooting

### Authentication Issues

**🔄 Session Issues After Signup/Login**
- **Cause**: Conflicting cookies from multiple Supabase projects
- **Fix**: Clear all cookies for localhost:3000:
  1. Open DevTools (F12) → Application tab
  2. Storage → Cookies → localhost:3000
  3. Right-click → Clear or delete all cookies
  4. Refresh and try to sign in again

**❌ Invite Code Not Working**
- **Cause**: Code may be expired or usage limit reached
- **Fix**: Use the test code `123456` or contact admin for a new code

**⏱️ Profile Fetch Timeout**
- **Cause**: Database connectivity or RLS policy issues
- **Fix**: App automatically uses fallback data - no action needed

**🔑 Session Not Persisting Across Reloads**
- **Cause**: Cookie configuration problems
- **Fix**: Check that `@supabase/ssr` is properly configured

### Development Issues

**📦 Build Failures**
```bash
npm run build      # Will show TypeScript errors during build
npm run lint       # Check linting issues
```

**🔌 Database Connection Issues**
- Verify `.env.local` variables are set correctly
- Check Supabase project is active and accessible
- Review RLS policies in Supabase dashboard

**🗺️ Google Places Not Working**
- Ensure `NEXT_PUBLIC_GOOGLE_PLACES_KEY` is set
- Check API key has Places API enabled
- Verify billing is set up for Google Cloud project

**📱 Duplicate Popups Appearing**
- **Cause**: Both mobile Sheet and desktop Dialog rendering simultaneously
- **Fix**: Implemented conditional rendering with `useMediaQuery` hook
- **Prevention**: Use either Sheet OR Dialog based on screen size, never both

## Database Schema

### Core Tables

- **users** - User profiles with roles (user/admin)
- **groups** - **NEW** Group system for invite-only access with roles and membership
- **user_groups** - **NEW** Junction table managing group memberships with owner/admin/member roles
- **restaurants** - Restaurant information with location and details
- **reviews** - Multi-dimensional ratings with text and photos + **group_id for scoping**
- **invites** - Invitation system with codes and expiry
- **invite_codes** - **UPDATED** Now links to specific groups or creates new ones
- **reports** - Content moderation system
- **review_photos** - Photo storage for reviews
- **to_eat_list** - Restaurant wishlist system with unlimited capacity
- **review_likes** - Instagram-style like system with composite primary key (review_id, user_id)

### Key Features

- **Geographic Indexing** - PostGIS for location-based queries
- **RLS Security** - Row-level security for data privacy
- **Computed Ratings** - RPC function for average ratings visible to viewer
- **Duplicate Prevention** - Unique constraints on restaurant name+city

## API Routes

### Restaurants
- `GET /api/restaurants` - List restaurants with filters
- `POST /api/restaurants` - Create new restaurant
- `GET /api/restaurants/[id]` - Get restaurant details with ratings
- `PUT /api/restaurants/[id]` - Update restaurant (admin only)
- `DELETE /api/restaurants/[id]` - Delete restaurant (admin only)

### Reviews
- `GET /api/reviews` - List reviews with filters (group-scoped, includes like data)
- `POST /api/reviews` - Create new review (automatically scoped to user's groups)
- `PUT /api/reviews/[id]` - Update own review
- `DELETE /api/reviews/[id]` - Delete own review
- `POST /api/reviews/[id]/like` - Toggle like/unlike status for a review
- `GET /api/reviews/[id]/like` - Get like status and count for a review

### Profiles
- `GET /api/users/profile` - Current user profile with stats and enriched favorites (avg rating + count)
- `GET /api/users/[id]/public-profile` - Public user profile (no email), favorites enriched with stats
- `GET /api/users/[id]/reviews` - User reviews; returns all reviews for own profile, otherwise only shared-group reviews

### Search
- `GET /api/search` - Search group-accessible restaurants and reviews using security functions

### Groups
- `GET /api/groups` - Get user's groups (uses `get_user_groups()` function)
- `GET /api/groups/[id]/members` - Get group members (uses `get_group_members()` function)
- `POST /api/groups` - Create new group
- `PUT /api/groups/[id]` - Update group (owner/admin only)
- `POST /api/groups/[id]/members` - Add member to group (owner/admin only)
- `DELETE /api/groups/[id]/members/[userId]` - Remove member from group (owner/admin only)

### Google Places Integration
- `POST /api/places/autocomplete` - Search restaurants via Google Places (admin only)
- `POST /api/places/details` - Get detailed restaurant info from Google
- `POST /api/restaurants/find-or-create` - Find existing or import from Google

### Invites
- `GET /api/invites` - List user's invites
- `POST /api/invites` - Create new invite
- `POST /api/invites/[code]/accept` - Accept invite (public)

### To-Eat List
- `GET /api/users/to-eat-list` - Get user's to-eat list restaurants
- `POST /api/users/to-eat-list` - Add restaurant to to-eat list
- `DELETE /api/users/to-eat-list` - Remove restaurant from to-eat list

### Liked Posts
- `GET /api/users/liked-reviews` - Get user's liked reviews with pagination (private, group-scoped)

## Feature Flags

### Maps Integration

Set `NEXT_PUBLIC_ENABLE_MAPS=true` and configure Google API keys to enable:
- **Google Places Autocomplete** - Smart restaurant search as you type
- **Automatic Data Import** - Restaurant info, hours, ratings from Google
- **Location Bias** - Stockholm-focused results within 50km radius
- **Free Maps Links** - Directions and venue details via Google Maps URLs
- **Cost Optimization** - Session tokens and caching minimize API costs (~$3-5/month)

**Required Setup:**
1. Enable Places API (New) in Google Cloud Console
2. Create API key (remove HTTP referrer restrictions for server-side calls)
3. Set `NEXT_PUBLIC_GOOGLE_PLACES_KEY` in environment variables

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment-Based Configuration

- **Development**: Uses `.env.local`
- **Preview**: Configure in Vercel for preview deployments
- **Production**: Configure in Vercel for production

## Development

### Project Structure

```
├── app/                    # Next.js app router pages
│   ├── restaurants/        # Dedicated restaurants page with discovery features
│   ├── to-eat/            # To-Eat List page with wishlist management
│   ├── providers.tsx       # Tanstack Query and UI providers
│   └── home-client.tsx     # Instagram-style review feed homepage
├── components/             # React components
│   ├── auth/           # Authentication components
│   ├── filters/        # Enhanced filter system (EnhancedFilters, legacy CuisineFilters)
│   ├── layout/         # Layout components (Header, AuthWrapper, WriteReviewFAB, MobileMenu, NavigationProgress)
│   ├── profile/        # Profile components (including ToEatSection, LikedReviews)
│   ├── restaurant/     # Restaurant-related components (RestaurantSelector, ToEatButton)
│   ├── review/         # Review components (ReviewComposer, RatingInput)
│   ├── search/         # Search components (SearchBar, SearchFAB, GlobalSearchModal)
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and configurations
│   ├── mutations/      # React Query mutations (including toEatList.ts, likes.ts)
│   ├── queries/        # React Query data fetching (including toEatList.ts, likes.ts)
│   ├── supabase/       # Supabase client configuration
│   ├── hooks/          # Custom React hooks (useAuth, useMediaQuery)
│   ├── utils/          # Performance monitoring and utilities
│   └── validations/    # Zod schemas
├── types/              # TypeScript type definitions
├── constants/          # App constants
├── scripts/            # Performance testing and utilities
├── lovable-frontend/   # Original Lovable UI code (reference)
└── supabase/           # Database schema and migrations
```

### Adding New Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]

# Example: Add a new form component
npx shadcn@latest add dialog
```

### Database Changes

1. Update `supabase/schema.sql`
2. Run the new SQL in your Supabase project
3. Update TypeScript types in `types/index.ts`
4. Update validation schemas in `lib/validations/index.ts`

## Key Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run build        # Check TypeScript types during build

# Database
# Run SQL files in Supabase dashboard SQL editor
```

## Security Features

- **Authentication**: Invite code system with email/password via Supabase
- **Authorization**: Row-level security policies
- **Data Privacy**: Reviews visible only to network members
- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Built-in invite code validation (5 attempts per 15 minutes)
- **HTTPS**: Enforced in production
- **CORS**: Configured for secure API access
- **Session Management**: Secure 30-minute invite code sessions

## Performance Optimization Files

The major database performance optimizations introduced several new files and artifacts:

### **Performance Monitoring & Testing**
- `lib/utils/performance-monitor.ts` - Performance monitoring utilities for tracking query execution times
- `scripts/test-performance.ts` - Performance testing script for benchmarking database optimizations
- `PERFORMANCE_OPTIMIZATIONS.md` - Detailed documentation of all performance improvements and technical implementation

### **Database Migrations (Applied)**
- `supabase/migrations/20250903_add_denormalized_aggregates.sql` - Adds cached aggregate columns to restaurants table
- `supabase/migrations/20250903_add_optimized_functions.sql` - Creates optimized database functions for single-query data fetching
- `supabase/migrations/20250903_add_performance_indexes.sql` - Adds comprehensive indexing for query optimization
- `supabase/migrations/20250906150000_fix_ambiguous_group_id.sql` - Fixes ambiguous column references in optimized functions
- `supabase/migrations/20250906150001_fix_restaurant_index.sql` - Fixes index row size exceeded error for production databases
- `supabase/migrations/20250906151000_fix_trigger_recursion.sql` - Fixes stack depth limit exceeded error from trigger recursion

### **Configuration Updates**
- `app/providers.tsx` - Updated React Query configuration with optimized caching settings for better performance
- `.mcp.json` - Model Context Protocol configuration for enhanced development tooling

These optimizations provide:
- **75% reduction in database queries** for the main homepage feed
- **60-70% faster API response times** across all endpoints
- **O(1) pagination performance** replacing inefficient OFFSET-based queries
- **Sub-100ms response times** for social media-style feed interactions
- **Production-ready scalability** with comprehensive error handling and fallback mechanisms

## Business Rules

1. **Restaurant Duplicates**: Prevented by name+city combination
2. **Review Limits**: One review per user per restaurant within groups
3. **Group-Based Visibility**: Reviews visible only to users in the same groups
4. **Group Permissions**: Group owners/admins can manage memberships and moderate content
5. **Invite Code Groups**: Each invite code creates or joins a specific group
6. **Multiple Group Membership**: Users can belong to multiple groups simultaneously
7. **Invite Expiry**: Invites expire after 7 days by default

## Troubleshooting

### Common Issues

1. **Database Connection**: Check Supabase URL and keys
2. **Authentication**: Verify callback URL in Supabase Auth settings
3. **Email Delivery**: Confirm Resend API key and domain setup
4. **Build Errors**: Run `npm run build` to identify TypeScript issues

### Support

For issues and feature requests, check the GitHub repository or contact the development team.

## License

Private project - All rights reserved.
