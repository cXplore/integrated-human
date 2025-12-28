import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connect - Integrated Human',
  description: 'Get in touch with Integrated Human. Questions, feedback, or just want to say hello.',
};

export default function ConnectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
