import { createClient } from '@/lib/supabase/server';
import { 
  AuditAction, 
  AuditTargetType, 
  AuditLogEntry,
  AuditLogFilters,
  AuditLogResponse
} from '@/types';

/**
 * Audit Logging Service
 * 
 * Provides centralized audit logging for all sensitive operations
 * in the system. All operations are logged to the database for
 * compliance and security monitoring.
 */
export class AuditService {

  /**
   * Log an audit event
   */
  async logEvent(params: {
    actorId: string;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    groupId?: string;
    metadata?: Record<string, unknown>;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    try {
      const supabase = await createClient();
      const { data: auditId, error } = await (supabase as unknown as {
        rpc: (name: string, params: Record<string, unknown>) => Promise<{data: string; error: unknown}>
      })
        .rpc('log_audit_event', {
          actor_id_param: params.actorId,
          action_param: params.action,
          target_type_param: params.targetType,
          target_id_param: params.targetId,
          group_id_param: params.groupId || null,
          metadata_param: params.metadata || {},
          reason_param: params.reason || null,
          ip_address_param: params.ipAddress || null,
          user_agent_param: params.userAgent || null
        });

      if (error) {
        console.error('Audit logging error:', error);
        return null;
      }

      return auditId;
    } catch (error) {
      console.error('Audit service error:', error);
      return null;
    }
  }

  /**
   * Get audit log entries with filtering and pagination
   */
  async getAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
    try {
      const supabase = await createClient();
      const {
        action,
        actor_id,
        group_id,
        target_type,
        from_date,
        to_date,
        limit = 50,
        offset = 0
      } = filters;

      // Build query
      let query = supabase
        .from('audit_log')
        .select(`
          id,
          actor_id,
          action,
          target_type,
          target_id,
          group_id,
          metadata,
          reason,
          ip_address,
          user_agent,
          created_at,
          actor:users!actor_id (
            id,
            name,
            full_name,
            email
          ),
          group:groups!group_id (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (action) query = query.eq('action', action);
      if (actor_id) query = query.eq('actor_id', actor_id);
      if (group_id) query = query.eq('group_id', group_id);
      if (target_type) query = query.eq('target_type', target_type);
      if (from_date) query = query.gte('created_at', from_date);
      if (to_date) query = query.lte('created_at', to_date);

      // Get total count for pagination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count: totalCount } = await (query as any).select('*', { count: 'exact', head: true });

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data: entries, error } = await query;

      if (error) {
        console.error('Error fetching audit log:', error);
        return { entries: [], count: 0, has_more: false };
      }

      // Enhance entries with target user info if needed
      const enhancedEntries = await this.enhanceAuditEntries(entries || []);

      return {
        entries: enhancedEntries,
        count: totalCount || 0,
        has_more: (offset + limit) < (totalCount || 0)
      };
    } catch (error) {
      console.error('Audit service error:', error);
      return { entries: [], count: 0, has_more: false };
    }
  }

  /**
   * Enhance audit entries with target user information
   */
  private async enhanceAuditEntries(entries: unknown[]): Promise<AuditLogEntry[]> {
    const typedEntries = entries as AuditLogEntry[];
    const userTargetEntries = typedEntries.filter(entry => entry.target_type === 'user');
    
    if (userTargetEntries.length === 0) {
      return typedEntries;
    }

    // Get user information for target users
    const supabase = await createClient();
    const targetUserIds = userTargetEntries.map(entry => entry.target_id);
    const { data: targetUsers } = await supabase
      .from('users')
      .select('id, name, full_name, email')
      .in('id', targetUserIds);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userMap = new Map((targetUsers || []).map((user: any) => [user.id, user]));

    // Enhance entries with target user info
    return typedEntries.map(entry => ({
      ...entry,
      target_user: entry.target_type === 'user' ? userMap.get(entry.target_id) : undefined
    }));
  }

  /**
   * Log group creation
   */
  async logGroupCreated(params: {
    actorId: string;
    groupId: string;
    groupName: string;
    groupDescription?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    return this.logEvent({
      actorId: params.actorId,
      action: 'group_created',
      targetType: 'group',
      targetId: params.groupId,
      groupId: params.groupId,
      metadata: {
        group_name: params.groupName,
        group_description: params.groupDescription
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log group update
   */
  async logGroupUpdated(params: {
    actorId: string;
    groupId: string;
    changes: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    return this.logEvent({
      actorId: params.actorId,
      action: 'group_updated',
      targetType: 'group',
      targetId: params.groupId,
      groupId: params.groupId,
      metadata: { changes: params.changes },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log role change
   */
  async logRoleChanged(params: {
    actorId: string;
    targetUserId: string;
    groupId: string;
    oldRole: string;
    newRole: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    return this.logEvent({
      actorId: params.actorId,
      action: 'role_changed',
      targetType: 'user',
      targetId: params.targetUserId,
      groupId: params.groupId,
      metadata: {
        old_role: params.oldRole,
        new_role: params.newRole
      },
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log member removal
   */
  async logMemberRemoved(params: {
    actorId: string;
    targetUserId: string;
    groupId: string;
    removedRole: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    return this.logEvent({
      actorId: params.actorId,
      action: 'member_removed',
      targetType: 'user',
      targetId: params.targetUserId,
      groupId: params.groupId,
      metadata: {
        removed_role: params.removedRole
      },
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log invite code generation
   */
  async logInviteCodeGenerated(params: {
    actorId: string;
    inviteCodeId: string;
    groupId?: string;
    code: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    return this.logEvent({
      actorId: params.actorId,
      action: 'invite_code_generated',
      targetType: 'invite_code',
      targetId: params.inviteCodeId,
      groupId: params.groupId,
      metadata: {
        code: params.code
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Log ownership transfer
   */
  async logOwnershipTransferred(params: {
    actorId: string;
    newOwnerId: string;
    groupId: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<string | null> {
    return this.logEvent({
      actorId: params.actorId,
      action: 'ownership_transferred',
      targetType: 'user',
      targetId: params.newOwnerId,
      groupId: params.groupId,
      metadata: {
        previous_owner: params.actorId,
        new_owner: params.newOwnerId
      },
      reason: params.reason,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }

  /**
   * Get audit statistics for admin dashboard
   */
  async getAuditStats(params: {
    from_date?: string;
    to_date?: string;
    group_id?: string;
  } = {}): Promise<{
    total_events: number;
    events_by_action: Record<AuditAction, number>;
    recent_activity: AuditLogEntry[];
  }> {
    try {
      const supabase = await createClient();
      // Get total events count
      let countQuery = supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true });

      if (params.from_date) countQuery = countQuery.gte('created_at', params.from_date);
      if (params.to_date) countQuery = countQuery.lte('created_at', params.to_date);
      if (params.group_id) countQuery = countQuery.eq('group_id', params.group_id);

      const { count: totalEvents } = await countQuery;

      // Get events by action
      let actionQuery = supabase
        .from('audit_log')
        .select('action');

      if (params.from_date) actionQuery = actionQuery.gte('created_at', params.from_date);
      if (params.to_date) actionQuery = actionQuery.lte('created_at', params.to_date);
      if (params.group_id) actionQuery = actionQuery.eq('group_id', params.group_id);

      const { data: actionData } = await actionQuery;

      const eventsByAction: Record<string, number> = {};
      (actionData || []).forEach((row: {action: string}) => {
        eventsByAction[row.action] = (eventsByAction[row.action] || 0) + 1;
      });

      // Get recent activity
      const { entries: recentActivity } = await this.getAuditLog({
        ...params,
        limit: 10,
        offset: 0
      });

      return {
        total_events: totalEvents || 0,
        events_by_action: eventsByAction as Record<AuditAction, number>,
        recent_activity: recentActivity
      };
    } catch (error) {
      console.error('Error getting audit stats:', error);
      return {
        total_events: 0,
        events_by_action: {} as Record<AuditAction, number>,
        recent_activity: []
      };
    }
  }
}

/**
 * Singleton instance for server-side use
 */
export const auditService = new AuditService();

/**
 * Helper function to create audit context from request
 */
export function createAuditContext(request: Request, actorId: string) {
  return {
    actorId,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') ||
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}