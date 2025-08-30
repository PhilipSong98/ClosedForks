'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';
import { AUTH_PROFILE_TIMEOUT } from '@/lib/constants/auth';
import { 
  createFallbackUser, 
  createTimeoutController, 
  authLog,
  sanitizeUserForLogging 
} from '@/lib/utils/auth';
// import type { AuthState } from '@/types/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Enhanced auth states
  const passwordSet = user?.password_set ?? false;
  const isAdmin = user?.is_admin_user ?? false;
  const firstLoginCompleted = user?.first_login_completed ?? false;

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('useAuth: Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('useAuth: Error getting session:', error);
          setLoading(false);
          return;
        }
        
        console.log('useAuth: Initial session:', session ? 'found' : 'not found', session?.user?.id);
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('useAuth: Unexpected error getting session:', error);
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('useAuth: Auth state changed:', event, session ? 'session exists' : 'no session');
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    const fallbackUser = createFallbackUser(authUser);

    try {
      authLog('info', 'Fetching user profile', { 
        userId: authUser.id,
        userEmail: authUser.email?.substring(0, 3) + '***'
      });
      
      // Create timeout controller to prevent hanging
      const { controller, timeoutId } = createTimeoutController(AUTH_PROFILE_TIMEOUT);
      
      // Handle timeout
      const timeoutPromise = new Promise((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Profile fetch timeout'));
        });
      });
      
      // Profile query
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      // Race between query and timeout
      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data: profile, error } = result as { data: User | null; error: any };
      
      clearTimeout(timeoutId);
      
      authLog('debug', 'Profile query completed', { 
        hasProfile: !!profile, 
        hasError: !!error,
        errorCode: error?.code 
      });

      if (error) {
        authLog('warn', 'Profile fetch error, using fallback', { 
          errorCode: error.code, 
          errorMessage: error.message 
        });
        setUser(fallbackUser);
      } else if (profile) {
        authLog('info', 'Profile found and set', sanitizeUserForLogging(profile));
        setUser(profile);
      } else {
        authLog('warn', 'No profile returned, using fallback');
        setUser(fallbackUser);
      }
      
    } catch (error) {
      const isTimeout = error instanceof Error && error.message.includes('timeout');
      
      authLog(isTimeout ? 'warn' : 'error', 
        isTimeout ? 'Profile fetch timed out, using fallback' : 'Profile fetch failed', 
        { error: error instanceof Error ? error.message : String(error) }
      );
      
      setUser(fallbackUser);
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<User>) => {
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
  };

  // Enhanced authentication methods
  const signInWithPassword = async (email: string, password: string) => {
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
        data: null 
      };
    }
  };

  const requestMagicLink = async (email: string) => {
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
        error: error instanceof Error ? error : new Error('Failed to request magic link') 
      };
    }
  };

  const setPassword = async (password: string, confirmPassword: string) => {
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

      // Refresh user data after successful password set
      if (user) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await fetchUserProfile(authUser);
        }
      }

      return { error: null, result };
    } catch (error) {
      return { 
        error: error instanceof Error ? error : new Error('Failed to set password') 
      };
    }
  };

  return {
    // User state
    user,
    loading,
    
    // Enhanced auth state
    passwordSet,
    isAdmin,
    firstLoginCompleted,
    
    // Authentication methods
    signInWithEmail,
    signInWithPassword,
    requestMagicLink,
    setPassword,
    signOut,
    updateProfile,
  };
}