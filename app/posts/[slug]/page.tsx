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
      <main className="min-h-screen bg-zinc-950">
        <article className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-3 mb-6">
              {post.metadata.categories.map((category) => (
                <span
                  key={category}
                  className="text-sm uppercase tracking-wide text-gray-500"
                >
                  {category}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-light text-white mb-6">
              {post.metadata.title}
            </h1>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              {post.metadata.excerpt}
            </p>
            <div className="text-gray-500 mb-12 pb-8 border-b border-zinc-800">
              {new Date(post.metadata.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="prose prose-invert prose-lg max-w-none
              prose-headings:font-serif prose-headings:font-light prose-headings:text-white
              prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
              prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
              prose-p:leading-relaxed prose-p:mb-6 prose-p:text-gray-300
              prose-ul:my-6 prose-li:my-2 prose-li:text-gray-300
              prose-blockquote:border-l-4 prose-blockquote:border-zinc-700
              prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-400
              prose-strong:text-white prose-strong:font-semibold
              prose-a:text-gray-300 prose-a:underline hover:prose-a:text-white">
              <MDXRemote source={post.content} />
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
