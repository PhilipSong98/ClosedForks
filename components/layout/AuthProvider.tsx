'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';
import { AUTH_PROFILE_TIMEOUT } from '@/lib/constants/auth';
import {
  authLog,
  createFallbackUser,
  createTimeoutController,
  sanitizeUserForLogging,
} from '@/lib/utils/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  passwordSet: boolean;
  isAdmin: boolean;
  firstLoginCompleted: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null; result?: unknown }>;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: Error | null; data: unknown }>; // matches existing usage signature
  requestMagicLink: (
    email: string,
  ) => Promise<{ error: Error | null; result?: unknown }>;
  setPassword: (
    password: string,
    confirmPassword: string,
  ) => Promise<{ error: Error | null; result?: unknown }>;
  signOut: () => Promise<{ error: Error | null }>;
  updateProfile: (
    updates: Partial<User>,
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useProvideAuth();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useProvideAuth(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const passwordSet = user?.password_set ?? false;
  const isAdmin = user?.is_admin_user ?? false;
  const firstLoginCompleted = user?.first_login_completed ?? false;

  const fetchUserProfile = useCallback(async (authUser: SupabaseUser) => {
    const fallbackUser = createFallbackUser(authUser);

    try {
      authLog('INFO', 'Fetching user profile', {
        userId: authUser.id,
        userEmail: authUser.email?.substring(0, 3) + '***',
      });

      const { controller, timeoutId } = createTimeoutController(AUTH_PROFILE_TIMEOUT);

      const timeoutPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Profile fetch timeout'));
        });
      });

      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data: profile, error } = result as { data: User | null; error: Error | null };

      clearTimeout(timeoutId);

      authLog('DEBUG', 'Profile query completed', {
        hasProfile: !!profile,
        hasError: !!error,
        errorCode: (error as { code?: string } | null)?.code,
      });

      if (error) {
        authLog('WARN', 'Profile fetch error, using fallback', {
          errorCode: (error as { code?: string } | null)?.code,
          errorMessage: error.message,
        });
        setUser(fallbackUser);
      } else if (profile) {
        authLog('INFO', 'Profile found and set', sanitizeUserForLogging(profile));
        setUser(profile);
      } else {
        authLog('WARN', 'No profile returned, using fallback');
        setUser(fallbackUser);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isTimeout = message.includes('timeout');

      authLog(isTimeout ? 'WARN' : 'ERROR', isTimeout ? 'Profile fetch timed out, using fallback' : 'Profile fetch failed', {
        error: message,
      });

      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const getInitialSession = async () => {
      try {
        authLog('DEBUG', 'Getting initial session');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          authLog('ERROR', 'Error getting session', { error: error.message });
          setLoading(false);
          return;
        }

        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        authLog('ERROR', 'Unexpected error getting session', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      authLog('DEBUG', 'Auth state changed', {
        hasSession: !!session,
        userId: session?.user?.id,
      });

      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return { error: new Error('No user logged in') };

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (!error && data) {
        setUser(data);
      }

      return { error };
    },
    [user],
  );

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error, data: null };
      }

      return { error: null, data };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Login failed'),
        data: null,
      };
    }
  }, []);

  const requestMagicLink = useCallback(async (email: string) => {
    try {
      const response = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { error: new Error(result.error || 'Failed to request magic link') };
      }

      return { error: null, result };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Failed to request magic link'),
      };
    }
  }, []);

  const setPassword = useCallback(
    async (password: string, confirmPassword: string) => {
      try {
        const response = await fetch('/api/auth/set-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password, confirmPassword }),
        });

        const result = await response.json();

        if (!response.ok) {
          return { error: new Error(result.error || 'Failed to set password') };
        }

        if (user) {
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();
          if (authUser) {
            await fetchUserProfile(authUser);
          }
        }

        return { error: null, result };
      } catch (error) {
        return {
          error: error instanceof Error ? error : new Error('Failed to set password'),
        };
      }
    },
    [fetchUserProfile, user],
  );

  return useMemo(
    () => ({
      user,
      loading,
      passwordSet,
      isAdmin,
      firstLoginCompleted,
      signInWithEmail,
      signInWithPassword,
      requestMagicLink,
      setPassword,
      signOut,
      updateProfile,
    }),
    [
      user,
      loading,
      passwordSet,
      isAdmin,
      firstLoginCompleted,
      signInWithEmail,
      signInWithPassword,
      requestMagicLink,
      setPassword,
      signOut,
      updateProfile,
    ],
  );
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

