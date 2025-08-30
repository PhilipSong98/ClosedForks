/**
 * Authentication utility functions
 * Reusable auth logic for consistency and maintainability
 */

import { User as SupabaseUser } from '@supabase/supabase-js';
import { User } from '@/types';
import { 
  AUTH_COOKIE_PATTERNS, 
  PROFILE_FALLBACK_TEMPLATE,
  CURRENT_DEBUG_LEVEL,
  AUTH_DEBUG_LEVELS 
} from '@/lib/constants/auth';
import type { 
  ProfileCreationData, 
  CookieConflictResult, 
  AuthError,
  AuthDebugLog 
} from '@/types/auth';

/**
 * Create a fallback user profile from Supabase auth data
 */
export function createFallbackUser(authUser: SupabaseUser): User {
  return {
    id: authUser.id,
    email: authUser.email!,
    name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
    avatar_url: authUser.user_metadata?.avatar_url || PROFILE_FALLBACK_TEMPLATE.avatar_url,
    home_city: PROFILE_FALLBACK_TEMPLATE.home_city,
    role: PROFILE_FALLBACK_TEMPLATE.role,
    created_at: new Date().toISOString(),
  };
}

/**
 * Create profile creation data from Supabase auth user
 */
export function createProfileData(authUser: SupabaseUser): ProfileCreationData {
  return {
    id: authUser.id,
    email: authUser.email!,
    name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
    avatar_url: authUser.user_metadata?.avatar_url,
    home_city: null,
    role: PROFILE_FALLBACK_TEMPLATE.role,
  };
}

/**
 * Detect conflicting Supabase cookies from other projects
 */
export function detectCookieConflicts(
  cookies: Array<{ name: string; value: string }>,
  currentProjectUrl: string
): CookieConflictResult {
  const currentProjectId = extractProjectId(currentProjectUrl);
  
  const conflictingCookies = cookies.filter(cookie => 
    cookie.name.startsWith(AUTH_COOKIE_PATTERNS.SUPABASE) && 
    !cookie.name.includes(currentProjectId) &&
    (cookie.name.includes(AUTH_COOKIE_PATTERNS.LOCALHOST) || 
     cookie.name.includes('127'))
  );

  return {
    hasConflicts: conflictingCookies.length > 0,
    conflictingCookies,
    currentProjectId,
  };
}

/**
 * Extract project ID from Supabase URL
 */
function extractProjectId(supabaseUrl: string): string {
  try {
    return supabaseUrl.split('//')[1].split('.')[0];
  } catch {
    return 'unknown';
  }
}

/**
 * Create standardized auth error
 */
export function createAuthError(
  type: string, 
  message: string, 
  code?: string,
  context?: Record<string, unknown>
): AuthError {
  return {
    type,
    message,
    code,
    context,
  };
}

/**
 * Controlled auth logging based on debug level
 */
export function authLog(
  level: keyof typeof AUTH_DEBUG_LEVELS,
  message: string,
  context?: Record<string, unknown>
): void {
  const logLevel = AUTH_DEBUG_LEVELS[level.toUpperCase() as keyof typeof AUTH_DEBUG_LEVELS];
  
  if (logLevel <= CURRENT_DEBUG_LEVEL) {
    switch (level.toLowerCase()) {
      case 'error':
        console.error(`[AUTH ERROR] ${message}`, context);
        break;
      case 'warn':
        console.warn(`[AUTH WARN] ${message}`, context);
        break;
      case 'info':
        console.info(`[AUTH INFO] ${message}`, context);
        break;
      case 'debug':
        console.log(`[AUTH DEBUG] ${message}`, context);
        break;
    }
  }
}

/**
 * Create AbortController with timeout for cancelling requests
 */
export function createTimeoutController(timeoutMs: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return { controller, timeoutId };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate user display name from email or metadata
 */
export function generateDisplayName(
  email: string, 
  userMetadata?: Record<string, unknown>
): string {
  // Prefer full name from metadata
  if (userMetadata?.full_name) {
    return userMetadata.full_name;
  }
  
  // Fall back to email username
  return email.split('@')[0];
}

/**
 * Check if user has required role
 */
export function hasRole(user: User | null, requiredRole: 'user' | 'admin'): boolean {
  if (!user) return false;
  
  // Admin has access to everything
  if (user.role === 'admin') return true;
  
  // Check specific role
  return user.role === requiredRole;
}

/**
 * Sanitize user data for logging (remove sensitive info)
 */
export function sanitizeUserForLogging(user: User): Record<string, unknown> {
  return {
    id: user.id,
    email: user.email?.substring(0, 3) + '***', // Partially hide email
    role: user.role,
    hasAvatar: !!user.avatar_url,
    homeCity: user.home_city,
    createdAt: user.created_at,
  };
}