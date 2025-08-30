'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      console.log('useAuth: Getting initial session...');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('useAuth: Initial session:', session ? 'found' : 'not found', session?.user?.id);
      if (session?.user) {
        await fetchUserProfile(session.user);
      } else {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event, session ? 'session exists' : 'no session');
        if (session?.user) {
          await fetchUserProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (authUser: SupabaseUser) => {
    try {
      console.log('useAuth: Fetching user profile for:', authUser.id);
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.log('useAuth: Error fetching profile:', error.code, error.message);
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          console.log('useAuth: Creating new user profile');
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: authUser.id,
              email: authUser.email!,
              name: authUser.user_metadata?.full_name || authUser.email!.split('@')[0],
              avatar_url: authUser.user_metadata?.avatar_url,
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            console.log('useAuth: Created profile, setting user');
            setUser(newProfile);
          } else {
            console.error('useAuth: Error creating profile:', insertError);
          }
        }
      } else if (profile) {
        console.log('useAuth: Found existing profile, setting user');
        setUser(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
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

  return {
    user,
    loading,
    signInWithEmail,
    signOut,
    updateProfile,
  };
}