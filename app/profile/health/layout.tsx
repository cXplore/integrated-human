import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integration Health - Integrated Human',
  description: 'Track your development across the four pillars of integrated living: Mind, Body, Soul, and Relationships.',
};

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
