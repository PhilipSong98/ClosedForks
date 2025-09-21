'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[var(--background)] via-white to-[var(--accent)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-28 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(var(--primary-rgb),0.35),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-18%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--secondary-rgb),0.28),transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-22%] right-[-12%] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(var(--accent-rgb),0.28),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.52),transparent_72%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 sm:px-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-lg shadow-[rgba(var(--secondary-rgb),0.2)] backdrop-blur">
              <span className="text-xl font-semibold tracking-[0.12em] text-[var(--primary)]">DC</span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-500">DineCircle</p>
              <p className="text-lg font-semibold text-slate-700">Where your circle dines.</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/signin')}
            className="hidden items-center gap-2 rounded-full border border-[var(--muted)] bg-white/70 px-6 py-3 text-sm font-medium text-[var(--primary)] shadow-lg shadow-[rgba(var(--primary-rgb),0.2)] backdrop-blur transition hover:border-[rgba(var(--primary-rgb),0.45)] hover:bg-white sm:flex"
          >
            Already a member?
          </Button>
        </header>

        <main className="flex flex-1 items-center px-6 pb-12 pt-4 sm:px-12">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-14 lg:grid-cols-[1.05fr_minmax(0,0.95fr)]">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(var(--secondary-rgb),0.35)] bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--secondary)] shadow-sm">
                Invite Only
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                  Step into the Circle
                </h1>
                <p className="max-w-xl text-base text-slate-600 sm:text-lg">
                  Curated recommendations, hidden gems, and trusted reviews from the people whose taste you know best. Your invite code is the key to our private dining universe.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[var(--muted)] bg-white/75 p-6 shadow-lg shadow-[rgba(var(--primary-rgb),0.18)] backdrop-blur">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(var(--primary-rgb),0.12)] ring-1 ring-[rgba(var(--primary-rgb),0.2)]">
                    <span className="text-base font-semibold text-[var(--primary)]">01</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Secure Access</h3>
                  <p className="mt-2 text-sm text-slate-600">Membership is invitation-only to keep every insight authentic and personal.</p>
                </div>
                <div className="rounded-3xl border border-[rgba(var(--secondary-rgb),0.3)] bg-white/75 p-6 shadow-lg shadow-[rgba(var(--secondary-rgb),0.18)] backdrop-blur">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(var(--secondary-rgb),0.12)] ring-1 ring-[rgba(var(--secondary-rgb),0.22)]">
                    <span className="text-base font-semibold text-[var(--secondary)]">02</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Trusted Reviews</h3>
                  <p className="mt-2 text-sm text-slate-600">Every rating comes from friends, family, and tastemakers you rely on.</p>
                </div>
              </div>
            </div>

            <Card className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/80 text-slate-900 shadow-2xl shadow-[rgba(var(--secondary-rgb),0.18)] backdrop-blur-xl">
              <div className="pointer-events-none absolute -inset-x-10 -top-24 h-64 bg-[radial-gradient(circle,_rgba(var(--primary-rgb),0.4),transparent_65%)]" />
              <CardContent className="relative space-y-8 p-8 sm:p-10">
                <div className="space-y-3 text-center sm:text-left">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--muted)] bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
                    Access Granted
                  </span>
                  <h2 className="text-3xl font-semibold text-slate-900">Enter your invite code</h2>
                  <p className="text-sm text-slate-600 sm:text-base">
                    Validate your invite to continue the journey. You&apos;ll go straight to signup once we confirm your code.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-center text-sm font-medium text-slate-600 sm:text-left">
                      Six digits, your passport in.
                    </label>
                    <div className="flex justify-center sm:justify-start">
                      <div className="flex gap-3">
                        {[0, 1, 2, 3, 4, 5].map((index) => (
                          <div key={index} className="relative">
                            <Input
                              type="text"
                              value={code[index] || ''}
                              onChange={(e) => {
                                const newCode = code.split('');
                                newCode[index] = e.target.value.slice(-1);
                                handleCodeChange(newCode.join(''));

                                if (e.target.value && index < 5) {
                                  const nextInput = e.target.parentElement?.parentElement?.children[index + 1]?.querySelector('input');
                                  nextInput?.focus();
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !code[index] && index > 0) {
                                  const prevInput = (e.target as HTMLElement).parentElement?.parentElement?.children[index - 1]?.querySelector('input');
                                  prevInput?.focus();
                                }
                              }}
                              className="h-14 w-12 rounded-2xl border-[var(--muted)] bg-white/80 text-center text-xl font-semibold tracking-widest text-slate-900 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-[rgba(var(--primary-rgb),0.35)] sm:h-16 sm:w-14"
                              maxLength={1}
                              autoComplete="off"
                              disabled={isValidating}
                            />
                            {index === 2 && <div className="absolute -right-2 top-1/2 h-6 w-px -translate-y-1/2 bg-[rgba(var(--primary-rgb),0.3)]" />}
                          </div>
                        ))}
                      </div>
                    </div>
                    {error && (
                      <p className="text-center text-sm text-[var(--secondary)] animate-in fade-in duration-300">
                        {error}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={code.length !== 6 || isValidating}
                    className="group flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-4 text-base font-semibold text-white shadow-lg shadow-[rgba(var(--primary-rgb),0.25)] transition hover:bg-[rgba(var(--primary-rgb),0.9)] disabled:opacity-60"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        Continue
                        <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </Button>
                </form>

                <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-white/70 p-5 text-sm text-slate-600">
                  <p>
                    Don&apos;t have a code? <span className="text-slate-900">Reach out to a friend or family member already inside.</span>
                  </p>
                  <div className="border-t border-[var(--border)] pt-4 text-center sm:text-left">
                    <p className="mb-3 text-xs uppercase tracking-[0.3em] text-slate-400">Already a member?</p>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/signin')}
                      className="w-full rounded-full border-[var(--muted)] bg-white/60 text-[var(--primary)] hover:border-[rgba(var(--primary-rgb),0.45)] hover:bg-white"
                    >
                      Sign in here
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <footer className="px-6 pb-10 text-center text-xs text-slate-500 sm:px-12">
          By continuing, you agree to our terms of service and privacy policy.
        </footer>
      </div>
    </div>
  );
}
