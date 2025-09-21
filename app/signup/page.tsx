'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';
import { signupSchema } from '@/lib/validations';
import { InviteCodeSession, SignupFormData } from '@/types';

export default function SignupPage() {
  const [formData, setFormData] = useState<SignupFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    inviteCode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [inviteSession, setInviteSession] = useState<InviteCodeSession | null>(null);
  const router = useRouter();

  // Check for valid invite code session on page load
  useEffect(() => {
    const sessionData = sessionStorage.getItem('inviteCodeSession');
    if (!sessionData) {
      router.push('/welcome');
      return;
    }

    try {
      const session = JSON.parse(sessionData) as InviteCodeSession;
      setInviteSession(session);
      setFormData(prev => ({ ...prev, inviteCode: session.code }));
    } catch (error) {
      console.error('Invalid session data:', error);
      router.push('/welcome');
    }
  }, [router]);

  const handleInputChange = (field: keyof SignupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
    };

    Object.values(checks).forEach(check => check && score++);

    return {
      score,
      checks,
      strength: score < 2 ? 'weak' : score < 4 ? 'medium' : 'strong'
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = signupSchema.safeParse(formData);
    if (!validation.success) {
      const newErrors: Record<string, string> = {};
      validation.error.issues.forEach(error => {
        if (error.path[0]) {
          newErrors[error.path[0] as string] = error.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.field) {
          setErrors({ [result.field]: result.error });
        } else {
          setErrors({ general: result.error });
        }
        return;
      }

      // Clear session data
      sessionStorage.removeItem('inviteCodeSession');

      // Show success and redirect
      if (result.autoSignIn) {
        router.push('/');
      } else {
        // If auto sign-in failed, redirect to sign-in page
        router.push('/signin?message=Account created successfully. Please sign in.');
      }

    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    sessionStorage.removeItem('inviteCodeSession');
    router.push('/welcome');
  };

  if (!inviteSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[var(--background)] via-white to-[var(--accent)]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-36 right-[-12%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--primary-rgb),0.22),transparent_70%)] blur-[150px]" />
        <div className="absolute bottom-[-18%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--accent-rgb),0.26),transparent_70%)] blur-3xl" />
        <div className="absolute top-[35%] left-[35%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--secondary-rgb),0.22),transparent_70%)] blur-[160px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-12 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
          <div className="space-y-8">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--secondary-rgb),0.2)] bg-white/70 px-4 py-2 text-sm font-medium text-[var(--secondary)] shadow-sm shadow-[rgba(var(--secondary-rgb),0.18)] backdrop-blur transition hover:border-[rgba(var(--secondary-rgb),0.35)] hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to invite verification
            </Button>

            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.3)] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--primary)]">
                Invite Accepted
              </span>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Create your DineCircle identity
              </h1>
              <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                You&apos;re moments away from unlocking trusted restaurant intel curated by the people who matter most. Set up your account to start sharing and discovering instantly.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                'Curated insights from your personal network',
                'Save dining lists and keep track of invites',
                'Share thoughtful reviews with rich context',
                'Cross-device sync keeps every plan aligned',
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-3xl border border-[rgba(var(--secondary-rgb),0.22)] bg-white/70 p-4 shadow-sm shadow-[rgba(var(--secondary-rgb),0.16)] backdrop-blur"
                >
                  <span className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(var(--secondary-rgb),0.16)] text-[var(--secondary)]">
                    <Check className="h-4 w-4" />
                  </span>
                  <p className="text-sm text-slate-600">{item}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-[rgba(var(--accent-rgb),0.35)] bg-white/70 p-6 shadow-lg shadow-[rgba(var(--accent-rgb),0.2)] backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-900">Invite details</h3>
              <p className="mt-2 text-sm text-slate-600">Invite code verified at {new Date(inviteSession.validatedAt).toLocaleDateString()}</p>
              <p className="text-sm text-slate-500">Code reference: {inviteSession.codeId}</p>
            </div>
          </div>

          <Card className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 text-slate-900 shadow-2xl shadow-[rgba(var(--secondary-rgb),0.2)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -inset-x-12 -top-20 h-64 bg-[radial-gradient(circle,_rgba(var(--primary-rgb),0.28),transparent_65%)]" />
            <CardContent className="relative space-y-8 p-8 sm:p-10">
              <div className="space-y-2 text-center">
                <h2 className="text-3xl font-semibold text-slate-900">Create your account</h2>
                <p className="text-sm text-slate-500">
                  Finalize your credentials to join the conversation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.general && (
                  <div className="rounded-2xl border border-[rgba(var(--secondary-rgb),0.28)] bg-[rgba(var(--secondary-rgb),0.12)] p-4 text-center">
                    <p className="text-sm text-[var(--secondary)]">{errors.general}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="h-12 rounded-2xl border-[var(--muted)] bg-white/80 text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[rgba(var(--primary-rgb),0.35)]"
                    disabled={isLoading}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-[var(--secondary)]">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value.toLowerCase())}
                    placeholder="Enter your email"
                    className="h-12 rounded-2xl border-[var(--muted)] bg-white/80 text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[rgba(var(--primary-rgb),0.35)]"
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-sm text-[var(--secondary)]">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Create a strong password"
                        className="h-12 rounded-2xl border-[var(--muted)] bg-white/80 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[rgba(var(--primary-rgb),0.35)]"
                        disabled={isLoading}
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

                  {formData.password && (
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              i <= passwordStrength.score
                                ? passwordStrength.strength === 'weak'
                                  ? 'bg-[var(--secondary)]/60'
                                  : passwordStrength.strength === 'medium'
                                  ? 'bg-amber-300'
                                  : 'bg-emerald-400'
                                : 'bg-[var(--muted)]'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="space-y-1 text-xs">
                        {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                          <div
                            key={key}
                            className={`flex items-center space-x-1 ${passed ? 'text-emerald-500' : 'text-slate-400'}`}
                          >
                            {passed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            <span>
                              {key === 'length' && '8+ characters'}
                              {key === 'lowercase' && 'Lowercase letter'}
                              {key === 'uppercase' && 'Uppercase letter'}
                              {key === 'number' && 'Number'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {errors.password && (
                    <p className="text-sm text-[var(--secondary)]">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirm your password"
                      className="h-12 rounded-2xl border-[var(--muted)] bg-white/80 pr-10 text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[rgba(var(--primary-rgb),0.35)]"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[var(--primary)]"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-[var(--secondary)]">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteCode" className="text-sm font-medium text-slate-700">Invite Code</Label>
                  <Input
                    id="inviteCode"
                    type="text"
                    value={formData.inviteCode}
                    readOnly
                    className="h-12 rounded-2xl border-[rgba(var(--accent-rgb),0.55)] bg-[rgba(var(--accent-rgb),0.25)] font-mono text-center text-[var(--foreground)] tracking-[0.55em] text-sm uppercase cursor-not-allowed"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || passwordStrength.score < 3}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-base font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition hover:bg-[rgba(var(--primary-rgb),0.9)] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </Button>
              </form>

              <div className="border-t border-[var(--border)] pt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/signin')}
                  className="font-semibold text-[var(--primary)] underline-offset-4 transition hover:underline"
                >
                  Sign in here
                </button>
              </div>

              <div className="text-center text-xs text-slate-400">
                By creating an account, you agree to our{' '}
                <span className="cursor-pointer text-slate-600 underline-offset-4 hover:underline">terms of service</span>
                {' '}and{' '}
                <span className="cursor-pointer text-slate-600 underline-offset-4 hover:underline">privacy policy</span>.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
