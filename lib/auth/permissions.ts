import { createClient } from '@/lib/supabase/server';
import { 
  Capability, 
  PermissionContext, 
  PermissionCheck, 
  GroupRole
} from '@/types';

/**
 * Centralized Permission Service for RBAC
 * 
 * This service provides capability-based access control by leveraging
 * the database functions for permission checking and role resolution.
 */
export class PermissionService {

  /**
   * Check if a user has a specific capability
   */
  async can(
    userId: string, 
    capability: Capability, 
    context?: { groupId?: string }
  ): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data, error } = await (supabase as unknown as {
        rpc: (name: string, params: Record<string, unknown>) => Promise<{data: boolean; error: unknown}>
      })
        .rpc('can_user_perform', {
          user_id_param: userId,
          capability_param: capability,
          group_id_param: context?.groupId || null
        });

      if (error) {
        console.error('Permission check error:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Permission service error:', error);
      return false;
    }
  }

  /**
   * Ensure user has capability (throws error if not)
   */
  async ensureCan(
    userId: string,
    capability: Capability,
    context?: { groupId?: string }
  ): Promise<void> {
    const hasPermission = await this.can(userId, capability, context);
    
    if (!hasPermission) {
      throw new PermissionError(
        `Insufficient permissions: ${capability} capability required`,
        capability,
        context
      );
    }
  }

  /**
   * Get user's complete permission context
   */
  async getUserPermissions(
    userId: string,
    groupId?: string
  ): Promise<PermissionContext> {
    try {
      const supabase = await createClient();
      
      // Get user's global role
      const { data: globalRole } = await (supabase as unknown as {
        rpc: (name: string, params: Record<string, unknown>) => Promise<{data: string}>
      }).rpc('get_user_global_role', { user_id_param: userId });

      // Get user's group role if group specified
      let groupRole: GroupRole | undefined;
      if (groupId) {
        const { data: groupRoleData } = await (supabase as unknown as {
          rpc: (name: string, params: Record<string, unknown>) => Promise<{data: string}>
        }).rpc('get_user_group_role', { 
            user_id_param: userId,
            group_id_param: groupId 
          });
        
        if (groupRoleData && groupRoleData !== 'none') {
          groupRole = groupRoleData as GroupRole;
        }
      }

      // Get user's capabilities
      const { data: capabilities } = await (supabase as unknown as {
        rpc: (name: string, params: Record<string, unknown>) => Promise<{data: string[]}>
      }).rpc('get_user_capabilities', {
          user_id_param: userId,
          group_id_param: groupId || null
        });

      return {
        userId,
        globalRole: globalRole as 'admin' | 'user',
        groupRole,
        groupId,
        capabilities: (capabilities || []) as Capability[]
      };
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {
        userId,
        globalRole: 'user',
        groupRole: undefined,
        groupId,
        capabilities: []
      };
    }
  }

  /**
   * Check multiple capabilities at once
   */
  async checkCapabilities(
    userId: string,
    capabilities: Capability[],
    context?: { groupId?: string }
  ): Promise<Record<Capability, boolean>> {
    const results: Record<string, boolean> = {};
    
    // Check all capabilities in parallel
    const promises = capabilities.map(async (capability) => {
      const result = await this.can(userId, capability, context);
      return { capability, result };
    });

    const resolvedPromises = await Promise.all(promises);
    
    resolvedPromises.forEach(({ capability, result }) => {
      results[capability] = result;
    });

    return results as Record<Capability, boolean>;
  }

  /**
   * Detailed permission check with reasoning
   */
  async checkPermission(
    userId: string,
    capability: Capability,
    context?: { groupId?: string }
  ): Promise<PermissionCheck> {
    try {
      const hasPermission = await this.can(userId, capability, context);
      
      if (hasPermission) {
        return { allowed: true };
      }

      // Get user context to provide detailed reason
      const permissions = await this.getUserPermissions(userId, context?.groupId);
      
      // Determine what's missing
      let reason = 'Insufficient permissions';
      let requiredRole: string | undefined;
      
      // Check specific capability requirements
      switch (capability) {
        case 'create_group':
          requiredRole = 'Global Admin';
          reason = 'Only global administrators can create new groups';
          break;
        case 'manage_any_group':
        case 'view_audit_log':
        case 'manage_invites':
          requiredRole = 'Global Admin';
          reason = 'Global administrator privileges required';
          break;
        case 'manage_roles':
        case 'remove_member':
        case 'edit_group':
          requiredRole = 'Group Owner or Admin';
          reason = 'Group owner or admin role required within this group';
          break;
        case 'delete_group':
        case 'transfer_ownership':
          requiredRole = 'Group Owner';
          reason = 'Group owner role required';
          break;
        default:
          reason = `${capability} capability not available to current user`;
      }

      return {
        allowed: false,
        reason,
        requiredRole,
        missingCapability: capability
      };
    } catch (error) {
      console.error('Permission check error:', error);
      return {
        allowed: false,
        reason: 'Unable to verify permissions',
        missingCapability: capability
      };
    }
  }

  /**
   * Check if user is global admin
   */
  async isGlobalAdmin(userId: string): Promise<boolean> {
    return this.can(userId, 'create_group');
  }

  /**
   * Check if user is group owner
   */
  async isGroupOwner(userId: string, groupId: string): Promise<boolean> {
    return this.can(userId, 'delete_group', { groupId });
  }

  /**
   * Check if user is group admin or owner
   */
  async isGroupAdmin(userId: string, groupId: string): Promise<boolean> {
    return this.can(userId, 'manage_roles', { groupId });
  }
}

/**
 * Custom error class for permission violations
 */
export class PermissionError extends Error {
  public readonly capability: Capability;
  public readonly context?: { groupId?: string };
  public readonly code = 'INSUFFICIENT_PERMISSIONS';

  constructor(
    message: string,
    capability: Capability,
    context?: { groupId?: string }
  ) {
    super(message);
    this.name = 'PermissionError';
    this.capability = capability;
    this.context = context;
  }
}

/**
 * Singleton instance for server-side use
 */
export const permissionService = new PermissionService();

/**
 * Helper function to get user's capabilities for a group
 */
export async function getUserGroupCapabilities(
  userId: string,
  groupId?: string
): Promise<Capability[]> {
  const permissions = await permissionService.getUserPermissions(userId, groupId);
  return permissions.capabilities;
}

/**
 * Helper function to check if user can perform action on group
 */
export async function canUserPerformOnGroup(
  userId: string,
  capability: Capability,
  groupId: string
): Promise<boolean> {
  return permissionService.can(userId, capability, { groupId });
}

/**
 * Higher-order function for API route protection
 */
export function requireCapability(capability: Capability, groupIdExtractor?: (request: Request) => string) {
  return async (
    userId: string,
    request?: Request
  ): Promise<void> => {
    const groupId = groupIdExtractor ? groupIdExtractor(request!) : undefined;
    await permissionService.ensureCan(userId, capability, { groupId });
  };
}

/**
 * Middleware helper to extract common request info
 */
export function getRequestInfo(request: Request) {
  return {
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') ||
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}