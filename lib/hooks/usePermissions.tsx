'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './useAuth';
import { 
  Capability, 
  PermissionContext, 
  PermissionCheck
} from '@/types';

/**
 * Hook for checking user permissions and capabilities
 */
export function usePermissions(groupId?: string) {
  const { user, isAdmin } = useAuth();
  const [permissions, setPermissions] = useState<PermissionContext | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user permissions from the server
  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('user_id', user.id);
      if (groupId) {
        params.append('group_id', groupId);
      }

      const response = await fetch(`/api/auth/permissions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      } else {
        console.error('Failed to fetch permissions:', response.statusText);
        setPermissions(null);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, groupId]);

  // Fetch permissions when user or groupId changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Check if user has a specific capability
   */
  const can = useCallback((capability: Capability): boolean => {
    if (!permissions) return false;
    return permissions.capabilities.includes(capability);
  }, [permissions]);

  /**
   * Check multiple capabilities at once
   */
  const canAny = useCallback((capabilities: Capability[]): boolean => {
    return capabilities.some(capability => can(capability));
  }, [can]);

  /**
   * Check if user has all specified capabilities
   */
  const canAll = useCallback((capabilities: Capability[]): boolean => {
    return capabilities.every(capability => can(capability));
  }, [can]);

  /**
   * Get permission check with detailed reasoning
   */
  const checkPermission = useCallback(async (capability: Capability): Promise<PermissionCheck> => {
    if (!user?.id) {
      return {
        allowed: false,
        reason: 'User not authenticated',
        missingCapability: capability
      };
    }

    // Quick check against cached permissions
    if (permissions && permissions.capabilities.includes(capability)) {
      return { allowed: true };
    }

    // If not in cache, make API call for detailed check
    try {
      const params = new URLSearchParams();
      params.append('user_id', user.id);
      params.append('capability', capability);
      if (groupId) {
        params.append('group_id', groupId);
      }

      const response = await fetch(`/api/auth/check-permission?${params}`);
      if (response.ok) {
        return await response.json();
      }
      
      return {
        allowed: false,
        reason: 'Permission check failed',
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
  }, [user?.id, permissions, groupId]);

  /**
   * Convenience methods for common permission checks
   */
  const convenience = useMemo(() => ({
    canCreateGroup: can('create_group'),
    canViewAuditLog: can('view_audit_log'),
    canManageInvites: can('manage_invites'),
    canEditGroup: can('edit_group'),
    canManageRoles: can('manage_roles'),
    canInviteMembers: can('invite_member'),
    canRemoveMembers: can('remove_member'),
    canDeleteGroup: can('delete_group'),
    canTransferOwnership: can('transfer_ownership'),
    canPostReview: can('post_review'),
    
    // Role checks
    isGlobalAdmin: isAdmin,
    isGroupOwner: permissions?.groupRole === 'owner',
    isGroupAdmin: permissions?.groupRole === 'admin',
    isGroupMember: permissions?.groupRole === 'member',
    
    // Composite checks
    canManageGroup: canAny(['edit_group', 'manage_roles', 'delete_group']),
    hasGroupRole: !!permissions?.groupRole,
    hasAnyRole: isAdmin || !!permissions?.groupRole
  }), [can, canAny, isAdmin, permissions?.groupRole]);

  return {
    // Core permission data
    permissions,
    loading,
    
    // Permission checking methods
    can,
    canAny,
    canAll,
    checkPermission,
    
    // Convenience properties
    ...convenience,
    
    // Utilities
    refetch: fetchPermissions,
    capabilities: permissions?.capabilities || [],
    globalRole: permissions?.globalRole || 'user',
    groupRole: permissions?.groupRole,
    userId: permissions?.userId || user?.id,
    groupId: permissions?.groupId || groupId
  };
}

/**
 * Hook for checking permissions without group context
 */
export function useGlobalPermissions() {
  return usePermissions();
}

/**
 * Hook for checking permissions within a specific group
 */
export function useGroupPermissions(groupId: string) {
  return usePermissions(groupId);
}

/**
 * Hook that returns permission state for multiple capabilities
 */
export function useCapabilities(capabilities: Capability[], groupId?: string) {
  const { can, loading } = usePermissions(groupId);
  
  const permissionStates = useMemo(() => {
    const states: Record<Capability, boolean> = {} as Record<Capability, boolean>;
    capabilities.forEach(capability => {
      states[capability] = can(capability);
    });
    return states;
  }, [capabilities, can]);

  return {
    permissions: permissionStates,
    loading,
    hasAny: Object.values(permissionStates).some(Boolean),
    hasAll: Object.values(permissionStates).every(Boolean),
    missing: capabilities.filter(cap => !permissionStates[cap])
  };
}

/**
 * Higher-order component for conditional rendering based on permissions
 */
export function withPermission<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  capability: Capability,
  fallback?: React.ComponentType<T> | React.ReactElement | null
) {
  return function PermissionWrappedComponent(props: T) {
    const { can, loading } = usePermissions();

    if (loading) {
      return null; // or a loading spinner
    }

    if (!can(capability)) {
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        } else {
          const FallbackComponent = fallback as React.ComponentType<T>;
          return <FallbackComponent {...props} />;
        }
      }
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * Component for conditionally rendering children based on permissions
 */
export function PermissionGate({ 
  capability, 
  groupId, 
  children, 
  fallback,
  requireAll = false
}: {
  capability: Capability | Capability[];
  groupId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAll?: boolean;
}) {
  const { can, canAll, canAny, loading } = usePermissions(groupId);

  if (loading) {
    return null; // or loading state
  }

  const capabilities = Array.isArray(capability) ? capability : [capability];
  const hasPermission = requireAll ? canAll(capabilities) : canAny(capabilities);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}