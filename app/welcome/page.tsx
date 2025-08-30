'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Shield, Users, Star } from 'lucide-react';
import { inviteCodeValidationSchema } from '@/lib/validations';

export default function WelcomePage() {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCodeChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericValue);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code format
    const validation = inviteCodeValidationSchema.safeParse({ code });
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || 'Please enter a valid 6-digit code');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await fetch('/api/auth/validate-invite-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const result = await response.json();

      if (result.valid) {
        // Store validation data in sessionStorage for signup process
        sessionStorage.setItem('inviteCodeSession', JSON.stringify(result.sessionData));
        router.push('/signup');
      } else {
        setError(result.message || 'Invalid invite code');
      }
    } catch (error) {
      console.error('Error validating invite code:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              DineCircle
            </h1>
            <p className="text-gray-500 text-lg font-medium">
              Where Your Circle Dines
            </p>
          </div>

          <div className="text-center mb-8">
            <p className="text-gray-600">
              Exclusive restaurant reviews from your trusted circle
            </p>
          </div>
        </div>

        {/* Main Invite Code Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-700" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Enter Your Invite Code
              </h2>
              <p className="text-gray-500">
                You need an invite from an existing member to join
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-center space-x-3">
                  {/* Individual digit inputs for better UX */}
                  <div className="grid grid-cols-6 gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <div key={index} className="relative">
                        <Input
                          type="text"
                          value={code[index] || ''}
                          onChange={(e) => {
                            const newCode = code.split('');
                            newCode[index] = e.target.value.slice(-1);
                            handleCodeChange(newCode.join(''));
                            
                            // Auto-focus next input
                            if (e.target.value && index < 5) {
                              const nextInput = e.target.parentElement?.parentElement?.children[index + 1]?.querySelector('input');
                              nextInput?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            // Auto-focus previous input on backspace
                            if (e.key === 'Backspace' && !code[index] && index > 0) {
                              const prevInput = (e.target as HTMLElement).parentElement?.parentElement?.children[index - 1]?.querySelector('input');
                              prevInput?.focus();
                            }
                          }}
                          className="w-12 h-14 text-center text-xl font-mono border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-gray-50"
                          maxLength={1}
                          autoComplete="off"
                          disabled={isValidating}
                        />
                        {index === 2 && <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-2 h-[2px] bg-gray-300"></div>}
                      </div>
                    ))}
                  </div>
                </div>
                {error && (
                  <p className="text-red-500 text-sm text-center animate-in fade-in duration-300">
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={code.length !== 6 || isValidating}
                className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium shadow-sm transition-all duration-300"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Continue
                    <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bottom Section */}
        <div className="mt-8">
          {/* Feature highlight */}
          <div className="text-center bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="h-6 w-6 text-gray-700" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Trusted Reviews</h3>
            <p className="text-gray-500 text-sm">Only from people you know</p>
          </div>

          {/* Sign In Link */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-gray-500 text-sm">
              Don&apos;t have a code?{' '}
              <span className="text-gray-700 font-medium">Ask a friend or family member</span>
            </p>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-gray-500 text-sm mb-3">Already a member?</p>
              <Button
                variant="outline"
                onClick={() => router.push('/signin')}
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
              >
                Sign in here
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-400 text-xs">
              By continuing, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}