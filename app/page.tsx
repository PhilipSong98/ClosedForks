import { Metadata } from 'next';
import HomeClient from './home-client';

export const metadata: Metadata = {
  title: 'Home - DineCircle',
  description: 'Latest restaurant reviews from your dining circles',
};

export default function Home() {
  return <HomeClient />;
}
