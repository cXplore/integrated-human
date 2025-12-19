# Integrated Human - Agent Context

## Project Identity

**What this is:** A personal development platform focused on psychological integration (Mind, Body, Soul, Relationships). Content-driven business with courses, articles, quizzes, and lead magnets.

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
- Stripe (payments)
- ConvertKit (email marketing)

### Critical Paths
```
app/
├── api/                    # Route handlers
│   ├── checkout/           # Stripe checkout + verify
│   ├── webhook/stripe/     # Stripe webhooks
│   ├── exercises/          # Interactive exercise responses
│   ├── lead-magnets/       # Lead magnet download + content
│   ├── certificates/       # Certificate generation
│   ├── courses/[courseSlug]/ # Course metadata API
│   └── purchases/          # Purchase status checks
├── courses/[courseSlug]/   # Course pages with dynamic modules
├── free/[slug]/            # Lead magnet landing pages
├── posts/[slug]/           # MDX articles
├── profile/                # User dashboard + purchases
└── components/
    └── course/             # Interactive exercise components

content/
├── articles/               # MDX files (75+ articles)
├── courses/                # 35 courses with JSON + MDX modules
└── lead-magnets/           # 4 lead magnet markdown files

lib/
├── courses.ts              # Course/module loading functions
├── lead-magnets.ts         # Lead magnet loading
├── posts.ts                # Article loading functions
├── stripe.ts               # Stripe client + helpers
└── prisma.ts               # Database client

prisma/schema.prisma        # Database models
```

### Data Models (Prisma)
```
User                # Google OAuth profile + preferences
Purchase            # Stripe payment records (userId + courseSlug)
CourseProgress      # userId + courseSlug + moduleSlug + completed
ExerciseResponse    # Interactive exercise data (journal, checklist)
Certificate         # Issued after quiz pass, unique certificateId
QuizAttempt         # Score tracking, pass/fail status
ArticleProgress     # Reading completion tracking
ReadingListItem     # Saved articles
```

---

## Business Logic That Matters

### Payment Flow (Stripe)
1. User clicks "Enroll Now" on course page
2. PurchaseButton checks auth, redirects to login if needed
3. POST `/api/checkout` creates Stripe Checkout Session
4. User completes payment on Stripe
5. Redirect back with `?purchase=success&session_id={ID}`
6. PurchaseSuccess component calls `/api/checkout/verify`
7. Verify endpoint confirms with Stripe, creates Purchase record
8. Webhook (production) also creates Purchase as backup

### Certificate Flow
1. User completes all modules (CourseProgress records)
2. User takes quiz (`/courses/[slug]/quiz`)
3. Quiz requires 70% pass (configurable per course in course.json)
4. On pass: QuizAttempt.passed = true
5. User claims certificate from profile
6. Certificate API checks: all modules + quiz passed
7. Certificate generated with unique ID, viewable/printable

### Lead Magnet Flow
1. User visits `/free` or `/free/[slug]`
2. Enters email in LeadMagnetForm
3. POST `/api/lead-magnets/download` subscribes to ConvertKit with tag
4. Returns download URL → opens printable HTML version
5. User can Print/Save as PDF from browser

### Interactive Exercises
Course modules can include:
- `<Journal>` - Auto-saving text areas for reflection
- `<Checklist>` - Trackable item lists with progress
- `<Checkbox>` - Single checkable items
- `<Exercise>` - Visual wrapper for exercise sections
- `<Callout>` - Styled note boxes (note, warning, insight, practice)

Data saves to ExerciseResponse table for logged-in users, localStorage for guests.

### Course Structure
Each course has:
- `content/courses/[slug]/course.json` - metadata, modules array, quiz questions
- `content/courses/[slug]/[module-slug].mdx` - module content with interactive components
- Quiz is optional per course (check `metadata.quiz` existence)
- Categories: Flagship, Mind, Body, Soul, Relationships

---

## Patterns to Follow

### Adding a Course
1. Create `content/courses/[slug]/` directory
2. Add `course.json` with CourseMetadata shape (see lib/courses.ts)
3. Add MDX files for each module matching `modules[].slug`
4. Use interactive components: `<Journal>`, `<Checklist>`, `<Callout>`, `<Exercise>`
5. Add quiz questions if certification desired
6. Set `published: true` when ready

### Adding Interactive Exercises to Modules
```mdx
<Journal
  id="unique-id"
  prompt="The reflection question"
  placeholder="Hint text..."
  rows={6}
/>

<Checklist
  id="unique-id"
  title="Items to complete"
  items={["Item 1", "Item 2", "Item 3"]}
/>

<Callout type="insight">
Important insight or note here.
</Callout>
```

### Adding a Lead Magnet
1. Create `content/lead-magnets/[slug].md`
2. Add metadata in `lib/lead-magnets.ts` (leadMagnetMeta object)
3. Landing page auto-generated at `/free/[slug]`

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

### Stripe
- Test mode keys in `.env.local`
- Webhook needs Stripe CLI for local testing, or production URL
- API version: `2025-12-15.clover`

### Build
- Turbopack for dev, production builds ~3s compile
- 350+ static pages generated
- Some pages dynamic (API routes, auth-protected)

---

## Current State (Dec 2024)

### Implemented
- **35 courses** with full module content, quizzes, and navigation
  - 4 Flagship courses ($247-$297)
  - 31 standard courses ($47-$97)
- **Interactive exercises** - Journal prompts, checklists, callouts in MDX
- **Stripe payments** - Checkout, verification, purchase tracking
- **Lead magnets** - 4 downloadable resources with email capture
- **Quiz system** with certificate gating
- **User authentication** (Google OAuth)
- **Course/article progress tracking**
- **Profile dashboard** with purchases, certificates, stats
- **Learning paths** - Curated course sequences
- **Mega menu navigation** with Free resources link

### Not Yet Implemented
- Course content gating (currently open for testing)
- Email sequences in ConvertKit (infrastructure ready)
- AI guide avatar (code exists but not deployed)
- Membership/subscription tier
- Digital workbooks (PDF products)

---

## File Quick Reference

| Purpose | File |
|---------|------|
| Stripe client | `lib/stripe.ts` |
| Checkout API | `app/api/checkout/route.ts` |
| Purchase verify | `app/api/checkout/verify/route.ts` |
| Webhook handler | `app/api/webhook/stripe/route.ts` |
| Exercise API | `app/api/exercises/route.ts` |
| Lead magnet API | `app/api/lead-magnets/download/route.ts` |
| Course loader | `lib/courses.ts` |
| Lead magnet loader | `lib/lead-magnets.ts` |
| Interactive components | `app/components/course/MDXComponents.tsx` |
| Module renderer | `app/courses/[courseSlug]/[moduleSlug]/ModuleContent.tsx` |
| Purchase button | `app/components/PurchaseButton.tsx` |
| Database schema | `prisma/schema.prisma` |

---

## Working Philosophy

### Content
- Depth over volume. Quality content that transforms > endless content that entertains.
- Free content should be genuinely valuable, not watered down teasers.
- Premium goes deeper, more structured, more actionable.

### Development
- Simple first, elaborate later. Get it working, then improve.
- Proactive suggestions welcome - think outside the box.
- When unsure between options, bias toward what serves the person doing hard inner work.

### Brand Voice
Warm but not soft. Direct but not harsh. Practical mysticism.

Avoid: toxic positivity, spiritual bypassing, oversimplification of complex inner work.
Embrace: honesty about difficulty, compassion for struggle, trust in the reader's intelligence.

### When Suggesting Features
Ask: Does this deepen the integration journey or distract from it?

---

## Related Docs

- **IDEAS.md** - Future possibilities and creative brainstorming
- **CONTENT_ROADMAP.md** - Content calendar, monetization strategy, revenue projections
