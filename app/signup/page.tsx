'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, EyeOff, Check, X, ArrowLeft, Users } from 'lucide-react';
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
        <Loader2 className="h-8 w-8 animate-spin text-gray-900" />
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
            onClick={handleGoBack}
            className="absolute left-4 top-4 text-gray-500 hover:text-gray-700 p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* Logo */}
          <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your Account
          </h1>
          <p className="text-gray-500">
            Join DineCircle and share dining experiences
          </p>
        </div>

        {/* Signup Card */}
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-gray-900 text-xl">
              Welcome! Let&apos;s get you started
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-gray-900 font-medium">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900"
                  disabled={isLoading}
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm">{errors.fullName}</p>
                )}
              </div>

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
                />
                {errors.email && (
                  <p className="text-red-600 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-900 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Create a strong password"
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength.score 
                              ? passwordStrength.strength === 'weak' 
                                ? 'bg-red-400' 
                                : passwordStrength.strength === 'medium'
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-xs space-y-1">
                      {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                        <div key={key} className={`flex items-center space-x-1 ${passed ? 'text-green-600' : 'text-gray-500'}`}>
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
                  <p className="text-red-600 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-900 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm your password"
                    className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:ring-gray-900 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Invite Code (Read-only) */}
              <div className="space-y-2">
                <Label htmlFor="inviteCode" className="text-gray-900 font-medium">Invite Code</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  value={formData.inviteCode}
                  readOnly
                  className="bg-green-50 border-green-300 text-green-700 font-mono text-center tracking-widest cursor-not-allowed"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || passwordStrength.score < 3}
                className="w-full h-12 bg-gray-800 hover:bg-gray-900 text-white font-medium shadow-sm transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Already have account */}
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => router.push('/signin')}
                  className="text-gray-700 hover:underline font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>

            {/* Terms */}
            <div className="text-center mt-4">
              <p className="text-gray-400 text-xs">
                By creating an account, you agree to our{' '}
                <span className="text-gray-700 cursor-pointer hover:underline">terms of service</span>
                {' '}and{' '}
                <span className="text-gray-700 cursor-pointer hover:underline">privacy policy</span>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}