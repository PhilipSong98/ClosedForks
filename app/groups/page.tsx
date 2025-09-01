import { Metadata } from 'next';
import GroupsClient from './groups-client';

export const metadata: Metadata = {
  title: 'Groups - DineCircle',
  description: 'Manage your dining groups and see who\'s in your circle',
};

export default function GroupsPage() {
  return <GroupsClient />;
}