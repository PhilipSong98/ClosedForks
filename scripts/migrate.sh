#!/bin/bash

# Supabase Migration Helper Script
# Usage: ./scripts/migrate.sh [local|remote]

set -e

if [ "$1" = "local" ]; then
    echo "🚀 Running migrations locally..."
    supabase db reset
elif [ "$1" = "remote" ]; then
    echo "🚀 Running migrations on remote database..."
    supabase db push
elif [ "$1" = "status" ]; then
    echo "📊 Checking migration status..."
    supabase migration list
else
    echo "Usage: $0 [local|remote|status]"
    echo ""
    echo "local  - Reset and migrate local database"
    echo "remote - Push migrations to remote database" 
    echo "status - Check migration status"
    exit 1
fi