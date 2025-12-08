import { NextRequest, NextResponse } from 'next/server';
import { searchPosts } from '@/lib/posts';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';

  if (query.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const posts = searchPosts(query);

  const results = posts.slice(0, 10).map((post) => ({
    slug: post.slug,
    title: post.metadata.title,
    excerpt: post.metadata.excerpt,
    categories: post.metadata.categories,
    readingTime: post.readingTime,
  }));

  return NextResponse.json({ results });
}
