'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { LoginCredentials } from '@/types/auth';
import { supabase } from '@/lib/supabase/client';

interface LoginFormProps {
  onSwitchToMagicLink?: () => void;
}

export function LoginForm({ onSwitchToMagicLink }: LoginFormProps) {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Use client-side authentication for proper session handling
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        console.error('Login error:', authError);
        
        // Handle specific error cases
        if (authError.message.includes('Invalid login credentials')) {
          setMessage({
            type: 'error',
            text: 'Invalid email or password'
          });
        } else if (authError.message.includes('Email not confirmed')) {
          setMessage({
            type: 'error',
            text: 'Please check your email and click the confirmation link'
          });
        } else {
          setMessage({
            type: 'error',
            text: authError.message || 'Login failed. Please try again.'
          });
        }
        return;
      }

      if (!authData.user) {
        setMessage({
          type: 'error',
          text: 'Login failed'
        });
        return;
      }

      setMessage({
        type: 'success',
        text: 'Login successful! Redirecting...'
      });

      // Check if user needs password setup by querying their profile
      const { data: profile } = await supabase
        .from('users')
        .select('password_set, first_login_completed')
        .eq('id', authData.user.id)
        .single();

      // Small delay to show the success message
      setTimeout(() => {
        if (!profile?.password_set || !profile?.first_login_completed) {
          router.push('/auth/set-password');
        } else {
          router.push('/');
        }
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to login'
      });
    }

    setIsLoading(false);
  };

  const handleForgotPassword = () => {
    setMessage({
      type: 'info',
      text: 'Please contact the administrator to reset your password or use the magic link option.'
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
        <CardDescription>
          Sign in to your account with email and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          
          {message && (
            <div className={`text-sm p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="space-y-2 text-center text-sm text-gray-600">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="hover:text-gray-900 underline"
            >
              Forgot your password?
            </button>
            
            {onSwitchToMagicLink && (
              <div>
                <span>Need a magic link instead? </span>
                <button
                  type="button"
                  onClick={onSwitchToMagicLink}
                  className="hover:text-gray-900 underline font-medium"
                >
                  Request Magic Link
                </button>
              </div>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}