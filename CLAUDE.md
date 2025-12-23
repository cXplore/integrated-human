# Integrated Human - Agent Context

## Project Identity

**What this is:** A personal development platform focused on psychological integration (Mind, Body, Soul, Relationships). Content-driven business with courses, articles, quizzes, AI-powered tools, and lead magnets.

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
- Stripe (payments + subscriptions)
- ConvertKit (email marketing)
- LM Studio / Qwen3-32b (local AI for companion features)

### Critical Paths
```
app/
├── api/                    # Route handlers
│   ├── checkout/           # Stripe checkout + verify
│   ├── webhook/stripe/     # Stripe webhooks
│   ├── exercises/          # Interactive exercise responses
│   ├── lead-magnets/       # Lead magnet download + content
│   ├── certificates/       # Certificate generation (tiered)
│   ├── courses/            # Course metadata + access APIs
│   ├── purchases/          # Purchase status checks
│   ├── journal/            # Journal entries + AI companion
│   ├── dreams/             # Dream journal + AI interpretation
│   ├── stuck/              # "Where I'm Stuck" AI feature
│   ├── chat/               # AI companion chat
│   ├── article-progress/   # Reading progress with scroll sync
│   ├── check-ins/          # Integration check-ins
│   ├── assessments/        # Assessment results + synthesis
│   ├── credits/            # AI credit management
│   └── subscriptions/      # Subscription management
├── courses/[courseSlug]/   # Course pages with dynamic modules
├── certificate/[id]/       # Certificate verification pages
├── transparency/           # Transparency section
│   ├── methodology/        # Development Spectrum framework
│   ├── standards/          # Quality standards
│   ├── certificates/       # Certificate tier explanation
│   └── audits/[courseSlug] # Per-course audit documents
├── free/[slug]/            # Lead magnet landing pages
├── posts/[slug]/           # MDX articles
├── practices/[slug]/       # Guided practices
├── profile/                # User dashboard
│   ├── journal/            # AI-powered journaling
│   ├── dreams/             # Dream journal
│   └── subscription/       # Subscription management
├── stuck/                  # "Where I'm Stuck" standalone page
├── library/                # All articles with filtering
├── books/                  # Recommended books
├── privacy/                # Privacy policy
├── terms/                  # Terms of service
└── components/
    ├── course/             # Interactive exercise components
    ├── WhereImStuck.tsx    # AI-powered resource finder
    ├── ContentCompanion.tsx # AI companion for articles/courses
    ├── ReadTracker.tsx     # Scroll progress tracking
    └── Footer.tsx          # Site-wide footer

content/
├── posts/                  # MDX files (200+ articles)
├── courses/                # 78 courses with JSON + MDX modules
├── practices/              # 7 guided practices (breathwork, grounding, etc.)
├── lead-magnets/           # 4 lead magnet markdown files
└── products/               # Product descriptions

lib/
├── courses.ts              # Course/module loading functions
├── practices.ts            # Practice loading functions
├── lead-magnets.ts         # Lead magnet loading
├── posts.ts                # Article loading functions
├── stripe.ts               # Stripe client + helpers
├── subscriptions.ts        # Subscription tier + AI credit config
├── presence.ts             # AI context building
├── prisma.ts               # Database client
├── rate-limit.ts           # In-memory rate limiting
├── sanitize.ts             # Input sanitization + safeJsonParse
└── env.ts                  # Environment variable validation

prisma/schema.prisma        # Database models
```

### Data Models (Prisma)
```
User                # Google OAuth profile + preferences
Account             # OAuth provider accounts
UserProfile         # Onboarding data, preferences, sensitivities
Purchase            # Stripe payment records (userId + courseSlug)
Subscription        # Active subscription data
CourseProgress      # userId + courseSlug + moduleSlug + completed
ExerciseResponse    # Interactive exercise data (journal, checklist)
Certificate         # Issued credentials (tiered: completion vs certificate)
QuizAttempt         # Score tracking, pass/fail status
ArticleProgress     # Reading completion + scroll position tracking
ReadingListItem     # Saved articles
JournalEntry        # Standalone journal entries with AI companion
DreamEntry          # Dream journal with symbols, emotions, AI interpretation
IntegrationCheckIn  # Periodic integration reflections
AssessmentResult    # Archetype, shadow, nervous system assessments
AICredits           # Token balance (monthly + purchased)
AIUsage             # Usage tracking for analytics
```

---

## Business Logic That Matters

### AI Features (LM Studio / Local)
- **Content Companion** - Contextual AI assistant on articles/courses
- **Journal Companion** - AI-powered reflection prompts and insights
- **Dream Interpretation** - Symbol analysis with psychological context
- **Where I'm Stuck** - Describes struggle → matched to relevant content
- **Assessment Synthesis** - Combines multiple assessments into integrated profile

All AI features use token credits (monthly allocation for members, purchasable for everyone).

### Subscription Model (Single Tier)
```
Free               - 50 articles, 5 intro courses, free resources, no AI
Member ($19/month) - Everything: all courses, all articles, 500 AI credits/month
                     Yearly: $190 (2 months free)
```

AI credits purchasable separately: $0.025 per credit (1,000 tokens).

### Development Spectrum Framework
Courses are tagged with which stage(s) of development they serve:
- **Collapse** - Crisis support, stabilization, acute distress
- **Regulation** - Nervous system work, grounding, building safety
- **Integration** - Shadow work, pattern recognition, emotional processing
- **Embodiment** - Practice, consistency, living values sustainably
- **Optimization** - Peak performance, flow, mastery (only for solid foundations)

Each course has a `spectrum` field in course.json with applicable stages.
Used for personalized recommendations and preventing inappropriate content matching.

Key principle: Don't push optimization on people in collapse.

#### The Presence Dimension
Each stage has two versions—one with presence, one with avoidance. Presence isn't a destination after optimization; it's available at every stage. It's the key that moves you forward.

| Stage | With Presence (progress) | With Avoidance (regression) |
|-------|--------------------------|----------------------------|
| Collapse | Surrender—allowing breakdown, accepting help | Drowning—thrashing, isolation, fighting inevitable |
| Regulation | Safety—grounding, building capacity to feel | Numbing—avoiding sensation, substances, dissociation |
| Integration | Understanding—feeling through, genuine processing | Rumination—analysis without feeling, intellectualizing |
| Embodiment | Aliveness—practice with awareness, living truth | Empty ritual—mechanical practice, spiritual bypassing |
| Optimization | Flow—effortless action, mastery with meaning | Burnout—grinding, achievement as avoidance → collapse |

**Presence moves you up the spectrum. Avoidance pulls you down.** Without presence at any stage, you get stuck or slide backward—eventually cycling back to collapse.

#### Research Foundations
This framework synthesizes established models:
- **Polyvagal Theory** (Porges) - Nervous system states
- **Window of Tolerance** (Siegel) - Processing zone
- **IFS** (Schwartz) - Parts and protective mechanisms
- **Spiritual Bypassing** (Welwood) - Using spirituality to avoid psychology
- **Developmental models** (Wilber, Spiral Dynamics) - Stage-appropriate interventions
- **Contemplative traditions** - Presence available at every moment

### Course Tiers (Content Categories, Not Pricing)
Courses are categorized by depth/complexity, not individually priced:
```
Intro       - Entry-level, short duration, completion record
Beginner    - Foundation courses, completion record
Intermediate- Deeper exploration, completion record
Advanced    - Comprehensive + assessment, full certificate
Flagship    - Our deepest work, full certificate, most extensive
```

All courses included with membership ($19/month). Free users can access 5 intro courses.

### Payment Flow (Stripe)
**Subscriptions:**
1. User clicks "Become a Member" on pricing page
2. POST `/api/subscriptions/checkout` creates Stripe subscription session
3. User completes payment on Stripe
4. Webhook creates Subscription record, unlocks all content + AI credits

**AI Credits (one-time purchase):**
1. User purchases credits from profile or pricing page
2. POST `/api/credits/checkout` creates Stripe payment session
3. Webhook adds tokens to AICredits balance

### Certificate Tiering System
Two credential types based on course tier:

**Completion Records** (Intro, Beginner, Intermediate tiers):
- Simpler, modern design
- Acknowledges course completion
- No assessment required

**Certificates of Achievement** (Advanced, Flagship tiers):
- Formal design with decorative elements
- Requires passing quiz (70%+ default)
- Includes assessment score
- Links to course audit document

Certificate Flow:
1. User completes all modules (CourseProgress records)
2. For certificate-tier courses: User takes quiz (`/courses/[slug]/quiz`)
3. Quiz requires 70%+ pass (configurable per course in course.json)
4. On pass: QuizAttempt.passed = true
5. User claims credential from profile
6. Certificate API determines credential type from course tier
7. Credential generated with unique ID, viewable/printable/verifiable

### Reading Progress Sync
- `ReadTracker` component on article pages
- Saves scroll position to database (debounced, 5% threshold)
- Restores scroll position on return
- Uses `sendBeacon` on page unload for reliable saves
- `ContinueReading` component on profile shows in-progress articles

---

## Patterns to Follow

### Adding a Course
1. Create `content/courses/[slug]/` directory
2. Add `course.json` with CourseMetadata shape (see lib/courses.ts)
3. Add MDX files for each module matching `modules[].slug`
4. Use interactive components: `<Journal>`, `<Checklist>`, `<Callout>`, `<Exercise>`
5. Add quiz questions if certification desired (required for advanced/flagship tiers)
6. Set `tier`: intro, beginner, intermediate, advanced, or flagship
7. Set `spectrum`: array of applicable stages (collapse, regulation, integration, embodiment, optimization)
8. Set `published: true` when ready

### Adding a Practice
1. Create `content/practices/[slug].mdx`
2. Add frontmatter: title, description, duration, category, helpssWith, steps
3. Practice auto-appears at `/practices/[slug]`

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

### AI Streaming Pattern
```typescript
// Use TransformStream for SSE with think-tag filtering
const transformStream = new TransformStream({
  transform(chunk, controller) {
    // Filter <think>...</think> tags from qwen3 responses
    // Stream content incrementally
  }
});
return new Response(response.body?.pipeThrough(transformStream), {
  headers: { 'Content-Type': 'text/event-stream' }
});
```

---

## Known Constraints

### TypeScript
- `services/` directory excluded from compilation (external Python services)
- Strict null checks enforced
- Use optional chaining for nullable data (`data?.recentUsage?.messageCount`)

### Database
- Supabase PostgreSQL with connection pooling
- Prisma client regenerate needed after schema changes: `npx prisma generate`
- Schema push for dev: `npx prisma db push`

### AI / LM Studio
- Default URL: `http://10.221.168.219:1234/v1/chat/completions`
- Model: qwen/qwen3-32b (supports `/no_think` suffix)
- Filter `<think>` tags from streaming responses

### Build
- Turbopack for dev
- 1220+ static pages generated
- Some pages dynamic (API routes, auth-protected)

---

## Current State (Dec 2025)

### Implemented
- **102 courses** with full module content, quizzes, and navigation
  - Tagged with Development Spectrum stages
  - All included with $19/month membership
- **Transparency Section** at /transparency
  - Methodology page (Development Spectrum framework)
  - The Deeper Work page (contemplative dimension, two paths)
  - Quality Standards page
  - Certificate Standards page
  - Course Audits (per-course audit documents)
- **200+ articles** in content/posts/
- **7 guided practices** (breathwork, grounding, somatic work)
- **Interactive exercises** - Journal prompts, checklists, callouts in MDX
- **Stripe subscriptions** - Single-tier membership ($19/month or $190/year)
- **AI credit purchases** - Pay-as-you-go tokens ($0.025 per credit)
- **Lead magnets** - 4 downloadable resources with email capture
- **Certificate tiering** - Completion records vs full certificates based on course tier
- **Quiz system** with certificate gating (advanced/flagship tiers)
- **User authentication** (Google OAuth)
- **Onboarding flow** - Multi-step profile setup
- **Course/article progress tracking** with scroll position sync
- **Profile dashboard** with subscription, certificates, stats, journaling
- **Learning paths** - Curated course sequences
- **Archetype quiz** - Full masculine/feminine assessment
- **Shadow profile quiz** - 8 shadow patterns
- **Nervous system check** - Polyvagal-based assessment
- **AI-powered features:**
  - Content companion (articles + courses)
  - Journal companion with insights
  - Dream journal with interpretation
  - "Where I'm Stuck" resource finder
  - Assessment synthesis
- **AI credit system** - 500 monthly for members + purchasable tokens
- **Integration check-ins** - Periodic reflection system
- **Reading streaks** - Engagement tracking
- **Site footer** - Full navigation + legal pages
- **Privacy policy** and **Terms of service**
- **Security hardening** - Rate limiting, input sanitization, auth on all AI endpoints

### Not Yet Implemented
- Email sequences in ConvertKit (infrastructure ready)
- Digital workbooks (PDF products)
- Community features (Discord integration)
- Full AI avatar (code exists, needs deployment)

---

## File Quick Reference

| Purpose | File |
|---------|------|
| Stripe client | `lib/stripe.ts` |
| Subscription config | `lib/subscriptions.ts` |
| Subscription checkout | `app/api/subscriptions/checkout/route.ts` |
| Credits checkout | `app/api/credits/checkout/route.ts` |
| Webhook handler | `app/api/webhook/stripe/route.ts` |
| Exercise API | `app/api/exercises/route.ts` |
| Journal API | `app/api/journal/route.ts` |
| Dream API | `app/api/dreams/route.ts` |
| Stuck API | `app/api/stuck/route.ts` |
| Credits API | `app/api/credits/route.ts` |
| Article progress | `app/api/article-progress/route.ts` |
| Course loader | `lib/courses.ts` (includes SpectrumStage type) |
| Practice loader | `lib/practices.ts` |
| Article loader | `lib/posts.ts` |
| AI context builder | `lib/presence.ts` |
| Rate limiting | `lib/rate-limit.ts` |
| Input sanitization | `lib/sanitize.ts` |
| Env validation | `lib/env.ts` |
| Interactive components | `app/components/course/MDXComponents.tsx` |
| Error boundaries | `app/components/ErrorBoundary.tsx` |
| Read tracker | `app/components/ReadTracker.tsx` |
| Content companion | `app/components/ContentCompanion.tsx` |
| Where I'm Stuck | `app/components/WhereImStuck.tsx` |
| Footer | `app/components/Footer.tsx` |
| Database schema | `prisma/schema.prisma` |

---

## Working Philosophy

### The Deepest Layer

This platform points toward stillness. Presence. The direct experience of being—whether accessed through meditation, psychedelics, embodiment, or simply paying attention.

Everything here serves that. The courses, the articles, the AI tools—they're fingers pointing at the moon. The UI, the interactions, the pacing—they should embody what they teach.

**This is non-negotiable:**
- No bouncing animations competing with contemplative content
- No fire emoji streaks, no gamification that pulls attention outward
- No commercial urgency that fragments presence
- No visual noise during moments meant for stillness

When in doubt: does this help someone settle into themselves, or does it pull them out?

### Presence in Design

The interface should breathe. Movement has its place—but it must be sensitive to context.

- A loading indicator can pulse. A wisdom quote cannot have animation beside it.
- Transitions should be slow enough to feel intentional, not urgent.
- White space is not emptiness—it's room to arrive.
- The nervous system of the reader matters. Design for regulation, not stimulation.

Sometimes the most impactful choice is removing something.

### Content
- Depth over volume. Quality content that transforms > endless content that entertains.
- Free content should be genuinely valuable, not watered down teasers.
- Premium goes deeper, more structured, more actionable.

### Development
- Simple first, elaborate later. Get it working, then improve.
- Proactive suggestions welcome—but run them through the presence filter.
- When unsure between options, bias toward what serves the person doing hard inner work.

### Brand Voice
Warm but not soft. Direct but not harsh. Practical mysticism.

Avoid: toxic positivity, spiritual bypassing, oversimplification of complex inner work, attention-hijacking patterns.
Embrace: honesty about difficulty, compassion for struggle, trust in the reader's intelligence, respect for their attention.

### When Suggesting Features
Ask: Does this deepen the integration journey or distract from it?
Ask: Does this help someone become more present, or less?

---

## Related Docs

- **IDEAS.md** - Future possibilities and creative brainstorming
- **CONTENT_ROADMAP.md** - Content calendar, monetization strategy, revenue projections
