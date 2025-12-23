'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Certificate {
  id: string;
  certificateId: string;
  courseSlug: string;
  courseName: string;
  userName: string;
  issuedAt: string;
}

interface CourseWithProgress {
  slug: string;
  title: string;
  totalModules: number;
  completedModules: number;
  hasQuiz: boolean;
  quizPassed: boolean;
}

export default function Certificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligibleCourses, setEligibleCourses] = useState<CourseWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch existing certificates
        const certResponse = await fetch('/api/certificates');
        let certs: Certificate[] = [];
        if (certResponse.ok) {
          const certJson = await certResponse.json();
          // API returns { certificates: [...], total, hasMore }
          certs = certJson.certificates || [];
          setCertificates(certs);
        }

        // Fetch course progress to find eligible courses
        const progressResponse = await fetch('/api/course-progress');
        const coursesResponse = await fetch('/api/courses');

        if (progressResponse.ok && coursesResponse.ok) {
          const progressJson = await progressResponse.json();
          // API returns { progress: [...], total, hasMore }
          const progress = progressJson.progress || [];
          const courses = await coursesResponse.json();

          // Group progress by course
          const progressByCourse: Record<string, Set<string>> = {};
          progress.forEach((p: { courseSlug: string; moduleSlug: string; completed: boolean }) => {
            if (p.completed) {
              if (!progressByCourse[p.courseSlug]) {
                progressByCourse[p.courseSlug] = new Set();
              }
              progressByCourse[p.courseSlug].add(p.moduleSlug);
            }
          });

          // Find completed courses that don't have certificates yet
          const certSlugs = new Set(certs.map((c: Certificate) => c.courseSlug));
          const eligible: CourseWithProgress[] = [];

          // Fetch quiz status for each completed course
          for (const course of courses) {
            const completed = progressByCourse[course.id]?.size || 0;
            if (completed === course.modules.length && !certSlugs.has(course.id)) {
              // Check quiz status
              let quizPassed = false;
              const hasQuiz = course.hasQuiz || false;

              if (hasQuiz) {
                try {
                  const quizRes = await fetch(`/api/quiz?courseSlug=${course.id}`);
                  if (quizRes.ok) {
                    const quizData = await quizRes.json();
                    quizPassed = quizData.hasPassed;
                  }
                } catch {
                  // Quiz check failed, assume not passed
                }
              }

              eligible.push({
                slug: course.id,
                title: course.title,
                totalModules: course.modules.length,
                completedModules: completed,
                hasQuiz,
                quizPassed,
              });
            }
          }

          setEligibleCourses(eligible);
        }
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const claimCertificate = async (courseSlug: string) => {
    setClaiming(courseSlug);
    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug }),
      });

      if (response.ok) {
        const newCert = await response.json();
        setCertificates(prev => [newCert, ...prev]);
        setEligibleCourses(prev => prev.filter(c => c.slug !== courseSlug));
      }
    } catch (error) {
      console.error('Failed to claim certificate:', error);
    } finally {
      setClaiming(null);
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Certificates
        </h2>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (certificates.length === 0 && eligibleCourses.length === 0) {
    return (
      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
          Certificates
        </h2>
        <div className="bg-zinc-900 border border-zinc-800 p-4">
          <p className="text-gray-400 text-sm mb-3">
            Complete a course to earn your certificate.
          </p>
          <Link
            href="/courses"
            className="inline-block text-sm text-white hover:text-gray-300 transition-colors"
          >
            Browse courses &rarr;
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Claimable Certificates */}
      {eligibleCourses.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Claim Your Certificate
          </h2>
          <div className="space-y-3">
            {eligibleCourses.map((course) => (
              <div
                key={course.slug}
                className={`p-4 flex items-center justify-between ${
                  course.hasQuiz && !course.quizPassed
                    ? 'bg-amber-900/20 border border-amber-800/50'
                    : 'bg-green-900/20 border border-green-800/50'
                }`}
              >
                <div>
                  <p className="text-white font-medium">{course.title}</p>
                  {course.hasQuiz && !course.quizPassed ? (
                    <p className="text-amber-400 text-sm">Pass the quiz to earn your certificate</p>
                  ) : (
                    <p className="text-green-400 text-sm">Ready to claim!</p>
                  )}
                </div>
                {course.hasQuiz && !course.quizPassed ? (
                  <a
                    href={`/courses/${course.slug}/quiz`}
                    className="px-4 py-2 bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    Take Quiz
                  </a>
                ) : (
                  <button
                    onClick={() => claimCertificate(course.slug)}
                    disabled={claiming === course.slug}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {claiming === course.slug ? 'Claiming...' : 'Claim Certificate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earned Certificates */}
      {certificates.length > 0 && (
        <div>
          <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-4">
            Your Certificates
          </h2>
          <div className="grid gap-4">
            {certificates.map((cert) => (
              <Link
                key={cert.id}
                href={`/certificate/${cert.certificateId}`}
                className="group bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 p-4 hover:border-zinc-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-medium group-hover:text-gray-200 transition-colors">
                      {cert.courseName}
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-amber-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-xs mt-3">
                  Click to view &amp; download &rarr;
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
