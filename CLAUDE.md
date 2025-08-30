# CLAUDE.md - AI Assistant Documentation

This file provides comprehensive context for AI assistants working on the Restaurant Reviews project.

## 🎯 Project Overview

**What**: Mobile-first, invite-only restaurant review platform for friends & family
**Goal**: Private network for trusted restaurant recommendations
**Status**: Core MVP implemented, ready for enhancements

### Core Business Rules
- **Private by default**: Only invited users can access
- **One review per user per restaurant**: No duplicate reviews
- **Network-based visibility**: Reviews visible to authenticated network members
- **Admin powers**: Admins can edit restaurants, resolve reports
- **Geographic focus**: City-based restaurant organization

## ✅ Current Implementation Status

### Completed Features
- [x] Next.js 14 with TypeScript and App Router setup
- [x] Tailwind CSS + shadcn/ui component system
- [x] Supabase integration (auth + database + storage)
- [x] Authentication system (magic link via Supabase)
- [x] Database schema with RLS policies
- [x] User management with roles (user/admin)
- [x] Restaurant CRUD operations
- [x] Multi-dimensional rating system (overall, food, service, vibe, value)
- [x] Invite system with expiring codes
- [x] Mobile-responsive navigation
- [x] API routes with validation
- [x] Environment configuration with feature flags
- [x] Comprehensive documentation
- [x] **Google Places API integration** - Smart restaurant discovery
- [x] **Review creation flow** - Complete UI with restaurant selection
- [x] **Location-based search** - Stockholm-focused with 50km bias
- [x] **Cost-optimized API usage** - Session tokens and intelligent caching
- [x] **Production-ready authentication** - Fixed PKCE flow, session persistence, and cookie conflicts
- [x] **Robust error handling** - Fallback user data and timeout protection
- [x] **Lovable UI Integration** - Beautiful, modern interface merged from external Lovable project
- [x] **Simplified Review System** - Streamlined from complex multi-dimensional to user-friendly single rating
- [x] **Responsive Popup System** - Conditional rendering with Sheet (mobile) and Dialog (desktop)
- [x] **Modern Component Library** - Clean, accessible components with better spacing and typography
- [x] **Tanstack Query Integration** - Proper server state management with React Query
- [x] **Complete Review System** - End-to-end review creation and display with Google Places photos
- [x] **Database Schema Migration** - Updated for simplified Lovable format (dish, review, recommend, tips)
- [x] **Restaurant Image Display** - Google Places photos in beautiful review cards
- [x] **API Data Mapping** - Fixed Supabase joins and foreign key relationships
- [x] **Type Safety Enhancements** - Updated TypeScript types for new review format
- [x] **Error Handling Improvements** - Better duplicate review and validation error messages

### Pending Features (Future Sprints)
- [ ] Photo upload for reviews
- [ ] Restaurant detail pages with embedded maps
- [ ] Advanced filtering and search
- [ ] User-selectable location preferences (Nordic cities)
- [ ] Email notifications via Resend
- [ ] Admin dashboard for reports/moderation
- [ ] User lists/collections
- [ ] Analytics integration
- [ ] Testing suite (Playwright)
- [ ] Seed data script
- [ ] Re-enable authentication for Places API routes

## 🏗️ Architecture & Key Files

### Project Structure
```
restaurant/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Auth callback handling
│   ├── restaurants/       # Restaurant pages
│   ├── invite/            # Invite management
│   ├── providers.tsx      # Tanstack Query and UI providers
│   ├── home-client.tsx    # Main home page client component
│   └── layout.tsx         # Root layout with AuthWrapper
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── layout/            # Header, AuthWrapper (Navigation removed)
│   ├── restaurant/        # Restaurant-specific components
│   ├── review/            # ReviewComposer, RatingInput
│   ├── search/            # SearchBar with Google Places
│   └── ui/                # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── supabase/          # Supabase client setup
│   ├── hooks/             # Custom React hooks (useAuth, useMediaQuery)
│   └── validations/       # Zod schemas
├── types/                 # TypeScript definitions
├── constants/             # App constants and enums
├── supabase/              # Database schema & migrations
│   ├── migrations/        # Version-controlled database changes
│   ├── schema.sql         # Legacy schema (use migrations instead)
│   └── README.md          # Migration documentation
├── scripts/               # Development scripts
│   └── migrate.sh         # Migration helper script
├── lovable-frontend/      # Original Lovable UI code (reference)
└── middleware.ts          # Supabase auth middleware
```

### Critical Files
- `supabase/migrations/`: Version-controlled database migrations
- `supabase/schema.sql`: Legacy schema file (use migrations instead)
- `lib/supabase/client.ts`: Database types and browser client setup
- `lib/supabase/server.ts`: Server-side Supabase client
- `lib/supabase/middleware.ts`: Session handling middleware
- `app/auth/callback/route.ts`: OAuth callback handler with PKCE flow
- `lib/hooks/useAuth.ts`: Authentication hook with profile management
- `middleware.ts`: Session refresh for server components
- `constants/index.ts`: Enums, cuisines, price levels
- `lib/validations/index.ts`: Zod schemas for API validation
- `lib/google/places.ts`: Google Places API utilities
- `lib/constants/cities.ts`: City locations for restaurant search
- `lib/hooks/useMediaQuery.ts`: Media query hook for responsive rendering
- `app/providers.tsx`: Tanstack Query and UI providers setup
- `app/home-client.tsx`: Main home page with responsive popups
- `components/layout/Header.tsx`: Modern navigation with user dropdown
- `components/review/ReviewComposer.tsx`: Simplified review form (Lovable design)
- `components/review/RatingInput.tsx`: Large, interactive star rating component
- `components/search/SearchBar.tsx`: Google Places integrated restaurant search

## 🎨 Lovable UI Integration (Important Context)

### Background
The project originally had functional but basic UI. A designer created a beautiful interface in Lovable (React + Vite app), which was successfully merged into this Next.js application.

### Integration Details
**Source**: `/lovable-frontend/` directory contains the original Lovable code for reference
**Migration**: Converted from React Router to Next.js App Router
**Data**: Replaced mock data with real Supabase API calls
**State Management**: Added Tanstack Query for server state

### Key Changes from Integration
1. **Simplified Review Form**: Changed from complex multi-dimensional ratings (food, service, vibe, value) to single overall rating with detailed text
2. **Modern UI Components**: Clean design with better spacing, larger interactive elements
3. **Responsive Popups**: Conditional rendering using `useMediaQuery` hook - Sheet for mobile, Dialog for desktop
4. **Navigation Update**: Removed old Navigation component, replaced with modern Header with dropdown
5. **Component Consolidation**: Merged duplicate components, kept best UI from Lovable

### Review Schema Changes
**Old Schema** (multi-dimensional):
```typescript
{
  rating_overall: number,
  food: number,
  service: number,
  vibe: number,
  value: number,
  text: string,
  visit_date: string,
  price_per_person: number
}
```

**New Schema** (simplified):
```typescript
{
  restaurant: string,
  rating: number,        // Single overall rating
  dish: string,         // What did you eat?
  review: string,       // Detailed review text
  recommend: boolean,   // Would recommend to friends?
  tips: string         // Optional pro tips
}
```

### Common Issues & Solutions
- **Duplicate Popups**: Fixed by using conditional rendering instead of CSS hiding
- **Import Errors**: Converted all React Router imports to Next.js navigation
- **Type Mismatches**: Updated TypeScript types to match simplified schema

## 🔧 Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Create Supabase project
3. Apply database migration (see Database Migrations section below)
4. Configure environment variables (see `.env.example`)
5. Run `npm install && npm run dev`

### Key Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint check
npm run type-check   # TypeScript validation

# Database migrations
npm run db:migrate   # Apply migrations to remote database
npm run db:new       # Create new migration
npm run db:status    # Check migration status
```

### Database Migrations
**IMPORTANT**: Always use migrations for database changes, never modify schema directly.

```bash
# Apply the initial migration to fix authentication
supabase db push

# Create new migration for schema changes
npm run db:new migration_name

# Apply migrations to remote database
npm run db:migrate

# Check what migrations are pending
npm run db:status
```

**Applied Migrations (Current State):**
- ✅ `20250829233334_reset_and_initialize_database.sql` - Complete clean migration (SUCCESSFULLY APPLIED)
- ✅ `20250830094836_add_google_places_fields.sql` - Google Places integration fields (SUCCESSFULLY APPLIED)
- ✅ `20250830154739_update_reviews_schema_for_lovable.sql` - Simplified review schema for Lovable UI (SUCCESSFULLY APPLIED)

**Archived Migrations** (in `supabase/migrations_archive/`):
- ❌ `20250829230023_fix_users_table_schema.sql` - Archived (was partial fix)
- ❌ `20250829231123_fix_rls_policy_recursion.sql` - Archived (was partial fix)
- ❌ `20250829232355_fix_profile_creation_policy.sql` - Archived (was partial fix)
- ❌ `20250829232628_initial_schema_setup.sql` - Archived (was reference only)

**Migration Files Location:** `supabase/migrations/`
**Documentation:** See `supabase/README.md` for detailed migration workflow

### Adding shadcn/ui Components
```bash
npx shadcn@latest add [component-name]
```

## 🎨 Design System

### UI Components (shadcn/ui)
- All components in `components/ui/`
- Customizable via `tailwind.config.js`
- Follows Radix UI accessibility standards

### Styling Conventions
- Tailwind CSS utility classes
- Mobile-first responsive design
- Consistent spacing and typography
- Color scheme defined in `globals.css`

## ✅ Database Status: FULLY OPERATIONAL

### Previous Authentication Issues (ALL RESOLVED ✅)
**Problem**: Multiple authentication and RLS policy issues
**Root Causes**: 
- Users table ID mismatch with auth.users
- RLS policy infinite recursion
- Restrictive INSERT policies

**Solution**: ✅ **CLEAN SLATE RESET** - Single comprehensive migration

### Current Status: ✅ DATABASE FULLY OPERATIONAL

**Applied Migrations**: 
- `20250829233334_reset_and_initialize_database.sql` - Complete clean database reset
- `20250830094836_add_google_places_fields.sql` - Google Places integration fields

**Migration Status:**
- ✅ **Database fully operational** - All authentication and RLS issues resolved
- ✅ **Google Places ready** - New fields added for restaurant data caching
- ✅ **Future-proof schema** - Ready for additional features

**Old Migrations**: Archived to `supabase/migrations_archive/` for reference

**Benefits Achieved**:
- ✅ No policy conflicts - all authentication working
- ✅ Clear, stable schema - ready for development
- ✅ Future migrations will work seamlessly
- ✅ All authentication issues permanently resolved

## 🖼️ Recent Implementation: Complete Review System (August 30, 2025)

### ✅ FULLY IMPLEMENTED AND OPERATIONAL

**Status**: Complete end-to-end review creation and display with Google Places photos

### Major Fixes and Implementations

#### **1. Database Schema Migration**
- **Migration**: `20250830154739_update_reviews_schema_for_lovable.sql`
- **Added Fields**: `dish`, `review`, `recommend`, `tips`
- **Backward Compatibility**: Kept legacy fields (food, service, vibe, value) as optional
- **Data Migration**: Existing data properly migrated with defaults

#### **2. Google Places Photo Integration**
- **Fixed find-or-create endpoint** to fetch full Google Places details including photos
- **Direct API calls** from server-side to avoid internal routing issues
- **Photo storage** in `google_data.photos[]` with photo references
- **Cost optimization** through session tokens and intelligent caching

#### **3. Database Join Issues Resolved**
- **Problem**: API returned `restaurants`/`users`, frontend expected `restaurant`/`author`
- **Solution**: Added data mapping in API response to transform property names
- **Fixed Foreign Keys**: Used proper Supabase syntax `users!author_id()` for joins
- **Type Safety**: Updated TypeScript types to support both formats

#### **4. Review System Components**

**ReviewComposer** (`components/review/ReviewComposer.tsx`):
- **Simplified Form**: Single rating + dish + review text + tips
- **Restaurant Selection**: Integration with SearchBar and find-or-create
- **Error Handling**: Better messaging for duplicate reviews
- **Form Validation**: Proper field validation with helpful error messages

**ReviewCard** (`components/review/ReviewCard.tsx`):
- **Lovable Design**: Compact cards with restaurant images
- **Flexible Data**: Handles both old and new API response formats
- **Google Photos**: Displays Google Places images with proper URLs
- **User Experience**: Click avatars, view tips, clean typography

**SearchBar** (`components/search/SearchBar.tsx`):
- **Google Places Integration**: Real autocomplete with 300ms debouncing
- **Session Tokens**: Cost-optimized API usage
- **Restaurant Creation**: Automatic find-or-create with full details

### Implementation Details

#### **Review Schema Evolution**
```typescript
// OLD (Multi-dimensional)
{
  rating_overall: number,
  food: number,
  service: number,
  vibe: number,
  value: number,
  text: string
}

// NEW (Simplified - Lovable)
{
  rating_overall: number,  // Main rating
  dish: string,           // What did you eat?
  review: string,         // Main review text
  recommend: boolean,     // Would recommend?
  tips: string           // Pro tips
}
```

#### **API Data Flow**
1. **Restaurant Search**: SearchBar → Google Places Autocomplete
2. **Restaurant Selection**: find-or-create → Google Places Details → Database
3. **Review Creation**: ReviewComposer → API with restaurant_id
4. **Review Display**: API joins restaurants + users → ReviewCard

#### **Key Files Modified**
- `app/api/reviews/route.ts` - Fixed joins and data mapping
- `app/api/restaurants/find-or-create/route.ts` - Added Google Places details fetching
- `components/review/ReviewCard.tsx` - Updated to Lovable design with flexible data
- `components/review/ReviewComposer.tsx` - Improved error handling
- `types/index.ts` - Enhanced Review interface for new fields
- `lib/validations/index.ts` - Updated schemas for new format

### Current Status: ✅ FULLY OPERATIONAL

- ✅ **Restaurant Search** - Google Places autocomplete working
- ✅ **Photo Display** - Restaurant images from Google Places
- ✅ **Review Creation** - Complete form with validation
- ✅ **Review Display** - Beautiful cards with Lovable design
- ✅ **Data Integrity** - Proper joins and type safety
- ✅ **Error Handling** - User-friendly messages for all edge cases
- ✅ **Backward Compatibility** - Supports both old and new review formats

## 🗺️ Google Places Integration

### ✅ FULLY IMPLEMENTED AND OPERATIONAL

**Status**: Complete implementation with Stockholm focus and cost optimization

### Key Features
- **Smart Restaurant Search**: Google Places Autocomplete with 300ms debouncing
- **Automatic Data Import**: Name, address, hours, photos, ratings from Google
- **Location Optimization**: Stockholm-focused with 50km radius bias
- **Cost Minimization**: Session tokens + caching = ~$3-5/month for small user base
- **Database Integration**: Intelligent deduplication and data enrichment

### Implementation Components

#### **API Routes** (`app/api/places/`)
- `autocomplete/route.ts` - Google Places predictions with session tokens
- `details/route.ts` - Full restaurant data fetch with field masking
- `find-or-create/route.ts` - Smart restaurant creation/updating

#### **React Components**
- `PlacesAutocomplete` - Debounced search with dropdown predictions
- `RestaurantSelector` - Complete restaurant discovery flow
- `ReviewForm` - Multi-dimensional rating system
- Complete review creation page at `/reviews/new`

#### **Data Layer**
- Google Places fields in restaurants table
- City location constants for Nordic region
- Validation schemas for API parameters
- Intelligent caching strategy

### User Experience
1. **Type restaurant name** → Google Places suggestions appear
2. **Select restaurant** → Auto-imports all data if new, matches existing if duplicate
3. **Rich display** → Shows hours, ratings, directions link
4. **Complete review** → Full 5-dimension rating system

### Cost Strategy
- **Session Tokens**: Only pay when restaurant selected (~$0.017 per selection)
- **Database First**: Check existing restaurants before Google API
- **Smart Caching**: Store Google data permanently, refresh periodically
- **Field Masking**: Request only needed data from Google

### Location Configuration
- **Current**: Stockholm, Sweden (59.3293, 18.0686) with 50km radius
- **Future Ready**: Nordic cities predefined in `lib/constants/cities.ts`
- **Expandable**: User-selectable location preferences

## 🗄️ Database Schema

### Core Tables
- `users`: User profiles with roles
- `restaurants`: Restaurant data with location + **Google Places integration**
  - `google_place_id`: Google's unique identifier
  - `google_maps_url`: Free directions link
  - `google_data`: Cached place details (hours, photos, ratings)
  - `last_google_sync`: Data freshness tracking
- `reviews`: Multi-dimensional ratings with visit details
- `invites`: Invitation system with expiring codes
- `review_photos`: Image metadata for reviews
- `reports`: Content moderation system

### Important RLS Policies
- Users see only their network's reviews
- Users can only edit their own content
- Admins bypass most restrictions
- Public endpoints require authentication

### Key Database Functions
- `get_restaurant_with_avg()`: Computed ratings visible to viewer
- Auto-updating `updated_at` triggers on reviews

## 🔐 Security Implementation

### Authentication
- Magic link via Supabase Auth
- Session management through middleware
- Automatic user profile creation

### Authorization
- Row-Level Security (RLS) on all tables
- Role-based permissions (user/admin)
- Input validation with Zod schemas

### Data Privacy
- Network-based review visibility
- HTTPS enforcement in production
- Secure environment variable handling

## 🚀 Feature Flags

### Maps Integration (`NEXT_PUBLIC_ENABLE_MAPS`)
- Default: `false`
- When enabled: Google Places integration for restaurant search
- Affects: Restaurant creation form, search functionality

## 📝 Common Development Tasks

### Adding a New API Endpoint
1. Create route in `app/api/[resource]/route.ts`
2. Add Zod validation schema in `lib/validations/`
3. Update TypeScript types in `types/index.ts`
4. Test authentication and authorization

### Adding a New Page
1. Create page in `app/[path]/page.tsx`
2. Add navigation link in `components/layout/Navigation.tsx`
3. Ensure mobile responsiveness
4. Add to README if significant

### Database Schema Changes
1. Create new migration: `supabase migration new migration_name`
2. Write SQL changes in the generated migration file
3. Apply migration: `supabase db push`
4. Update `lib/supabase/client.ts` types if needed
5. Update validation schemas
6. Test RLS policies

### Adding a New Component
1. Create in appropriate `components/` subdirectory
2. Follow existing patterns for props/styling
3. Add TypeScript interfaces
4. Ensure accessibility compliance

## 🔐 Authentication Implementation

### Overview
The app uses Supabase Auth with magic links, implementing the modern PKCE (Proof Key for Code Exchange) flow for security. Authentication is fully working with production-ready error handling and session management.

### Key Components

#### **Server-Side Route Handler** (`app/auth/callback/route.ts`)
- Handles OAuth callback from magic links
- Exchanges authorization code for session tokens
- Creates user profiles automatically
- Detects and logs conflicting cookies
- Redirects to authenticated app

#### **Client-Side Auth Hook** (`lib/hooks/useAuth.ts`)
- Manages auth state and user profile data
- Implements fallback user data from auth session
- Handles profile fetch with timeout protection
- Provides sign-in, sign-out, and profile update functions

#### **Supabase Clients**
- **Browser Client** (`lib/supabase/client.ts`): Uses `createBrowserClient` for proper cookie handling
- **Server Client** (`lib/supabase/server.ts`): Server-side client with cookie integration
- **Middleware** (`lib/supabase/middleware.ts`): Session refresh for server components

### Authentication Flow
1. **Magic Link Request**: User enters email, receives magic link
2. **Callback Processing**: Link redirects to `/auth/callback?code=XXX`
3. **Token Exchange**: Server exchanges code for session using PKCE
4. **Profile Creation**: User profile created if doesn't exist
5. **Session Storage**: Auth tokens stored in secure cookies
6. **Client Auth**: Browser client reads session, fetches/creates profile
7. **Fallback Handling**: Uses auth data if profile fetch fails

### Security Features
- ✅ **PKCE Flow**: Secure authorization code exchange
- ✅ **Cookie Security**: Proper httpOnly, secure, sameSite settings
- ✅ **Session Refresh**: Automatic token renewal
- ✅ **RLS Policies**: Database-level authorization
- ✅ **Timeout Protection**: Prevents hanging requests
- ✅ **Conflict Detection**: Handles multiple Supabase project cookies

### Troubleshooting Authentication

#### **Common Issues & Solutions**

**1. Infinite Loading After Magic Link**
- **Cause**: Conflicting cookies from multiple Supabase projects
- **Solution**: Clear all localhost:3000 cookies in DevTools → Application → Storage

**2. "Code verifier should be non-empty" Error**
- **Cause**: PKCE cookies missing or corrupted
- **Solution**: Clear cookies and try fresh magic link

**3. Profile Fetch Timeout**
- **Cause**: Database query hanging or RLS policy issues
- **Solution**: App uses fallback auth data automatically

**4. Session Not Persisting**
- **Cause**: Cookie configuration issues
- **Solution**: Ensure using `createBrowserClient` from `@supabase/ssr`

#### **Debug Steps**
1. Check browser console for auth logs
2. Verify environment variables are set
3. Check Network tab for failed requests  
4. Clear cookies if experiencing conflicts
5. Check Supabase dashboard for auth logs

### Best Practices Implemented
- Server-side profile creation during auth callback
- Fallback user data prevents auth failures from blocking app
- Timeout protection with AbortController
- Comprehensive error logging
- Cookie conflict detection and cleanup
- Production-ready error boundaries

## 🔍 Debugging Tips

### Common Issues
1. **Auth not working**: Check callback URL in Supabase Auth settings
2. **Database connection**: Verify environment variables
3. **RLS blocking queries**: Check user permissions in Supabase
4. **Build failures**: Run `npm run type-check` first

### Useful Debugging Commands
```bash
# Check TypeScript issues
npm run type-check

# Lint and fix issues
npm run lint --fix

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL

# Supabase logs (if CLI installed)
supabase logs
```

## 📊 Performance Considerations

### Implemented Optimizations
- Server-side rendering with App Router
- Efficient database queries with RLS
- Lazy loading for components
- Image optimization ready (Next.js built-in)

### Future Optimizations
- Database indexes for common queries
- Caching layer for restaurant data
- Image compression for review photos
- CDN for static assets

## 🎯 Business Context

### Target Users
- Friend/family networks sharing restaurant experiences
- Privacy-conscious users wanting private recommendations
- Small communities (10-100 users initially)

### Key Metrics to Track
- User engagement (reviews created)
- Network growth (successful invites)
- Restaurant coverage by city
- Mobile usage patterns

## 📚 Technical Decisions & Rationale

### Why Next.js App Router?
- Server components for better performance
- Built-in API routes
- Excellent TypeScript support
- Vercel deployment optimization

### Why Supabase?
- Built-in authentication
- PostgreSQL with geographic extensions
- Row-Level Security
- Real-time capabilities (future use)

### Why shadcn/ui?
- Accessible components out of the box
- Customizable design system
- Copy-paste, not dependency
- Excellent TypeScript support

## 🚦 Development Guidelines

### Code Standards
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- Functional components with hooks
- Server components where possible

### Git Workflow
- Feature branches for new development
- Descriptive commit messages
- Pull request reviews for main branch
- Deploy main branch to production

### Testing Strategy (Future)
- Playwright for E2E testing
- Jest for unit tests
- Supabase local dev for testing
- Staging environment for integration tests

## 🔮 Future Enhancements

### Phase 2 Features
- Review photos with compression
- Advanced search and filters
- Email notifications
- Admin dashboard

### Phase 3 Features
- Maps integration with Places API
- User collections/lists
- Social features (comments, reactions)
- Analytics dashboard

### Technical Improvements
- Progressive Web App (PWA)
- Offline capabilities
- Advanced caching strategies
- Performance monitoring

## 🆘 Getting Help

### When Stuck
1. Check this documentation first
2. Review error logs in browser/terminal
3. Check Supabase dashboard for database issues
4. Consult Next.js and Supabase documentation
5. Review recent commit history for context

### Useful Resources
- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 📋 Quick Reference

### Environment Variables (Required)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### Important Constants
- Price levels: 1-4 ($, $$, $$$, $$$$)
- Rating scale: 1-5 stars
- Invite expiry: 7 days default
- Supported cuisines: See `constants/index.ts`

### API Endpoints
- `GET /api/restaurants` - List restaurants
- `POST /api/restaurants` - Create restaurant
- `GET /api/reviews?restaurant_id=X` - Restaurant reviews
- `POST /api/reviews` - Create review
- `GET /api/invites` - User's invites
- `POST /api/invites` - Create invite

---

**Last Updated**: 2025-08-30
**Project Version**: MVP v1.1 - Complete Review System
**Recent Milestone**: ✅ End-to-end review creation and display with Google Places photos
**Next AI**: The review system is fully operational! Ready for additional features like photo uploads, restaurant detail pages, and more! 🚀