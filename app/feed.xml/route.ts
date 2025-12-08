import { getAllPosts } from '@/lib/posts';

const SITE_URL = 'https://integrated-human.vercel.app';

export async function GET() {
  const posts = getAllPosts();

  const itemsXml = posts
    .slice(0, 20)
    .map(
      (post) => `
    <item>
      <title><![CDATA[${post.metadata.title}]]></title>
      <link>${SITE_URL}/posts/${post.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/posts/${post.slug}</guid>
      <description><![CDATA[${post.metadata.excerpt}]]></description>
      <pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
      ${post.metadata.categories.map((cat) => `<category>${cat}</category>`).join('\n      ')}
    </item>`
    )
    .join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Integrated Human</title>
    <link>${SITE_URL}</link>
    <description>Live stronger, feel deeper, become whole. Mind, body, soul and relationships — integrated.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    ${itemsXml}
  </channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
