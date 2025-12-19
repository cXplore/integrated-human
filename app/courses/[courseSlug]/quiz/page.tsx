import { getCourseBySlug, getAllModulesForCourse } from '@/lib/courses';
import { notFound } from 'next/navigation';
import Navigation from '@/app/components/Navigation';
import QuizClient from './QuizClient';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ courseSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    return { title: 'Quiz Not Found' };
  }

  return {
    title: `Quiz - ${course.metadata.title} | Integrated Human`,
    description: `Final assessment for ${course.metadata.title}`,
  };
}

export default async function QuizPage({ params }: Props) {
  const { courseSlug } = await params;
  const course = getCourseBySlug(courseSlug);

  if (!course) {
    notFound();
  }

  const { metadata } = course;

  if (!metadata.quiz) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-zinc-950 pt-24 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="font-serif text-3xl text-white mb-4">No Quiz Available</h1>
            <p className="text-gray-400 mb-8">This course doesn&apos;t have a quiz yet.</p>
            <Link
              href={`/courses/${courseSlug}`}
              className="text-gray-400 hover:text-white transition-colors"
            >
              &larr; Back to course
            </Link>
          </div>
        </main>
      </>
    );
  }

  // Get modules to check progress
  const modules = getAllModulesForCourse(courseSlug);

  // Prepare quiz data (without correct answers for client)
  const clientQuiz = {
    passingScore: metadata.quiz.passingScore,
    questions: metadata.quiz.questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
    })),
  };

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-zinc-950 pt-24 px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/courses/${courseSlug}`}
            className="text-gray-400 hover:text-white transition-colors mb-8 inline-block"
          >
            &larr; Back to {metadata.title}
          </Link>

          <h1 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
            Final Assessment
          </h1>
          <p className="text-gray-400 mb-2">{metadata.title}</p>
          <p className="text-gray-500 text-sm mb-8">
            Pass with {metadata.quiz.passingScore}% or higher to earn your certificate.
            You can retake the quiz as many times as needed.
          </p>

          <QuizClient
            courseSlug={courseSlug}
            courseName={metadata.title}
            quiz={clientQuiz}
            totalModules={modules.length}
          />
        </div>
      </main>
    </>
  );
}
