import { Metadata } from 'next';

export const siteMetadata = {
  title: 'Integrated Human',
  description: 'Live stronger, feel deeper, become whole. Mind, body, soul and relationships — integrated.',
  url: 'https://integrated-human.vercel.app',
  siteName: 'Integrated Human',
  locale: 'en_US',
  type: 'website',
};

export function generateMetadata(
  title?: string,
  description?: string,
  path?: string
): Metadata {
  const pageTitle = title ? `${title} | ${siteMetadata.title}` : siteMetadata.title;
  const pageDescription = description || siteMetadata.description;
  const url = path ? `${siteMetadata.url}${path}` : siteMetadata.url;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url,
      siteName: siteMetadata.siteName,
      locale: siteMetadata.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
    },
  };
}
