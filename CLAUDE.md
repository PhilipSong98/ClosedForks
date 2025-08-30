# CLAUDE.md - AI Assistant Documentation

This file provides comprehensive context for AI assistants working on the Restaurant Reviews project.

## 🎯 Project Overview

**What**: Mobile-first, invite-only restaurant review platform for friends & family
**Goal**: Private network for trusted restaurant recommendations  
**Status**: Core MVP implemented with Instagram-style feed

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
- [x] Enhanced filtering system with rating/price/date controls
- [x] Global search system with keyboard shortcuts
- [x] Modal-based responsive UI (Sheet mobile, Dialog desktop)
- [x] Mobile-first responsive design

### Pending Features
- [ ] Photo upload for reviews
- [ ] Restaurant detail pages with maps
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] User collections/lists

## 🏗️ Architecture & Key Files

### Project Structure
```
restaurant/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── home-client.tsx    # Instagram-style feed
│   └── restaurants/       # Restaurant discovery page
├── components/
│   ├── filters/           # EnhancedFilters system  
│   ├── layout/            # Header, AuthWrapper, FABs
│   ├── review/            # ReviewComposer, ReviewCard
│   ├── search/            # SearchBar, GlobalSearchModal
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── supabase/          # Database clients & middleware
│   ├── hooks/             # useAuth, useMediaQuery, etc.
│   └── validations/       # Zod schemas
├── supabase/migrations/   # Database migrations
└── constants/             # Tags, cuisines, cities
```

### Critical Files
- `app/welcome/page.tsx`: **NEW** - Modern landing page with 6-digit invite code entry
- `app/signup/page.tsx`: **NEW** - Complete account creation with validation
- `app/signin/page.tsx`: **NEW** - Email/password authentication (no magic links)
- `app/admin/invite-codes/page.tsx`: **NEW** - Admin invite code management
- `app/home-client.tsx`: Instagram-style feed with filtering
- `app/restaurants/page.tsx`: Restaurant discovery page
- `components/filters/EnhancedFilters.tsx`: Professional filter system
- `components/review/ReviewComposer.tsx`: Modal-based review creation
- `components/search/GlobalSearchModal.tsx`: Search with keyboard shortcuts
- `lib/hooks/useAuth.ts`: Authentication with fallback handling
- `supabase/migrations/`: Database schema (use migrations, not schema.sql)

## 🗄️ Database Schema

### Core Tables
- `users`: User profiles with roles (user/admin) + `full_name` field
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
- **Mobile UX**: Collapsible interface with live results counter
- **Real-time**: Client-side filtering for instant results

### Global Search
- **Fixed FAB**: Top-right with keyboard shortcuts (`/`, `Cmd/Ctrl+K`)
- **API**: `/api/search` searches reviews and restaurants with RLS
- **Responsive**: Full-screen mobile, centered desktop modal

### Google Places Integration
- **Stockholm-focused**: 50km bias, cost-optimized with session tokens
- **Auto-import**: Restaurant data, photos, hours on selection
- **Smart caching**: Store Google data permanently, refresh periodically

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

## 🚀 Next Steps
Ready for photo uploads, restaurant detail pages, and advanced social features!

---
**Last Updated**: 2025-08-30  
**Status**: MVP v1.3 - Instagram-Style Feed Complete