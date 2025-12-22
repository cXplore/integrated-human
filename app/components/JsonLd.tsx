interface ArticleJsonLdProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
  tags?: string[];
}

export function ArticleJsonLd({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'Integrated Human',
  image,
  tags = [],
}: ArticleJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: 'https://integrated-human.vercel.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Integrated Human',
      url: 'https://integrated-human.vercel.app',
    },
    ...(image && {
      image: {
        '@type': 'ImageObject',
        url: image,
      },
    }),
    ...(tags.length > 0 && { keywords: tags.join(', ') }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface CourseJsonLdProps {
  title: string;
  description: string;
  url: string;
  provider?: string;
  level: string;
  duration: string;
  modules: number;
  isFree?: boolean;
}

export function CourseJsonLd({
  title,
  description,
  url,
  provider = 'Integrated Human',
  level,
  duration,
  modules,
  isFree = false,
}: CourseJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: title,
    description,
    url,
    provider: {
      '@type': 'Organization',
      name: provider,
      url: 'https://integrated-human.vercel.app',
    },
    educationalLevel: level,
    timeRequired: duration,
    numberOfCredits: modules,
    isAccessibleForFree: isFree,
    offers: isFree
      ? {
          '@type': 'Offer',
          price: 0,
          priceCurrency: 'USD',
        }
      : {
          '@type': 'Offer',
          price: 19,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          description: 'Included with membership',
        },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Integrated Human',
    url: 'https://integrated-human.vercel.app',
    description: 'Live stronger, feel deeper, become whole. Mind, body, soul and relationships — integrated.',
    sameAs: [],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
