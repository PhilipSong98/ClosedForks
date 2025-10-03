# CLAUDE.md - AI Assistant Context

This document provides essential context for AI assistants working on DineCircle.

## What is DineCircle?

**DineCircle** is a mobile-first, invite-only restaurant review platform for private groups of friends and family. Think Instagram meets Yelp, but exclusively for your trusted circle.

**Tagline**: "Where Your Circle Dines"

## Core Concepts

### Business Model
- **Invite-Only**: Users join via 6-digit invite codes
- **Group-Based**: Reviews are scoped to groups - you only see reviews from people in your groups
- **Private Network**: No public reviews, just trusted recommendations from your circles
- **Multiple Groups**: Users can belong to multiple groups (e.g., "Family", "Work Friends", "Foodies")

### Key Features
1. **Instagram-style Feed**: Single-column review cards with large images and like system
2. **Quick & Detailed Reviews**: Users can leave just a rating or write comprehensive reviews
3. **Restaurant Discovery**: Browse restaurants with Airbnb-style search and filtering
4. **Personal Collections**: Favorites (max 10) and unlimited To-Eat List
5. **Profile System**: User profiles with stats, reviews, liked posts, and wishlists
6. **Group Management**: Create groups, invite members, manage permissions

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: React Query (optimistic updates, cache invalidation)
- **Images**: Next.js Image optimization + Google Places API
- **Performance**: PWA, ISR, dynamic imports, cursor-based pagination

## Design System

### Color Palette
- **Wine Red** (#7B2C3A): Primary actions, brand color
- **Sage Green** (#6E7F5C): Secondary actions, success states
- **Gold** (#C2A878): Premium accents, highlights
- **Light Background** (#FAFAFA): Clean minimal background
- **Professional Gray** (#2C2C2C): Text

### Responsive Patterns
- **Mobile**: Sheets, hamburger menu, touch-optimized
- **Desktop**: Dialogs, dropdown menu, hover effects
- **Hook**: `useMediaQuery` for conditional rendering

## Database Schema (Essentials)

### Main Tables
- **users**: Profiles with `full_name`, `favorite_restaurants[]`, admin roles
- **groups**: Group info (name, description, creator)
- **user_groups**: Junction table (user_id, group_id, role: owner/admin/member)
- **restaurants**: Restaurant data + Google Places integration + cached aggregates
- **reviews**: Ratings, content (optional), tags, likes, **group_id** (scoped to groups)
- **review_likes**: Instagram-style likes (one per user per review)
- **invite_codes**: 6-digit codes with group linking, usage tracking
- **to_eat_list**: Restaurant wishlist (unlimited capacity)

### Security Model
- **RLS Policies**: Simplified, non-recursive policies
- **Security Functions**: `get_user_visible_reviews()`, `get_group_reviews()`, `get_group_members()`
- **Group Scoping**: Reviews only visible within shared groups
- **Role Permissions**: Owners/admins manage groups, users manage own content

## Project Structure

```
restaurant/
├── app/
│   ├── welcome/          # Invite code landing page
│   ├── signup/           # Account creation
│   ├── home-client.tsx   # Instagram feed
│   ├── restaurants/      # Discovery page
│   ├── profile/          # User profiles
│   ├── groups/           # Group management
│   └── api/              # API routes
├── components/
│   ├── filters/          # SearchFilterBar (Airbnb-style)
│   ├── groups/           # Group modals (create, edit, invite)
│   ├── profile/          # Profile components
│   ├── restaurant/       # Restaurant cards, ToEatButton
│   ├── review/           # ReviewComposer, ReviewCard
│   ├── search/           # GlobalSearchModal, SearchFAB
│   └── ui/               # shadcn components
├── lib/
│   ├── mutations/        # React Query mutations (reviews, likes, groups)
│   ├── queries/          # React Query hooks (restaurants, profile)
│   └── supabase/         # DB clients & middleware
└── supabase/migrations/  # Database migrations
```

## Key Components & Patterns

### Component Reuse (Important!)
- **Always reuse** `ReviewCard.tsx` for review listings (feed, profile, public profile)
- **Always reuse** `RestaurantCard.tsx` for restaurant listings (discovery, favorites)
- If you need extra data, extend the API - don't fork the UI

### Authentication Flow
1. `/welcome` - Enter 6-digit invite code (test code: `123456`)
2. Validate code → `/signup` - Create account (name, email, password)
3. Existing users → `/signin` - Email/password login
4. Admin panel → `/admin/invite-codes` (requires `is_admin_user = true`)

### Data Fetching Patterns
- **React Query**: All data fetching uses custom hooks (`useRestaurantsWithReviews`, `useUserProfile`)
- **Optimistic Updates**: Mutations update cache instantly, rollback on error
- **Cache Invalidation**: Automatic refresh on create/update/delete
- **Cursor Pagination**: All endpoints use `cursor_created_at` + `cursor_id` for O(1) performance

### Review System
```typescript
// Flexible schema - only rating required
{
  rating_overall: number,    // Required: 1-5 stars
  dish?: string,            // Optional: What did you eat?
  review?: string,          // Optional: Review text
  recommend: boolean,       // Required: Would recommend?
  tips?: string,            // Optional: Pro tips
  tags?: string[]           // Optional: Up to 5 tags
}
```

### Like System
- Heart button with optimistic updates
- Uses React Query cache directly (no local state)
- One like per user per review (DB constraint)
- `toggle_review_like()` DB function for atomic operations

### Profile Tabs
- **Own Profile** (`/profile`): Favorites, Recent Reviews, Liked Posts, To-Eat List
- **Public Profile** (`/profile/[id]`): Favorites, Recent Reviews (group-scoped only)

## Important API Endpoints

```
GET  /api/restaurants                    # List restaurants (group-scoped)
GET  /api/reviews                        # Get reviews (group-scoped)
POST /api/reviews                        # Create review
POST /api/reviews/[id]/like              # Toggle like
GET  /api/users/profile                  # Current user
GET  /api/users/[id]/reviews             # User reviews (paginated, group-visible)
GET  /api/users/liked-reviews            # Liked reviews (private, paginated)
GET  /api/groups                         # User's groups
POST /api/groups                         # Create group (admin only)
POST /api/groups/join                    # Join via invite code
POST /api/groups/[id]/invite-code        # Generate invite code (any member)
PATCH /api/groups/[id]                   # Update group (owner/admin only)
```

All endpoints support cursor-based pagination with `cursor_created_at` and `cursor_id`.

## Performance Features

### Optimizations Applied
- **Font Optimization**: Inter font with `display: swap`, preload, self-hosted
- **Image Optimization**: Next.js Image with priority loading, lazy loading, responsive sizing
- **Code Splitting**: Dynamic imports for heavy components (ReviewComposer, SearchFAB, GlobalSearchModal)
- **PWA**: Service worker, offline support, installable app manifest
- **ISR**: Restaurant pages with 5-minute revalidation
- **Database**: Denormalized aggregates, optimized functions, trigram search indexes
- **Pagination**: Cursor-based (O(1) performance at any page)

### Commands
```bash
npm run dev              # Development server
npm run build            # Production build
npm run build:analyze    # Bundle analysis
supabase migration new   # Create migration
supabase db push         # Apply migrations
```

## Common Workflows

### Adding a Feature
1. Create API route in `app/api/[resource]/`
2. Add Zod validation in `lib/validations/`
3. Create React Query hooks in `lib/mutations/` or `lib/queries/`
4. Build UI components in `components/`
5. Update CLAUDE.md if it's a major feature

### Database Changes
1. `supabase migration new feature_name`
2. Write SQL migration
3. `supabase db push`
4. Update TypeScript types if needed

### Component Best Practices
- Use `useMediaQuery` for responsive Sheet/Dialog switching
- Always use React Query for data fetching (no raw fetch)
- Prefer optimistic updates for better UX
- Reuse existing components before creating new ones
- Use `ExtensionResistantInput` for forms (prevents browser extension interference)

## Current Status & Next Steps

### What Works
✅ Full authentication with invite codes
✅ Group-based review system
✅ Instagram-style feed with likes
✅ Restaurant discovery with search/filter
✅ User profiles with collections
✅ Group management with permissions
✅ Performance optimizations (PWA, ISR, code splitting)
✅ Mobile-first responsive design

### Pending Features
- Photo upload for reviews
- Restaurant detail maps integration
- Email notifications
- Enhanced admin dashboard

---

**Last Updated**: 2025-10-04
**Version**: MVP v1.24
