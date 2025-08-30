'use client';

import { useState } from 'react';
import { InviteCodeValidation, InviteCodeSession } from '@/types';

export function useInviteCode() {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string>('');

  const validateCode = async (code: string): Promise<InviteCodeValidation & { sessionData?: InviteCodeSession }> => {
    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/auth/validate-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to validate invite code');
        return { valid: false, message: result.message || 'Failed to validate invite code' };
      }

      return result;
    } catch (error) {
      console.error('Error validating invite code:', error);
      const errorMessage = 'Something went wrong. Please try again.';
      setError(errorMessage);
      return { valid: false, message: errorMessage };
    } finally {
      setIsValidating(false);
    }
  };

  const getStoredSession = (): InviteCodeSession | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const sessionData = sessionStorage.getItem('inviteCodeSession');
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData) as InviteCodeSession;
      
      // Check if session is expired (valid for 30 minutes)
      const validatedAt = new Date(session.validatedAt).getTime();
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (now - validatedAt > thirtyMinutes) {
        sessionStorage.removeItem('inviteCodeSession');
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error parsing invite code session:', error);
      sessionStorage.removeItem('inviteCodeSession');
      return null;
    }
  };

  const storeSession = (sessionData: InviteCodeSession) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('inviteCodeSession', JSON.stringify(sessionData));
  };

  const clearSession = () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('inviteCodeSession');
  };

  return {
    validateCode,
    getStoredSession,
    storeSession,
    clearSession,
    isValidating,
    error,
  };
}