import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Insights - Integrated Human',
  description: 'View what the AI has learned about you through your conversations. Manage triggers, preferences, and deeper patterns.',
};

export default function AIInsightsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
