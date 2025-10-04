'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';

export default function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signInWithPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[var(--background)] via-white to-slate-100">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--primary-rgb),0.22),transparent_70%)] blur-3xl" />
        <div className="absolute top-[20%] right-[-15%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--secondary-rgb),0.18),transparent_70%)] blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[25%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(148,163,184,0.22),transparent_70%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:gap-12 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
          {/* Mobile: Card comes first, Desktop: Text content first */}
          <div className="order-2 lg:order-1 space-y-6 lg:space-y-10">
            <Button
              variant="ghost"
              onClick={() => router.push('/welcome')}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.16)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--primary)] shadow-sm shadow-[rgba(var(--primary-rgb),0.15)] backdrop-blur transition hover:border-[rgba(var(--primary-rgb),0.3)] hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invite
            </Button>

            <div className="space-y-4 lg:space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--secondary-rgb),0.35)] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--secondary)]">
                Welcome Back
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                Slide back into your private dining circle
              </h1>
              <p className="max-w-xl text-sm text-slate-600 sm:text-base lg:text-lg">
                Access the latest recommendations and trusted reviews from the people whose taste you rely on most.
              </p>
            </div>

            <div className="hidden lg:grid gap-4 sm:grid-cols-2">
              {[
                'Stay current with your circle’s latest picks',
                'Save favorites and track places to try next',
                'Exclusive access with invite-only security',
                'Sync notes across every device instantly',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-3xl border border-[rgba(var(--primary-rgb),0.14)] bg-white/70 p-4 shadow-sm shadow-[rgba(var(--primary-rgb),0.12)] backdrop-blur"
                >
                  <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)]">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-slate-600">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="order-1 lg:order-2 relative overflow-hidden rounded-[28px] border border-white/70 bg-white text-slate-900 shadow-2xl shadow-[rgba(var(--primary-rgb),0.2)]">
            <CardContent className="relative space-y-8 p-8 sm:p-10">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-semibold text-slate-900">Sign in to your account</h2>
                <p className="text-sm text-slate-500">
                  Continue your culinary journey with DineCircle.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="rounded-2xl border border-[rgba(var(--secondary-rgb),0.28)] bg-[rgba(var(--secondary-rgb),0.12)] p-4 text-center">
                    <p className="text-sm text-[var(--secondary)]">{error}</p>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                    placeholder="Enter your email"
                    className="h-12 rounded-2xl border-2 border-slate-300 bg-slate-50 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.2)]"
                    disabled={isLoading}
                    required
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 rounded-2xl border-2 border-slate-300 bg-slate-50 pr-10 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.2)]"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[var(--primary)]"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.password}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition hover:bg-[rgba(var(--primary-rgb),0.9)] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      Sign In
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-sm text-slate-500">
                Forgot your password? Contact an admin for assistance.
              </div>

              <div className="text-center pt-2 text-sm text-slate-500">
                New to our platform?{' '}
                <button
                  onClick={() => router.push('/welcome')}
                  className="font-semibold text-[var(--primary)] underline-offset-4 transition hover:underline"
                >
                  Request an invite
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
