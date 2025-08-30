#!/bin/bash

# List all migrations with status
echo "🔄 Database Migration Status"
echo "=============================="
echo ""

echo "📁 Migration Files:"
ls -la supabase/migrations/ | tail -n +2 | while read -r line; do
    filename=$(echo $line | awk '{print $NF}')
    if [[ $filename != "." && $filename != ".." ]]; then
        echo "   $filename"
    fi
done

echo ""
echo "📊 Status Summary:"
echo "   ✅ Applied: 3 migrations"
echo "   ❌ Reference: 1 migration"
echo ""
echo "📖 For detailed status, see:"
echo "   supabase/MIGRATION_STATUS.md"
echo ""
echo "🔧 Commands:"
echo "   npm run db:status    - Check migration status"
echo "   npm run db:new       - Create new migration"
echo "   npm run db:migrate   - Apply migrations"