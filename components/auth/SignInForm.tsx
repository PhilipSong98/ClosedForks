'use client';

import { useState } from 'react';
// Unused imports commented out
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './LoginForm';
import { MagicLinkForm } from './MagicLinkForm';

export function SignInForm() {
  const [authMode, setAuthMode] = useState<'login' | 'magiclink'>('login');

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Auth mode toggle */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMode === 'login'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setAuthMode('magiclink')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            authMode === 'magiclink'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Magic Link
        </button>
      </div>

      {/* Render appropriate form */}
      {authMode === 'login' ? (
        <LoginForm onSwitchToMagicLink={() => setAuthMode('magiclink')} />
      ) : (
        <MagicLinkForm onSwitchToLogin={() => setAuthMode('login')} />
      )}
    </div>
  );
}