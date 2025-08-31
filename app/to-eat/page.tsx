import { Metadata } from 'next';
import ToEatPageClient from './to-eat-client';

export const metadata: Metadata = {
  title: 'To-Eat List | DineCircle',
  description: 'Your personal list of restaurants you want to try',
};

export default function ToEatPage() {
  return <ToEatPageClient />;
}