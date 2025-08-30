'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');

  const getErrorMessage = () => {
    switch (error) {
      case 'no_code':
        return 'No authentication code was provided in the link.';
      case 'exchange_failed':
        return `Failed to authenticate: ${message || 'Unknown error'}`;
      case 'no_session':
        return 'Authentication succeeded but no session was created.';
      case 'unexpected':
        return `Unexpected error: ${message || 'Please try again'}`;
      default:
        return 'We couldn\'t sign you in with that link.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-600">
            Authentication Error
          </CardTitle>
          <CardDescription>
            Sorry, we couldn't sign you in with that link.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              {getErrorMessage()}
            </p>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>This could happen if:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>The link has expired</li>
              <li>The link has already been used</li>
              <li>There's a configuration issue</li>
            </ul>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 font-mono">
                Debug info: {error && `Error: ${error}`} {message && `Message: ${message}`}
              </p>
            </div>
          )}
          
          <Button asChild className="w-full">
            <Link href="/">
              Try Again
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}