import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';

export default function RestaurantNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-4">404</h1>
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Restaurant Not Found
          </h2>
          <p className="text-muted-foreground mb-8">
            The restaurant you're looking for doesn't exist or has been removed.
          </p>
          <div className="space-y-4">
            <Button asChild>
              <Link href="/restaurants" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Restaurants
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}