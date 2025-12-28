import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop - Integrated Human',
  description: 'Recommended books and products for your personal growth journey. Curated resources on psychology, embodiment, and meaning.',
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
