import { Metadata } from 'next';
import PublicProfileClient from './public-profile-client';

export const metadata: Metadata = {
  title: 'User Profile - DineCircle',
  description: 'View user reviews and favorites.',
};

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicProfileClient userId={id} />;
}
