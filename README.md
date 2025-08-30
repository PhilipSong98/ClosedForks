# Restaurant Reviews - Private Network

A mobile-first, invite-only restaurant review site for friends & family. Share trusted restaurant recommendations within your private network.

## Features

- 🔐 **Private by Default** - Invite-only access with magic link authentication
- 🍽️ **Restaurant Management** - Add restaurants manually or with optional Google Maps integration
- ⭐ **Multi-dimensional Reviews** - Rate food, service, vibe, and value separately
- 📱 **Mobile-First Design** - Responsive UI optimized for mobile devices
- 🌍 **Location Aware** - Filter by city and cuisine types
- 👥 **Network-Based** - Reviews visible only to your trusted network
- 📧 **Email Notifications** - Powered by Resend for invites and updates
- 🔒 **Secure** - Row-level security with Supabase

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Email**: Resend
- **Deployment**: Vercel
- **Validation**: Zod

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
NEXT_PUBLIC_ENABLE_MAPS=false

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

#### Option 1: Using Migrations (Recommended)

1. Create a new Supabase project
2. Apply the migrations (see `supabase/README.md` for detailed instructions)
3. **Current Status**: ✅ Authentication is working properly

**Applied Migrations:**
- `20250829230023_fix_users_table_schema.sql` - Fixed users table schema
- `20250829231123_fix_rls_policy_recursion.sql` - Fixed RLS policy recursion

For future schema changes, see `supabase/README.md` for migration workflow.

#### Option 2: Manual Setup (Legacy)

1. Create a new Supabase project  
2. Run the SQL schema from `supabase/schema.sql` in your Supabase SQL editor
3. Enable Row Level Security (RLS) - it's configured automatically by the schema

**Note**: The manual setup has known authentication issues. Use the migration approach above.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

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
- `POST /api/reviews` - Create new review
- `PUT /api/reviews/[id]` - Update own review
- `DELETE /api/reviews/[id]` - Delete own review

### Invites
- `GET /api/invites` - List user's invites
- `POST /api/invites` - Create new invite
- `POST /api/invites/[code]/accept` - Accept invite (public)

## Feature Flags

### Maps Integration

Set `NEXT_PUBLIC_ENABLE_MAPS=true` to enable:
- Google Places autocomplete for restaurant search
- Automatic address and location filling
- Map display on restaurant pages

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
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   ├── restaurant/     # Restaurant-related components
│   └── ui/             # shadcn/ui components
├── lib/                # Utilities and configurations
│   ├── supabase/       # Supabase client configuration
│   ├── hooks/          # Custom React hooks
│   └── validations/    # Zod schemas
├── types/              # TypeScript type definitions
├── constants/          # App constants
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
