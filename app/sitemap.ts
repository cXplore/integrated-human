import { MetadataRoute } from 'next';
import { getAllPosts, getAllTags } from '@/lib/posts';

const SITE_URL = 'https://integrated-human.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();
  const tags = getAllTags();

  const postUrls = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.metadata.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const tagUrls = tags.map(({ tag }) => ({
    url: `${SITE_URL}/tags/${tag}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const staticPages = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${SITE_URL}/start-here`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/mind`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/body`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/soul`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/relationships`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/tags`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/learning-paths`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/community`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...staticPages, ...postUrls, ...tagUrls];
}
