import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AuditLogFilters, AuditAction, AuditTargetType } from '@/types';
import { permissionService } from '@/lib/auth/permissions';
import { auditService } from '@/lib/auth/audit';

/**
 * GET /api/admin/audit
 * Retrieve audit log entries (Admin only)
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

    // Check if user has permission to view audit logs (Admin only)
    try {
      await permissionService.ensureCan(user.id, 'view_audit_log');
    } catch (permissionError) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          message: 'Administrator privileges required to view audit logs'
        },
        { status: 403 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filters: AuditLogFilters = {};

    // Extract filters from query parameters
    if (searchParams.get('action')) {
      filters.action = searchParams.get('action') as AuditAction;
    }
    if (searchParams.get('actor_id')) {
      filters.actor_id = searchParams.get('actor_id')!;
    }
    if (searchParams.get('group_id')) {
      filters.group_id = searchParams.get('group_id')!;
    }
    if (searchParams.get('target_type')) {
      filters.target_type = searchParams.get('target_type') as AuditTargetType;
    }
    if (searchParams.get('from_date')) {
      filters.from_date = searchParams.get('from_date')!;
    }
    if (searchParams.get('to_date')) {
      filters.to_date = searchParams.get('to_date')!;
    }
    if (searchParams.get('limit')) {
      filters.limit = parseInt(searchParams.get('limit')!);
    }
    if (searchParams.get('offset')) {
      filters.offset = parseInt(searchParams.get('offset')!);
    }

    // Get audit log data
    const auditData = await auditService.getAuditLog(filters);

    return NextResponse.json(auditData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/audit/stats
 * Get audit statistics (Admin only)
 */
export async function POST(request: NextRequest) {
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

    // Check if user has permission to view audit logs (Admin only)
    try {
      await permissionService.ensureCan(user.id, 'view_audit_log');
    } catch (permissionError) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions', 
          message: 'Administrator privileges required to view audit statistics'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const stats = await auditService.getAuditStats(body);

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}