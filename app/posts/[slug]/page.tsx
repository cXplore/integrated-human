import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Navigation from '@/app/components/Navigation';
import ReadingProgress from '@/app/components/ReadingProgress';
import ArticleActions from '@/app/components/ArticleActions';
import TableOfContents from '@/app/components/TableOfContents';
import BackToTop from '@/app/components/BackToTop';
import SeriesProgress from '@/app/components/SeriesProgress';
import KeyboardNav from '@/app/components/KeyboardNav';
import Comments from '@/app/components/Comments';
import ReadTracker from '@/app/components/ReadTracker';
import { getAllPosts, getPostBySlug, getRelatedPosts, getSeriesNavigation, getSeriesPostsMinimal } from '@/lib/posts';
import { getRelatedCourses } from '@/lib/courses';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeSlug from 'rehype-slug';
import ArticleImage from '@/app/components/ArticleImage';
import YouTube from '@/app/components/YouTube';
import Image from 'next/image';
import { ArticleJsonLd, BreadcrumbJsonLd } from '@/app/components/JsonLd';
import PageContextSetter from '@/app/components/PageContextSetter';
import FeaturedImage from '@/app/components/FeaturedImage';

const BASE_URL = 'https://integrated-human.vercel.app';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Article Not Found',
    };
  }

  const { title, excerpt, categories, date, image } = post.metadata;
  const ogImage = image ? `${BASE_URL}${image}` : undefined;

  return {
    title: `${title} | Integrated Human`,
    description: excerpt,
    keywords: [...categories, ...post.metadata.tags],
    authors: [{ name: 'Integrated Human' }],
    openGraph: {
      title,
      description: excerpt,
      url: `${BASE_URL}/posts/${slug}`,
      siteName: 'Integrated Human',
      locale: 'en_US',
      type: 'article',
      publishedTime: date,
      authors: ['Integrated Human'],
      tags: categories,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: excerpt,
      ...(ogImage && { images: [ogImage] }),
    },
    alternates: {
      canonical: `${BASE_URL}/posts/${slug}`,
    },
  };
}

const seriesNames: Record<string, string> = {
  'physical-foundation': 'Physical Foundation',
  'inner-work': 'Inner Work',
  'soul-foundations': 'Soul Foundations',
  'relationship-foundations': 'Relationship Foundations',
  'from-seeking-to-being': 'From Seeking to Being',
};

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relatedPosts = getRelatedPosts(slug, 3);
  const relatedCourses = getRelatedCourses(post.metadata.categories, post.metadata.tags, 2);
  const seriesNav = getSeriesNavigation(slug);
  const seriesPosts = post.metadata.series ? getSeriesPostsMinimal(post.metadata.series) : [];

  return (
    <>
      <PageContextSetter type="article" title={post.metadata.title} slug={slug} content={post.content} />
      <ArticleJsonLd
        title={post.metadata.title}
        description={post.metadata.excerpt}
        url={`${BASE_URL}/posts/${slug}`}
        datePublished={post.metadata.date}
        image={post.metadata.image ? `${BASE_URL}${post.metadata.image}` : undefined}
        tags={post.metadata.tags}
      />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: BASE_URL },
          { name: post.metadata.categories[0], url: `${BASE_URL}/${post.metadata.categories[0].toLowerCase()}` },
          { name: post.metadata.title, url: `${BASE_URL}/posts/${slug}` },
        ]}
      />
      <ReadingProgress />
      <ReadTracker slug={slug} />
      <Navigation />
      <main className="min-h-screen bg-zinc-950">
        <article className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid xl:grid-cols-[1fr_250px] gap-12">
              <div className="max-w-3xl">
            {/* Series Progress */}
            {post.metadata.series && seriesPosts.length > 1 && (
              <SeriesProgress
                seriesId={post.metadata.series}
                seriesName={seriesNames[post.metadata.series] || post.metadata.series}
                posts={seriesPosts}
                currentSlug={slug}
              />
            )}

            <div className="flex flex-wrap gap-3 mb-6">
              {post.metadata.categories.map((category) => (
                <Link
                  key={category}
                  href={`/${category.toLowerCase()}`}
                  className="text-sm uppercase tracking-wide text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {category}
                </Link>
              ))}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
              {post.metadata.title}
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              {post.metadata.excerpt}
            </p>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-gray-500 text-sm sm:text-base">
                <span>
                  {new Date(post.metadata.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <span>·</span>
                <span>{post.readingTime} min read</span>
              </div>
              <ArticleActions slug={slug} title={post.metadata.title} />
            </div>

            {/* Featured Image - show for articles with explicit image OR deep dives (10+ min) */}
            {(post.metadata.image || post.readingTime > 10) && (
              <FeaturedImage
                src={post.metadata.image || `/images/posts/${slug}.jpg`}
                alt={post.metadata.title}
              />
            )}

            <div className="pt-8 border-t border-zinc-800 prose prose-invert prose-lg max-w-none
              prose-headings:font-serif prose-headings:font-light prose-headings:text-white
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:leading-relaxed prose-p:mb-6 prose-p:text-gray-300
              prose-ul:my-6 prose-li:my-2 prose-li:text-gray-300
              prose-blockquote:border-l-4 prose-blockquote:border-zinc-700
              prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400
              prose-strong:text-white prose-strong:font-semibold
              prose-a:text-gray-300 prose-a:underline hover:prose-a:text-white
              prose-img:rounded-sm prose-img:border prose-img:border-zinc-800">
              <MDXRemote
                source={post.content}
                options={{
                  mdxOptions: {
                    rehypePlugins: [rehypeSlug],
                  },
                }}
                components={{
                  ArticleImage,
                  Image,
                  YouTube,
                }}
              />
            </div>

            {/* Related Tags */}
            {post.metadata.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-zinc-800">
                <h3 className="text-sm text-gray-500 mb-4">Explore related topics</h3>
                <div className="flex flex-wrap gap-2">
                  {post.metadata.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/tags/${tag}`}
                      className="px-3 py-1 text-sm border border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Series Navigation */}
            {seriesNav.series && (seriesNav.prev || seriesNav.next) && (
              <div className="mt-16 pt-8 border-t border-zinc-800">
                <div className="text-sm text-gray-500 mb-4">
                  Continue in {seriesNames[seriesNav.series] || seriesNav.series}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {seriesNav.prev && (
                    <Link
                      href={`/posts/${seriesNav.prev.slug}`}
                      className="group p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                    >
                      <div className="text-xs text-gray-500 mb-2">← Previous</div>
                      <div className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors">
                        {seriesNav.prev.metadata.title}
                      </div>
                    </Link>
                  )}
                  {seriesNav.next && (
                    <Link
                      href={`/posts/${seriesNav.next.slug}`}
                      className={`group p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors ${!seriesNav.prev ? 'md:col-start-2' : ''}`}
                    >
                      <div className="text-xs text-gray-500 mb-2 text-right">Next →</div>
                      <div className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors text-right">
                        {seriesNav.next.metadata.title}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <div className="mt-16 pt-12 border-t border-zinc-800">
                <h2 className="font-serif text-2xl font-light text-white mb-8">
                  Go Deeper
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {relatedCourses.map((course) => (
                    <Link
                      key={course.slug}
                      href={`/courses/${course.slug}`}
                      className="group p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs uppercase tracking-wide text-gray-500">
                          {course.metadata.category}
                        </span>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500">
                          {course.metadata.level}
                        </span>
                        {course.metadata.price === 0 && (
                          <>
                            <span className="text-gray-700">·</span>
                            <span className="text-xs text-green-500">Free</span>
                          </>
                        )}
                      </div>
                      <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-1">
                        {course.metadata.title}
                      </h3>
                      <p className="text-gray-500 text-sm line-clamp-2">
                        {course.metadata.description}
                      </p>
                      <div className="mt-3 text-xs text-gray-600">
                        {course.metadata.modules.length} modules · {course.metadata.duration}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-16 pt-12 border-t border-zinc-800">
                <h2 className="font-serif text-2xl font-light text-white mb-8">
                  Keep Reading
                </h2>
                <div className="grid gap-4">
                  {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.slug}
                      href={`/posts/${relatedPost.slug}`}
                      className="group flex items-start gap-4 p-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          {relatedPost.metadata.categories.map((category) => (
                            <span
                              key={category}
                              className="text-xs uppercase tracking-wide text-gray-500"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-serif text-lg text-white group-hover:text-gray-300 transition-colors mb-1">
                          {relatedPost.metadata.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-1">
                          {relatedPost.metadata.excerpt}
                        </p>
                      </div>
                      <div className="text-gray-600 text-sm flex-shrink-0">
                        {relatedPost.readingTime} min
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <Comments slug={slug} />
              </div>

              {/* Table of Contents Sidebar */}
              <TableOfContents content={post.content} />
            </div>
          </div>
        </article>
      </main>
      <BackToTop />
      {seriesNav.series && (
        <KeyboardNav
          prevSlug={seriesNav.prev?.slug}
          nextSlug={seriesNav.next?.slug}
        />
      )}
    </>
  );
}
