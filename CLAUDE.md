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

## Ideas & Future Possibilities

Think outside the box. These are suggestions, not plans - creative prompts for expanding the platform.

### Engagement Features
- **Streak system** - Daily check-ins with integration prompts, gamify the journey
- **Progress visualizations** - Integration wheel showing balance across 4 pillars
- **Journaling integration** - Private journal entries tied to modules, AI reflection prompts
- **Community challenges** - Monthly themes like "30 days of shadow work" with shared progress

### Content Expansion
- **Audio versions** - TTS for articles, guided meditations embedded in courses
- **Video content** - Short embodiment practices, breathwork guides
- **Interactive exercises** - Parts work dialogues, inner critic conversations (chat-based)
- **Assessment tools** - Beyond archetypes: attachment style quiz, shadow profile, nervous system state check

### Monetization Ideas
- **Tiered certificates** - Bronze/Silver/Gold based on depth of engagement
- **Corporate/therapist licensing** - White-label courses for practitioners
- **Integration coaching marketplace** - Connect users with vetted coaches (take percentage)
- **Physical products** - Integration journal (printed), card decks for shadow work prompts

### Technical Enhancements
- **AI integration guide** - Conversational assistant that knows user's progress, suggests next steps
- **Spaced repetition** - Review prompts for key concepts at optimal intervals
- **Social features** - Anonymous sharing of insights, peer support matching
- **Mobile app** - PWA or native for offline access, push notifications for practices
- **API for practitioners** - Let therapists track client progress (with consent)

### Content Formats to Explore
- **Case studies** - Anonymized integration journeys showing real transformation
- **Expert interviews** - Podcast/video conversations with Jungian analysts, somatic therapists
- **Book summaries** - Curated reading guides for Jung, Bessel van der Kolk, Gabor Maté
- **Crisis resources** - When shadow work gets too intense, grounding protocols

### Wild Ideas
- **VR shadow work** - Immersive environments for meeting shadow figures
- **Biometric integration** - HRV tracking during practices, correlate nervous system state
- **AI-generated personalized content** - Articles tailored to user's archetype + progress
- **Retreat partnerships** - In-person intensives with online prep/integration support

---

## Creative Philosophy

This platform is about depth, not volume. Quality content that actually transforms > endless content that entertains.

When suggesting new features, consider:
- Does it deepen the integration journey or distract from it?
- Can it be done simply first, elaborated later?
- Does it serve the person doing hard inner work, or just gamify wellness?

The brand voice: warm but not soft, direct but not harsh, practical mysticism.

---

## Verification Notes

This document reflects code as of commit 1267b91. Key verifiable claims:

- Quiz requirement enforced at `app/api/certificates/route.ts:66-81`
- Course metadata shape at `lib/courses.ts:27-47`
- Certificate model at `prisma/schema.prisma:99-112`
- 8 courses exist in `content/courses/` directories

If these files have changed significantly, this document may need update.
