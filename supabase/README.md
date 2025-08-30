# Database Migrations

This directory contains database schema migrations for the Restaurant Reviews project.

## Quick Start

### ✅ Database Ready - Migration Applied Successfully

The clean-slate migration has been applied successfully! Your database now has:
- ✅ Complete, working authentication system
- ✅ All RLS policies properly configured
- ✅ Full schema with all tables, functions, and constraints

**For future migrations:**
```bash
supabase db push
```

## Migration Workflow

### Creating New Migrations

```bash
# Create a new migration
supabase migration new migration_name

# Edit the generated file in supabase/migrations/
```

### Running Migrations

```bash
# Local development (requires Docker)
./scripts/migrate.sh local

# Remote database  
./scripts/migrate.sh remote

# Check migration status
./scripts/migrate.sh status
```

## Current Status: ✅ DATABASE READY

**Date**: 2025-08-30  
**Action**: Clean-slate migration successfully applied  
**Status**: ✅ Database fully operational

---

## 🎯 Applied Migration

### ✅ 20250829233334_reset_and_initialize_database.sql (APPLIED)

**Purpose**: Complete database reset and clean initialization  
**Status**: ✅ Successfully applied

**What this migration accomplished**:
- ✅ Dropped all existing tables and policies (clean slate)
- ✅ Created complete, working schema in one go
- ✅ Incorporated ALL authentication fixes discovered during development
- ✅ Resulted in fully functional database with no conflicts

**Applied fixes**:
- ✅ Users table properly references auth.users (authentication working)
- ✅ Safe RLS policies (no recursion errors)
- ✅ Proper INSERT policies (profile creation working)
- ✅ All tables, indexes, functions, and constraints operational

---

## 📁 Archived Migrations (Reference Only)

**Location**: `supabase/migrations_archive/`

These migrations were archived due to messy, partially-applied state:

- ❌ `20250829230023_fix_users_table_schema.sql` - First users table fix
- ❌ `20250829231123_fix_rls_policy_recursion.sql` - RLS recursion fix  
- ❌ `20250829232355_fix_profile_creation_policy.sql` - Profile creation fix
- ❌ `20250829232628_initial_schema_setup.sql` - Reference schema

**Why archived**: Partial applications caused policy conflicts and unclear database state. Clean slate approach is more maintainable.

## Setup Instructions

### First-time Setup

1. **Install Supabase CLI** (already done):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Initialize project** (already done):
   ```bash
   supabase init
   ```

3. **Link to remote project**:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   ```

4. **Generate types** (optional but recommended):
   ```bash
   supabase gen types typescript --local > types/database.ts
   ```

### Environment Setup

Add to your `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Local Development with Docker

To run a local Supabase instance:

```bash
# Start local Supabase (requires Docker)
supabase start

# Apply migrations to local DB
supabase db reset

# Stop local instance
supabase stop
```

## Best Practices

1. **Always create migrations for schema changes** - Never modify the database directly
2. **Test migrations locally first** - Use `supabase start` to test with local Docker instance
3. **Keep migrations atomic** - One logical change per migration
4. **Use descriptive names** - Make migration purpose clear from filename
5. **Add comments** - Explain why changes are needed, not just what changes

## Troubleshooting

### "Cannot use automatic login flow inside non-TTY environments"

Use login token instead:
```bash
supabase login --token YOUR_ACCESS_TOKEN
```

### "No such container" errors

Start local Supabase first:
```bash
supabase start
```

### Authentication still not working after migration

1. Verify migration was applied in Supabase dashboard
2. Check that users table has correct foreign key constraint
3. Verify RLS policies are active
4. Clear browser storage and try signing in again

## Next Steps

1. Apply the current migration to fix authentication
2. Set up automated migration deployment in CI/CD
3. Add seed data for development
4. Set up type generation for better TypeScript integration