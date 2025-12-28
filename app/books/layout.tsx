import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Books Worth Reading - Integrated Human',
  description: 'Curated reading list on psychology, shadow work, meditation, trauma, relationships, and personal growth. The books that shaped us.',
  openGraph: {
    title: 'Books Worth Reading - Integrated Human',
    description: 'Curated reading list on psychology, shadow work, meditation, and personal growth.',
    type: 'website',
  },
};

export default function BooksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
