/**
 * Authentication-related TypeScript type definitions
 */

import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from './index';

/** Auth state for the useAuth hook */
export interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
  passwordSet: boolean;
  isAdmin: boolean;
  firstLoginCompleted: boolean;
}

/** Auth error with specific type and context */
export interface AuthError {
  type: string;
  message: string;
  code?: string;
  context?: Record<string, unknown>;
}

/** Profile fetch result */
export interface ProfileFetchResult {
  profile: User | null;
  error: AuthError | null;
  isTimeout: boolean;
  isFallback: boolean;
}

/** Session validation result */
export interface SessionValidationResult {
  isValid: boolean;
  session: Session | null;
  error?: AuthError;
}

/** Cookie conflict detection result */
export interface CookieConflictResult {
  hasConflicts: boolean;
  conflictingCookies: Array<{
    name: string;
    value: string;
    domain?: string;
  }>;
  currentProjectId: string;
}

/** User profile creation data */
export interface ProfileCreationData {
  id: string;
  email: string;
  name: string;
  avatar_url?: string | null;
  home_city?: string | null;
  role?: 'user' | 'admin';
}

/** Auth callback processing result */
export interface AuthCallbackResult {
  success: boolean;
  user?: SupabaseUser;
  profileCreated: boolean;
  error?: AuthError;
  redirectUrl: string;
}

/** Auth debug log entry */
export interface AuthDebugLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: Record<string, unknown>;
}

/** Auth configuration options */
export interface AuthConfig {
  profileTimeout: number;
  sessionTimeout: number;
  enableFallback: boolean;
  debugLevel: number;
  enableCookieCleanup: boolean;
}

/** Magic link request data */
export interface MagicLinkRequest {
  id: string;
  email: string;
  requested_by_ip?: string;
  requested_by_user_agent?: string;
  status: 'pending' | 'approved' | 'denied';
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  processor?: User;
}

/** Login credentials for email/password authentication */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Set password request for initial password setup */
export interface SetPasswordRequest {
  password: string;
  confirmPassword: string;
}

/** Magic link request submission data */
export interface MagicLinkRequestData {
  email: string;
  userAgent?: string;
  ipAddress?: string;
}

/** Enhanced profile creation data with password support */
export interface EnhancedProfileCreationData extends ProfileCreationData {
  password_set?: boolean;
  is_admin_user?: boolean;
  first_login_completed?: boolean;
}

/** Password authentication result */
export interface PasswordAuthResult {
  success: boolean;
  user?: SupabaseUser;
  error?: AuthError;
  requiresPasswordSetup?: boolean;
}

/** Admin operations result */
export interface AdminOperationResult {
  success: boolean;
  message: string;
  error?: AuthError;
}