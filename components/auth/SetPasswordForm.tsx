'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { SetPasswordRequest } from '@/types/auth';

interface PasswordRequirement {
  label: string;
  check: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', check: (pwd) => pwd.length >= 8 },
  { label: 'One uppercase letter', check: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'One lowercase letter', check: (pwd) => /[a-z]/.test(pwd) },
  { label: 'One number', check: (pwd) => /[0-9]/.test(pwd) }
];

export function SetPasswordForm() {
  const [formData, setFormData] = useState<SetPasswordRequest>({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password || !formData.confirmPassword) return;

    if (formData.password !== formData.confirmPassword) {
      setMessage({
        type: 'error',
        text: "Passwords don't match"
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set password');
      }

      setMessage({
        type: 'success',
        text: 'Password set successfully! Redirecting...'
      });

      // Redirect to home page after successful password setup
      setTimeout(() => {
        router.push('/');
      }, 1500);

    } catch (error) {
      console.error('Set password error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to set password'
      });
    }

    setIsLoading(false);
  };

  const isPasswordValid = passwordRequirements.every(req => req.check(formData.password));
  const canSubmit = isPasswordValid && formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Set Your Password</CardTitle>
        <CardDescription>
          Complete your account setup by creating a secure password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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
            
            {/* Password requirements */}
            {formData.password && (
              <div className="space-y-1 mt-2">
                {passwordRequirements.map((req, index) => {
                  const isValid = req.check(formData.password);
                  return (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      {isValid ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <X size={14} className="text-red-500" />
                      )}
                      <span className={isValid ? 'text-green-600' : 'text-gray-500'}>
                        {req.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            {/* Password match indicator */}
            {formData.confirmPassword && (
              <div className="flex items-center space-x-2 text-sm">
                {formData.password === formData.confirmPassword ? (
                  <>
                    <Check size={14} className="text-green-600" />
                    <span className="text-green-600">Passwords match</span>
                  </>
                ) : (
                  <>
                    <X size={14} className="text-red-500" />
                    <span className="text-red-500">Passwords don&apos;t match</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          {message && (
            <div className={`text-sm p-3 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !canSubmit}
          >
            {isLoading ? 'Setting Password...' : 'Set Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}