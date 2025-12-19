'use client';

import { createContext, useContext, ReactNode } from 'react';
import ExerciseCheckbox from './ExerciseCheckbox';
import JournalPrompt from './JournalPrompt';
import ExerciseList from './ExerciseList';

// Context for course/module info
interface CourseContextType {
  courseSlug: string;
  moduleSlug: string;
}

const CourseContext = createContext<CourseContextType | null>(null);

export function CourseProvider({
  children,
  courseSlug,
  moduleSlug,
}: {
  children: ReactNode;
  courseSlug: string;
  moduleSlug: string;
}) {
  return (
    <CourseContext.Provider value={{ courseSlug, moduleSlug }}>
      {children}
    </CourseContext.Provider>
  );
}

function useCourseContext() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('Course components must be used within CourseProvider');
  }
  return context;
}

// MDX Components that can be used in course content
export function Checkbox({ id, children }: { id: string; children: ReactNode }) {
  const { courseSlug, moduleSlug } = useCourseContext();
  return (
    <ExerciseCheckbox
      id={id}
      label={String(children)}
      courseSlug={courseSlug}
      moduleSlug={moduleSlug}
    />
  );
}

export function Journal({
  id,
  prompt,
  placeholder,
  rows,
}: {
  id: string;
  prompt: string;
  placeholder?: string;
  rows?: number;
}) {
  const { courseSlug, moduleSlug } = useCourseContext();
  return (
    <JournalPrompt
      id={id}
      prompt={prompt}
      courseSlug={courseSlug}
      moduleSlug={moduleSlug}
      placeholder={placeholder}
      minRows={rows}
    />
  );
}

export function Checklist({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: string[];
}) {
  const { courseSlug, moduleSlug } = useCourseContext();

  const listItems = items.map((text, index) => ({
    id: `${id}-${index}`,
    text,
  }));

  return (
    <ExerciseList
      id={id}
      title={title}
      items={listItems}
      courseSlug={courseSlug}
      moduleSlug={moduleSlug}
    />
  );
}

// Exercise box wrapper for styling
export function Exercise({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="my-8 border border-zinc-700 bg-zinc-900/50 rounded-lg overflow-hidden">
      {title && (
        <div className="px-5 py-3 bg-zinc-800/50 border-b border-zinc-700">
          <h4 className="text-white font-medium flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {title}
          </h4>
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// Callout/note box
export function Callout({
  children,
  type = 'note',
}: {
  children: ReactNode;
  type?: 'note' | 'warning' | 'insight' | 'practice';
}) {
  const styles = {
    note: 'border-zinc-600 bg-zinc-800/50',
    warning: 'border-amber-600/50 bg-amber-900/20',
    insight: 'border-purple-600/50 bg-purple-900/20',
    practice: 'border-green-600/50 bg-green-900/20',
  };

  const icons = {
    note: '💡',
    warning: '⚠️',
    insight: '✨',
    practice: '🎯',
  };

  return (
    <div className={`my-6 p-5 border-l-4 ${styles[type]}`}>
      <div className="flex items-start gap-3">
        <span className="text-xl">{icons[type]}</span>
        <div className="text-gray-300 text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

// Export all MDX components
export const mdxComponents = {
  Checkbox,
  Journal,
  Checklist,
  Exercise,
  Callout,
};
