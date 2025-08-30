/**
 * Authentication configuration constants
 * Centralized auth settings for consistency across the application
 */

/** Timeout duration for profile fetch operations (in milliseconds) */
export const AUTH_PROFILE_TIMEOUT = 3000;

/** Timeout duration for session refresh operations (in milliseconds) */
export const AUTH_SESSION_TIMEOUT = 5000;

/** Default role for new users */
export const DEFAULT_USER_ROLE = 'user' as const;

/** Auth cookie name patterns for conflict detection */
export const AUTH_COOKIE_PATTERNS = {
  SUPABASE: 'sb-',
  LOCALHOST: '127',
  VERIFIER: 'code-verifier',
  TOKEN: 'auth-token',
} as const;

/** Auth-related routes */
export const AUTH_ROUTES = {
  CALLBACK: '/auth/callback',
  ERROR: '/auth/auth-code-error',
  SIGNIN: '/',
} as const;

/** User profile fallback data template */
export const PROFILE_FALLBACK_TEMPLATE = {
  home_city: null,
  role: DEFAULT_USER_ROLE,
  avatar_url: null,
} as const;

/** Auth error types for better error handling */
export const AUTH_ERROR_TYPES = {
  PROFILE_TIMEOUT: 'PROFILE_FETCH_TIMEOUT',
  SESSION_INVALID: 'SESSION_INVALID',
  COOKIE_CONFLICT: 'COOKIE_CONFLICT',
  PROFILE_CREATE_FAILED: 'PROFILE_CREATE_FAILED',
  CODE_EXCHANGE_FAILED: 'CODE_EXCHANGE_FAILED',
} as const;

/** Auth debug levels for conditional logging */
export const AUTH_DEBUG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

/** Current debug level (can be configured via environment variable) */
export const CURRENT_DEBUG_LEVEL = 
  process.env.NODE_ENV === 'development' 
    ? AUTH_DEBUG_LEVELS.DEBUG 
    : AUTH_DEBUG_LEVELS.ERROR;