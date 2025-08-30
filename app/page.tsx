import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PenSquare } from 'lucide-react';

export default function Home() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Restaurant Network
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Discover great restaurants through trusted recommendations from your friends and family.
          </p>
          <Link href="/reviews/new">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              <PenSquare className="h-4 w-4 mr-2" />
              Write Your First Review
            </Button>
          </Link>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">🍽️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Browse Restaurants</h3>
          <p className="text-gray-600 text-sm">
            Explore restaurants reviewed by your trusted network
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">⭐</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Share Reviews</h3>
          <p className="text-gray-600 text-sm">
            Write detailed reviews with photos and ratings
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Invite Friends</h3>
          <p className="text-gray-600 text-sm">
            Grow your network by inviting trusted friends and family
          </p>
        </div>
      </div>

      <div className="mt-12 bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity to display.</p>
          <p className="text-sm mt-2">Start by adding your first restaurant review!</p>
        </div>
      </div>
    </div>
    
    {/* Floating Action Button */}
    <Link href="/reviews/new">
      <Button
        size="lg"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 p-0 z-40"
      >
        <PenSquare className="h-6 w-6" />
        <span className="sr-only">Write a review</span>
      </Button>
    </Link>
  </>
  );
}
