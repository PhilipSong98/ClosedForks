import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Capability, PermissionCheck } from '@/types';
import { permissionService } from '@/lib/auth/permissions';

/**
 * GET /api/auth/check-permission
 * Check a specific permission with detailed reasoning
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
    const capability = searchParams.get('capability') as Capability;
    const groupId = searchParams.get('group_id') || undefined;

    if (!capability) {
      return NextResponse.json(
        { error: 'Capability parameter is required' },
        { status: 400 }
      );
    }

    // Check permission with detailed reasoning
    const permissionCheck = await permissionService.checkPermission(
      user.id,
      capability,
      { groupId }
    );

    return NextResponse.json(permissionCheck);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}