# Restaurant Reviews - Private Network

A mobile-first, invite-only restaurant review site for friends & family. Share trusted restaurant recommendations within your private network.

## Features

- 🔐 **Private by Default** - Invite-only access with magic link authentication
- 🍽️ **Smart Restaurant Discovery** - Google Places API integration with autocomplete search
- ⭐ **Simplified Review System** - Clean, user-friendly single rating with detailed text reviews
- 🎨 **Modern UI Design** - Beautiful, clean interface integrated from Lovable with responsive popups
- 📱 **Mobile-First Design** - Responsive UI optimized for mobile devices with conditional rendering
- 🌍 **Location Aware** - Stockholm-focused with 50km radius bias
- 👥 **Network-Based** - Reviews visible only to your trusted network
- 📧 **Email Notifications** - Powered by Resend for invites and updates
- 🔒 **Secure** - Row-level security with Supabase
- 🗺️ **Maps Integration** - Free Google Maps links for directions and venue details

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

### 🖼️ Complete Review System Overhaul (Latest - August 30, 2025)

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

For future schema changes, see `supabase/README.md` for migration workflow.

### Authentication Setup

The app uses Supabase Auth with magic links. **No additional setup required** - authentication is production-ready with:

- ✅ PKCE flow for security
- ✅ Automatic profile creation  
- ✅ Session persistence across reloads
- ✅ Robust error handling and fallbacks

**Callback URL Configuration:**
In your Supabase project → Authentication → URL Configuration:
- Site URL: `http://localhost:3000` (development) or your domain (production)
- Redirect URLs: `http://localhost:3000/auth/callback` (add your production callback too)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Troubleshooting

### Authentication Issues

**🔄 Infinite Loading After Magic Link**
- **Cause**: Conflicting cookies from multiple Supabase projects
- **Fix**: Clear all cookies for localhost:3000:
  1. Open DevTools (F12) → Application tab
  2. Storage → Cookies → localhost:3000
  3. Right-click → Clear or delete all cookies
  4. Refresh and try again

**❌ "Code verifier should be non-empty" Error**
- **Cause**: PKCE flow cookies missing or corrupted
- **Fix**: Clear cookies and request a fresh magic link

**⏱️ Profile Fetch Timeout**
- **Cause**: Database connectivity or RLS policy issues
- **Fix**: App automatically uses fallback data - no action needed

**🔑 Session Not Persisting Across Reloads**
- **Cause**: Cookie configuration problems
- **Fix**: Check that `@supabase/ssr` is properly configured

### Development Issues

**📦 Build Failures**
```bash
npm run type-check  # Check TypeScript errors first
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
- **restaurants** - Restaurant information with location and details
- **reviews** - Multi-dimensional ratings with text and photos
- **invites** - Invitation system with codes and expiry
- **reports** - Content moderation system
- **review_photos** - Photo storage for reviews

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
- `GET /api/reviews` - List reviews with filters
- `POST /api/reviews` - Create new review (simplified schema: restaurant, rating, dish, review, recommend, tips)
- `PUT /api/reviews/[id]` - Update own review
- `DELETE /api/reviews/[id]` - Delete own review

**Note**: Review schema has been simplified from multi-dimensional ratings to a single rating with detailed text for better user experience.

### Google Places Integration
- `POST /api/places/autocomplete` - Search restaurants via Google Places
- `POST /api/places/details` - Get detailed restaurant info from Google
- `POST /api/restaurants/find-or-create` - Find existing or import from Google

### Invites
- `GET /api/invites` - List user's invites
- `POST /api/invites` - Create new invite
- `POST /api/invites/[code]/accept` - Accept invite (public)

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
├── app/                 # Next.js app router pages
│   ├── providers.tsx   # Tanstack Query and UI providers
│   └── home-client.tsx # Main home page client component
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components (Header, AuthWrapper)
│   ├── restaurant/     # Restaurant-related components
│   ├── review/         # Review components (ReviewComposer, RatingInput)
│   ├── search/         # Search components (SearchBar)
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and configurations
│   ├── supabase/       # Supabase client configuration
│   ├── hooks/          # Custom React hooks (useAuth, useMediaQuery)
│   └── validations/    # Zod schemas
├── types/              # TypeScript type definitions
├── constants/          # App constants
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
npm run type-check   # Run TypeScript checks

# Database
# Run SQL files in Supabase dashboard SQL editor
```

## Security Features

- **Authentication**: Magic link auth via Supabase
- **Authorization**: Row-level security policies
- **Data Privacy**: Reviews visible only to network members
- **Input Validation**: Zod schemas for all API endpoints
- **Rate Limiting**: Built-in via Supabase
- **HTTPS**: Enforced in production
- **CORS**: Configured for secure API access

## Business Rules

1. **Restaurant Duplicates**: Prevented by name+city combination
2. **Review Limits**: One review per user per restaurant
3. **Network Visibility**: Reviews visible to authenticated users (MVP treats all as network)
4. **Admin Powers**: Admins can edit restaurants and moderate content
5. **Invite Expiry**: Invites expire after 7 days by default

## Troubleshooting

### Common Issues

1. **Database Connection**: Check Supabase URL and keys
2. **Authentication**: Verify callback URL in Supabase Auth settings
3. **Email Delivery**: Confirm Resend API key and domain setup
4. **Build Errors**: Run `npm run type-check` to identify TypeScript issues

### Support

For issues and feature requests, check the GitHub repository or contact the development team.

## License

Private project - All rights reserved.
