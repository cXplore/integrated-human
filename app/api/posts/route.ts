import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts, getPostBySlug } from '@/lib/posts';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const slugsParam = searchParams.get('slugs');

  // If specific slugs requested, return those
  if (slugsParam) {
    const slugs = slugsParam.split(',').filter(Boolean);
    const posts = slugs
      .map((slug) => {
        const post = getPostBySlug(slug);
        if (!post) return null;
        return {
          slug: post.slug,
          title: post.metadata.title,
          excerpt: post.metadata.excerpt,
          categories: post.metadata.categories,
          readingTime: post.readingTime,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ posts });
  }

  // Return all posts with basic metadata
  const allPosts = getAllPosts();
  const posts = allPosts.map((post) => ({
    slug: post.slug,
    title: post.metadata.title,
    excerpt: post.metadata.excerpt,
    categories: post.metadata.categories,
    readingTime: post.readingTime,
  }));

  return NextResponse.json(posts);
}
