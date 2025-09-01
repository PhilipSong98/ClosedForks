import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import '@/types';
import { permissionService } from '@/lib/auth/permissions';

/**
 * GET /api/auth/permissions
 * Get user's permission context and capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('group_id') || undefined;

    // Get user's permission context
    const permissions = await permissionService.getUserPermissions(user.id, groupId);

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}