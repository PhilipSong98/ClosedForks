import { Metadata } from 'next';
import ProfileClient from './profile-client';

export const metadata: Metadata = {
  title: 'Profile - DineCircle',
  description: 'Manage your profile, view your reviews, and organize your favorite restaurants.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}