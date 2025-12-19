'use client';

import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { CourseProvider, mdxComponents } from '@/app/components/course/MDXComponents';
import { useState, useEffect } from 'react';

interface ModuleContentProps {
  source: MDXRemoteSerializeResult;
  courseSlug: string;
  moduleSlug: string;
}

export default function ModuleContent({ source, courseSlug, moduleSlug }: ModuleContentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering MDX until client-side
  if (!mounted) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
        <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
        <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <CourseProvider courseSlug={courseSlug} moduleSlug={moduleSlug}>
      <MDXRemote {...source} components={mdxComponents} />
    </CourseProvider>
  );
}
