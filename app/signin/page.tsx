'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, ArrowLeft, Shield, Mail, Users } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authMode, setAuthMode] = useState<'password' | 'magiclink'>('password');
  
  const { signInWithPassword, signInWithEmail } = useAuth();
  const router = useRouter();

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await signInWithPassword(formData.email, formData.password);
      
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error } = await signInWithEmail(formData.email);
      
      if (error) {
        setError(error.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="h-8 w-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 mb-6">
                We've sent a magic link to <strong className="text-gray-900">{formData.email}</strong>. 
                Click the link in your email to sign in.
              </p>
              <Button
                variant="outline"
                onClick={() => setMagicLinkSent(false)}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/welcome')}
            className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Logo */}
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500">
            Sign in to your DineCircle account
          </p>
        </div>

        {/* Sign In Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setAuthMode('password')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  authMode === 'password'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Password
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
          </CardHeader>
          <CardContent className="pt-0 pb-6 px-6">
            <form onSubmit={authMode === 'password' ? handlePasswordSignIn : handleMagicLinkSignIn} className="space-y-5">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                  placeholder="Enter your email"
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900"
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Password - Only show for password mode */}
              {authMode === 'password' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900 pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !formData.email || (authMode === 'password' && !formData.password)}
                className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium shadow-sm transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    {authMode === 'password' ? 'Signing In...' : 'Sending Magic Link...'}
                  </>
                ) : (
                  authMode === 'password' ? 'Sign In' : 'Send Magic Link'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="text-center mt-5">
              <p className="text-gray-500 text-sm">
                {authMode === 'password' ? (
                  <>Forgot your password? Try the <button onClick={() => setAuthMode('magiclink')} className="text-gray-700 hover:underline font-medium">Magic Link</button> option</>
                ) : (
                  <>We'll send you a secure link to sign in without a password</>
                )}
              </p>
            </div>

            {/* Back to Welcome */}
            <div className="text-center mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                New to our platform?{' '}
                <button
                  onClick={() => router.push('/welcome')}
                  className="text-gray-700 hover:underline font-medium"
                >
                  Get an invite code
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}