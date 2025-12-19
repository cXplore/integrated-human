import type { Metadata } from 'next';
import GuideChat from '../components/GuideChat';

export const metadata: Metadata = {
  title: 'AI Guide | Integrated Human',
  description: 'A wise companion for your journey of integration. Explore archetypes, shadow work, and personal growth with an AI guide grounded in presence.',
  openGraph: {
    title: 'AI Guide | Integrated Human',
    description: 'A wise companion for your journey of integration.',
    type: 'website',
  },
};

export default function GuidePage() {
  return (
    <main className="min-h-screen bg-black">
      <GuideChat />
    </main>
  );
}
