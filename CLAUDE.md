# Integrated Human - Agent Context

## Project Identity

**What this is:** A personal development platform focused on psychological integration (Mind, Body, Soul, Relationships). Content-driven business with courses, articles, and quizzes.

**Live at:** integratedhuman.co (Vercel deployment)
**Repo:** github.com/cXplore/integrated-human

---

## Architecture Truth

### Stack
- Next.js 16 (App Router, Turbopack)
- TypeScript (strict mode)
- Prisma ORM → PostgreSQL (Supabase)
- TailwindCSS (dark theme primary, light mode supported)
- Google OAuth via NextAuth

### Critical Paths
```
app/                    # Next.js App Router pages
├── api/                # Route handlers (certificates, quiz, course-progress, etc.)
├── courses/[courseSlug]/  # Course pages with dynamic modules
├── posts/[slug]/       # MDX articles
├── profile/            # User dashboard
└── components/         # Shared React components

content/
├── articles/           # MDX files (75+ articles)
└── courses/            # JSON metadata + MDX modules per course

lib/
├── courses.ts          # Course/module loading functions
├── posts.ts            # Article loading functions
└── prisma.ts           # Database client

prisma/schema.prisma    # Database models
```

### Data Models (Prisma)
```
User              # Google OAuth profile + preferences
CourseProgress    # userId + courseSlug + moduleSlug + completed
Certificate       # Issued after quiz pass, unique certificateId
QuizAttempt       # Score tracking, pass/fail status
ArticleProgress   # Reading completion tracking
ReadingListItem   # Saved articles
```

---

## Business Logic That Matters

### Certificate Flow
1. User completes all modules (CourseProgress records)
2. User takes quiz (`/courses/[slug]/quiz`)
3. Quiz requires 70% pass (configurable per course in course.json)
4. On pass: QuizAttempt.passed = true
5. User claims certificate from profile
6. Certificate API checks: all modules + quiz passed
7. Certificate generated with unique ID, viewable/printable

### Course Structure
Each course has:
- `content/courses/[slug]/course.json` - metadata, modules array, quiz questions
- `content/courses/[slug]/[module-slug].mdx` - module content
- Quiz is optional per course (check `metadata.quiz` existence)

### Content Organization
Four pillars: Mind, Body, Soul, Relationships
Articles tagged for cross-referencing
Learning paths group content thematically

---

## Patterns to Follow

### Adding a Course
1. Create `content/courses/[slug]/` directory
2. Add `course.json` with CourseMetadata shape (see lib/courses.ts)
3. Add MDX files for each module matching `modules[].slug`
4. Add quiz questions if certification desired
5. Run `npx prisma generate` if schema changed

### Adding an Article
1. Create `content/articles/[slug].mdx`
2. Include frontmatter: title, description, date, category, tags
3. Category must be: mind, body, soul, or relationships

### API Route Pattern
```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // ... database operations
}
```

---

## Known Constraints

### TypeScript
- `services/` directory excluded from compilation (external Python services)
- Strict null checks enforced
- Use optional chaining for course metadata (`metadata?.quiz?.questions`)

### Database
- Supabase PostgreSQL with connection pooling
- Prisma client regenerate needed after schema changes: `npx prisma generate`
- Schema push for dev: `npx prisma db push`

### Build
- Turbopack for dev, production builds ~3s compile
- 310+ static pages generated
- Some pages dynamic (API routes, auth-protected)

---

## Current State (Dec 2024)

### Implemented
- 8 courses with full module content and navigation
- Quiz system with certificate gating
- User authentication (Google OAuth)
- Course/article progress tracking
- Profile dashboard with certificates, stats
- Mega menu navigation
- Light/dark mode CSS

### Not Implemented
- Stripe payments (courses show prices, no checkout)
- Email sequences (ConvertKit ready, no automations)
- Lead magnet PDFs
- AI guide avatar (code exists but not deployed)
- Membership/subscription tier

### Priority Queue
See CONTENT_ROADMAP.md for detailed planning.

---

## Verification Notes

This document reflects code as of commit 1267b91. Key verifiable claims:

- Quiz requirement enforced at `app/api/certificates/route.ts:66-81`
- Course metadata shape at `lib/courses.ts:27-47`
- Certificate model at `prisma/schema.prisma:99-112`
- 8 courses exist in `content/courses/` directories

If these files have changed significantly, this document may need update.
