import { notFound } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import { getAllPosts, getPostBySlug } from '@/lib/posts';
import { MDXRemote } from 'next-mdx-remote/rsc';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-stone-50">
        <article className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-6">
              {post.metadata.categories.map((category) => (
                <span
                  key={category}
                  className="text-sm uppercase tracking-wide text-stone-500"
                >
                  {category}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-stone-900 mb-6">
              {post.metadata.title}
            </h1>
            <p className="text-xl text-stone-600 mb-8 leading-relaxed">
              {post.metadata.excerpt}
            </p>
            <div className="text-stone-500 mb-12 pb-8 border-b border-stone-200">
              {new Date(post.metadata.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="prose prose-stone prose-lg max-w-none
              prose-headings:font-serif prose-headings:font-light
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:leading-relaxed prose-p:mb-6
              prose-ul:my-6 prose-li:my-2
              prose-blockquote:border-l-4 prose-blockquote:border-stone-300
              prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-stone-700
              prose-strong:text-stone-900 prose-strong:font-semibold">
              <MDXRemote source={post.content} />
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
