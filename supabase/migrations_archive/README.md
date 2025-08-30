# Archived Migrations

These migrations were created during the initial development phase and have been archived because they resulted in a messy, partially-applied state.

## Files in Archive

- `20250829230023_fix_users_table_schema.sql` - First attempt to fix users table
- `20250829231123_fix_rls_policy_recursion.sql` - Fix for RLS recursion issue  
- `20250829232355_fix_profile_creation_policy.sql` - Profile creation fix
- `20250829232628_initial_schema_setup.sql` - Reference schema

## Why Archived

The database ended up in a messy state with partial migrations applied, causing conflicts. Instead of trying to untangle the state, we reset everything with a single clean migration.

## Authentication Issues Resolved

All the authentication issues discovered during this process:
1. Users table not referencing auth.users properly ✅ Fixed
2. RLS policy infinite recursion ✅ Fixed  
3. Profile creation INSERT policy too restrictive ✅ Fixed

These fixes are incorporated into the new clean migration.

**Date Archived**: 2025-08-29
**Reason**: Clean slate approach for better maintainability