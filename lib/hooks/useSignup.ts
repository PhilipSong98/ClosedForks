'use client';

import { useState } from 'react';
import { SignupFormData, AuthError } from '@/types';
import { signupSchema } from '@/lib/validations';

interface SignupResult {
  success: boolean;
  message: string;
  autoSignIn: boolean;
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export function useSignup() {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const signup = async (formData: SignupFormData): Promise<SignupResult | null> => {
    setIsLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validation = signupSchema.safeParse(formData);
      if (!validation.success) {
        const newErrors: Record<string, string> = {};
        validation.error.issues.forEach(error => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
        return null;
      }

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
        return null;
      }

      return result;
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ general: 'Something went wrong. Please try again.' });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrors = () => {
    setErrors({});
  };

  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return {
    signup,
    isLoading,
    errors,
    clearErrors,
    clearFieldError,
  };
}