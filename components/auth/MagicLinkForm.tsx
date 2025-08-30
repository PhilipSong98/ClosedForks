'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface MagicLinkFormProps {
  onSwitchToLogin?: () => void;
}

export function MagicLinkForm({ onSwitchToLogin }: MagicLinkFormProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ 
    type: 'success' | 'error' | 'pending' | 'info'; 
    text: string;
    isAdmin?: boolean;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.hasPassword) {
          setMessage({
            type: 'info',
            text: 'You already have a password set. Please use the Sign In tab instead.'
          });
        } else if (data.duplicate) {
          setMessage({
            type: 'error',
            text: 'You have already requested access today. Please wait for admin approval.'
          });
        } else {
          throw new Error(data.error || 'Failed to request magic link');
        }
        return;
      }

      if (data.isAdmin) {
        setMessage({
          type: 'success',
          text: 'Admin magic link sent! Check your email.',
          isAdmin: true
        });
      } else {
        setMessage({
          type: 'pending',
          text: 'Your request has been submitted and is pending admin approval. You will receive a magic link once approved.'
        });
      }

      setEmail('');

    } catch (error) {
      console.error('Magic link request error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to request magic link'
      });
    }

    setIsLoading(false);
  };

  const getMessageIcon = () => {
    switch (message?.type) {
      case 'success':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'pending':
        return <Clock size={16} className="text-blue-600" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-600" />;
      case 'info':
        return <AlertCircle size={16} className="text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Request Access</CardTitle>
        <CardDescription>
          Enter your email to request a magic sign-in link
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          {message && (
            <div className={`text-sm p-3 rounded-md border ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border-green-200' 
                : message.type === 'pending'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : message.type === 'info'
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <div className="flex items-start space-x-2">
                {getMessageIcon()}
                <div className="flex-1">
                  <p>{message.text}</p>
                  {message.type === 'pending' && (
                    <p className="mt-1 text-xs text-blue-600">
                      This helps maintain the private nature of our community.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || !email.trim()}
          >
            {isLoading ? 'Requesting...' : 'Request Magic Link'}
          </Button>

          {onSwitchToLogin && (
            <div className="text-center text-sm text-gray-600">
              <span>Already have a password? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="hover:text-gray-900 underline font-medium"
              >
                Sign In
              </button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}