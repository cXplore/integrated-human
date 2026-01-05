# Integrated Human - Agent Context

## Project Identity

**What this is:** A personal development platform focused on psychological integration across four pillars (Mind, Body, Soul, Relationships). Content-driven learning platform with AI-powered tools, courses, articles, assessments, and a sophisticated health tracking system.

**Live at:** integratedhuman.co (Vercel deployment)
**Repo:** github.com/cXplore/integrated-human

---

## Full Architecture

### Content Inventory

| Content Type | Count |
|-------------|-------|
| **Articles/Posts** | 201 |
| **Courses** | 92 |
| **Course Modules** | 579 |
| **Guided Practices** | 13 |
| **Learning Paths** | 17 |
| **Lead Magnets** | 4 |
| **Products** | 5 |
| **Assessment Questions** | ~205 |
| **Total Content Pieces** | **912+** |

### Platform Metrics

| Metric | Count |
|--------|-------|
| App Pages | 65 |
| API Routes | 103 |
| UI Components | 71 |
| Database Models | 41 |
| Lib System Files | 60+ |
| Health Dimensions | 30 |
| Health Facets | 75+ |

---

## Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Database:** Prisma ORM → PostgreSQL (Supabase)
- **Styling:** TailwindCSS (dark theme primary)
- **Auth:** Google OAuth via NextAuth v5
- **Payments:** Stripe (subscriptions + one-time)
- **Email:** ConvertKit (infrastructure ready)
- **AI:** LM Studio / local models (configurable)

---

## Directory Structure

```
integrated-human/
│
├── app/                          # 65 page routes, 103 API routes
│   │
│   ├── CORE PAGES
│   │   ├── / (homepage)
│   │   ├── /about
│   │   ├── /start-here
│   │   └── /welcome
│   │
│   ├── AUTHENTICATION
│   │   ├── /login
│   │   ├── /site-login           # Site-wide password protection
│   │   └── /onboarding           # Multi-step flow
│   │
│   ├── ASSESSMENTS (10+ pages)
│   │   ├── /assessment
│   │   ├── /assessment/reassess/[pillar]/[dimension]
│   │   ├── /archetype-exploration
│   │   ├── /archetypes
│   │   ├── /attachment
│   │   ├── /nervous-system
│   │   ├── /nervous-system-check
│   │   ├── /shadow-profile
│   │   ├── /values
│   │   └── /mind, /body, /soul, /relationships (pillar pages)
│   │
│   ├── LEARNING CONTENT
│   │   ├── /courses              # Course catalog
│   │   ├── /courses/[slug]       # Course page
│   │   ├── /courses/[slug]/[module] # Module lesson
│   │   ├── /courses/[slug]/quiz  # Course quiz
│   │   ├── /library              # Article library
│   │   ├── /posts/[slug]         # Article page
│   │   ├── /practices            # Practice catalog
│   │   ├── /practices/[slug]     # Guided practice
│   │   └── /books                # Recommended books
│   │
│   ├── LEARNING PATHS
│   │   ├── /learn/paths          # Path catalog
│   │   ├── /learn/paths/[id]     # Individual path
│   │   └── /learning-paths       # Alternative view
│   │
│   ├── USER DASHBOARD
│   │   ├── /profile              # Main dashboard
│   │   ├── /profile/journal      # Journal + AI companion
│   │   ├── /profile/dreams       # Dream journal
│   │   ├── /profile/health       # Health/dimension tracking
│   │   ├── /profile/subscription # Subscription management
│   │   ├── /profile/ai-insights  # AI-detected patterns
│   │   └── /reading-list         # Saved articles
│   │
│   ├── AI & INTERACTIVE
│   │   ├── /chat                 # AI companion
│   │   └── /stuck                # "Where I'm Stuck" finder
│   │
│   ├── COMMERCE
│   │   ├── /pricing
│   │   ├── /shop
│   │   ├── /bundles
│   │   └── /free/[slug]          # Lead magnet pages
│   │
│   ├── CERTIFICATES
│   │   └── /certificate/[id]     # Verification page
│   │
│   ├── COMMUNITY
│   │   ├── /community
│   │   └── /connect
│   │
│   ├── TRANSPARENCY (9 pages)
│   │   ├── /transparency
│   │   ├── /transparency/methodology
│   │   ├── /transparency/deeper-work
│   │   ├── /transparency/standards
│   │   ├── /transparency/certificates
│   │   ├── /transparency/health-tracking
│   │   ├── /transparency/audits
│   │   └── /transparency/sources
│   │
│   ├── LEGAL
│   │   ├── /privacy
│   │   └── /terms
│   │
│   └── api/                      # 103 API routes
│       ├── AUTH & USER (10+)
│       │   ├── /auth/[...nextauth]
│       │   ├── /user/profile, /preferences, /ai-profile
│       │   ├── /user/shadow-patterns, /emotional-arc
│       │   └── /user/streaks, /export
│       │
│       ├── ASSESSMENT & HEALTH (12+)
│       │   ├── /assessment, /assessments
│       │   ├── /assessments/synthesis
│       │   ├── /health, /health/dimensions
│       │   └── /health/activity, /health/analyze
│       │
│       ├── CONTENT (10+)
│       │   ├── /courses, /courses/[slug]
│       │   ├── /course-progress
│       │   ├── /posts, /practices
│       │   └── /search
│       │
│       ├── AI CHAT (20+)
│       │   ├── /chat, /chat/stream
│       │   ├── /chat/conversations
│       │   ├── /chat/detect-mood, /detect-triggers
│       │   ├── /chat/learn-preferences
│       │   ├── /chat/suggest-articles, /suggest-practices
│       │   └── /chat/growth-timeline
│       │
│       ├── JOURNAL & DREAMS (15+)
│       │   ├── /journal, /journal/[id]
│       │   ├── /journal/companion, /insights, /patterns
│       │   ├── /dreams, /dreams/[id]
│       │   └── /dreams/interpret, /symbols
│       │
│       ├── AI VERIFICATION (4)
│       │   ├── /verification/gate
│       │   ├── /verification/journal
│       │   ├── /verification/skill-demo
│       │   └── /verification/simulation
│       │
│       ├── PAYMENTS (8+)
│       │   ├── /checkout, /checkout/verify
│       │   ├── /subscriptions/checkout, /subscriptions
│       │   ├── /credits/checkout, /credits
│       │   └── /webhook/stripe
│       │
│       └── OTHER (15+)
│           ├── /certificates, /quiz
│           ├── /recommendations
│           ├── /stuck, /reflections
│           └── /newsletter, /contact
│
├── content/                      # 912+ content pieces
│   │
│   ├── posts/                    # 201 articles (MDX)
│   │   ├── Attachment & Relationships
│   │   ├── Shadow & Inner Work
│   │   ├── Body & Nervous System
│   │   ├── Meaning & Mortality
│   │   └── Practices & Integration
│   │
│   ├── courses/                  # 92 courses, 579 modules
│   │   │
│   │   │ TIERS:
│   │   │ ├── intro (free)
│   │   │ ├── beginner ($0-29)
│   │   │ ├── intermediate ($29-79)
│   │   │ ├── advanced ($79-149)
│   │   │ └── flagship ($149+)
│   │   │
│   │   │ STRUCTURE (per course):
│   │   │ └── course-name/
│   │   │     ├── course.json    # Metadata, tier, spectrum stages
│   │   │     └── *.mdx          # Module content
│   │   │
│   │   └── EXAMPLES:
│   │       shadow-work-foundations, nervous-system-mastery,
│   │       attachment-repair, conscious-relationship,
│   │       death-contemplation, parts-work, boundaries,
│   │       breathwork-mastery, somatic-healing...
│   │
│   ├── practices/                # 13 guided practices
│   │   ├── box-breathing.mdx
│   │   ├── grounding-5-4-3-2-1.mdx
│   │   ├── physiological-sigh.mdx
│   │   ├── cold-water-activation.mdx
│   │   ├── shadow-dialogue.mdx
│   │   ├── shaking-release.mdx
│   │   ├── self-compassion-break.mdx
│   │   ├── anger-release.mdx
│   │   ├── orienting.mdx
│   │   ├── loving-kindness.mdx
│   │   ├── body-scan.mdx
│   │   ├── morning-intention.mdx
│   │   └── repair-conversation.mdx
│   │
│   ├── lead-magnets/             # 4 free resources
│   │   ├── shadow-work-prompts.md
│   │   ├── nervous-system-reset-checklist.md
│   │   ├── archetype-email-course.md
│   │   └── integration-starter-kit.md
│   │
│   └── products/                 # 5 standalone products
│
├── lib/                          # 60+ system files
│   │
│   ├── CORE INFRASTRUCTURE
│   │   ├── prisma.ts             # Database client
│   │   ├── env.ts                # Environment validation
│   │   ├── rate-limit.ts         # Rate limiting
│   │   ├── csrf.ts               # CSRF protection
│   │   ├── access.ts             # Course access control
│   │   └── sanitize.ts           # Input sanitization
│   │
│   ├── CONTENT LOADERS
│   │   ├── courses.ts            # Load courses from JSON + MDX
│   │   ├── posts.ts              # Load articles
│   │   ├── practices.ts          # Load practices
│   │   ├── lead-magnets.ts       # Lead magnets
│   │   ├── bundles.ts            # Content bundles
│   │   └── learning-paths.ts     # 17 curated learning paths
│   │
│   ├── assessment/               # Assessment Framework
│   │   ├── framework.ts          # 30 dimensions, 75+ facets
│   │   ├── types.ts              # PillarId, SpectrumStage types
│   │   ├── questions/            # ~205 questions
│   │   │   ├── mind.ts
│   │   │   ├── body.ts
│   │   │   ├── soul.ts
│   │   │   └── relationships.ts
│   │   ├── scoring.ts            # Score calculation
│   │   ├── portrait.ts           # User development portrait
│   │   ├── dimension-health.ts   # Freshness + estimated scores
│   │   ├── reassessment.ts       # Dimension reassessment
│   │   ├── content-mapping.ts    # Maps content → dimensions
│   │   └── activity-tracker.ts   # Activity → estimate updates
│   │
│   ├── ai-verification/          # AI Verification System
│   │   ├── types.ts              # Gate, rubric, verification types
│   │   ├── progress-gates.ts     # Progress gates + certificates
│   │   ├── journal-evaluator.ts  # Journal quality AI
│   │   ├── skill-demonstration.ts # Scenario-based skill tests
│   │   └── conversation-simulation.ts # Practice conversations
│   │
│   ├── AI SYSTEMS (15+ files)
│   │   ├── presence.ts           # AI context builder
│   │   ├── health-ai.ts          # AI health analysis
│   │   ├── dream-analysis.ts     # Dream interpretation
│   │   ├── journal-analysis.ts   # Journal analysis
│   │   ├── synthesis-analysis.ts # Combine assessments
│   │   ├── stuck-analysis.ts     # "Where I'm Stuck" AI
│   │   ├── emotional-arc.ts      # Emotional trajectory
│   │   ├── somatic-analysis.ts   # Body pattern analysis
│   │   ├── crisis-detection.ts   # Crisis detection
│   │   ├── crisis-coordinator.ts # Crisis response
│   │   ├── conversation-memory.ts # Persistent memory
│   │   ├── symbol-tracker.ts     # Dream symbol dictionary
│   │   ├── insights.ts           # Insight extraction
│   │   ├── realtime-learning.ts  # Learn from interactions
│   │   └── weekly-reflection.ts  # Weekly prompts
│   │
│   ├── HEALTH & LEARNING
│   │   ├── integration-health.ts # 4 pillars + stages
│   │   ├── longitudinal-analysis.ts # Track over time
│   │   └── cross-modal-patterns.ts # Cross-modality patterns
│   │
│   └── PAYMENTS
│       ├── stripe.ts             # Stripe client
│       └── subscriptions.ts      # Tier config + credits
│
├── components/                   # 71 UI components
│   │
│   ├── NAVIGATION & LAYOUT
│   │   ├── Navigation.tsx
│   │   ├── MobileNav.tsx
│   │   ├── Footer.tsx
│   │   ├── UserMenu.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── ASSESSMENTS & QUIZZES
│   │   ├── ArchetypeQuiz.tsx
│   │   ├── AttachmentStyleQuiz.tsx
│   │   ├── NervousSystemQuiz.tsx
│   │   ├── ShadowProfileQuiz.tsx
│   │   └── StartHereQuiz.tsx
│   │
│   ├── COURSE & LIBRARY
│   │   ├── CoursesGrid.tsx, CoursesFilters.tsx
│   │   ├── LibraryGrid.tsx, LibraryFilters.tsx
│   │   └── SpectrumVisual.tsx
│   │
│   ├── AI & COMPANION
│   │   ├── FloatingCompanion.tsx # Global AI assistant
│   │   ├── HomepageChat.tsx
│   │   └── AICompanionContext.tsx
│   │
│   ├── HEALTH & TRACKING
│   │   ├── QuickCheckIn.tsx
│   │   ├── WeeklyCheckIn.tsx
│   │   └── TodaysFocus.tsx
│   │
│   ├── verification/             # AI Verification UI
│   │   ├── VerificationGate.tsx
│   │   ├── SkillDemo.tsx
│   │   ├── SimulationChat.tsx
│   │   └── CertificateEligibility.tsx
│   │
│   └── course/                   # Interactive MDX components
│       ├── MDXComponents.tsx
│       ├── JournalPrompt.tsx
│       ├── ExerciseCheckbox.tsx
│       └── ExerciseList.tsx
│
└── prisma/
    └── schema.prisma             # 41 database models
        │
        ├── USER & AUTH (3)
        │   User, Account, UserProfile
        │
        ├── CONTENT PROGRESS (4)
        │   CourseProgress, ArticleProgress,
        │   ExerciseResponse, ReadingListItem
        │
        ├── CERTIFICATES (4)
        │   Certificate, QuizAttempt,
        │   AssessmentResult, AssessmentProgress
        │
        ├── HEALTH TRACKING (6)
        │   DimensionHealth, DimensionEstimate,
        │   GrowthActivity, DimensionReassessment,
        │   IntegrationHealth, PillarHealth
        │
        ├── JOURNALS & DREAMS (6)
        │   JournalEntry, DreamEntry, DreamSymbol,
        │   IntegrationCheckIn, SharedReflection,
        │   SharedReflectionResponse
        │
        ├── AI & CHAT (7)
        │   ChatConversation, ChatMessage,
        │   ConversationInsight, AICredits, AIUsage,
        │   TriggerPattern, ChatPreference
        │
        ├── PAYMENTS (3)
        │   Subscription, Purchase, CreditPurchase
        │
        ├── HEALTH SESSIONS (3)
        │   HealthSession, ReassessmentTrigger, QuickCheckIn
        │
        ├── STUCK PATTERNS (1)
        │   StuckPattern
        │
        ├── AI VERIFICATION (3)
        │   GateAttempt, VerificationSession, SimulationSession
        │
        └── INFRASTRUCTURE (1)
            RateLimitEntry
```

---

## Development Spectrum Framework

```
User Development Stages:
========================

COLLAPSE → REGULATION → INTEGRATION → EMBODIMENT → OPTIMIZATION
    │          │             │              │            │
    └──────────┴─────────────┴──────────────┴────────────┘
                        ↓
              Content is mapped to appropriate stages
              Users are assessed and matched to relevant content

4 PILLARS (each with 7-9 dimensions):
=====================================

🧠 MIND                    🏃 BODY
├── Shadow Work            ├── Nervous System
├── Inner Critic           ├── Breath
├── Emotional Intelligence ├── Somatic Awareness
├── Pattern Recognition    ├── Movement
├── Parts Work             ├── Energy Management
└── Cognitive Clarity      └── Embodiment

✨ SOUL                    💕 RELATIONSHIPS
├── Meaning & Purpose      ├── Attachment Patterns
├── Death Awareness        ├── Boundaries
├── Presence               ├── Communication
├── Spiritual Opening      ├── Intimacy
├── Transcendence          ├── Trust
└── Values                 └── Repair Skills

30 DIMENSIONS × 5 STAGES = 150 possible states
75+ FACETS for granular tracking
~205 ASSESSMENT QUESTIONS
```

### The Presence Dimension

Each stage has two versions—one with presence, one with avoidance. Presence isn't a destination after optimization; it's available at every stage.

| Stage | With Presence | With Avoidance |
|-------|---------------|----------------|
| Collapse | Surrender—allowing breakdown, accepting help | Drowning—thrashing, isolation |
| Regulation | Safety—grounding, building capacity | Numbing—avoiding sensation |
| Integration | Understanding—feeling through | Rumination—analysis without feeling |
| Embodiment | Aliveness—practice with awareness | Empty ritual—mechanical practice |
| Optimization | Flow—effortless action | Burnout—grinding → collapse |

---

## Learning Paths (17 Curated)

```
MIND PILLAR (5 paths):
├── shadow-integration
├── inner-critic-healing
├── emotional-intelligence
├── breaking-patterns
└── parts-work-journey

BODY PILLAR (4 paths):
├── nervous-system-regulation
├── embodiment-journey
├── breath-and-energy
└── movement-healing

SOUL PILLAR (4 paths):
├── finding-meaning
├── presence-practice
├── death-awareness
└── spiritual-opening

RELATIONSHIPS PILLAR (4 paths):
├── attachment-healing
├── conscious-relating
├── boundaries-mastery
└── intimacy-deepening
```

---

## Business Model

### Subscription (Single Tier)
```
Free               - 50 articles, 5 intro courses, free resources, no AI
Member ($19/month) - Everything: all courses, all articles, 500 AI credits/month
                     Yearly: $190 (2 months free)
```

### AI Credits
- Members: 500 monthly tokens
- Purchasable: $0.025 per credit (1,000 tokens)

### Certificate Tiers
- **Completion Records**: Intro, Beginner, Intermediate courses
- **Certificates of Achievement**: Advanced, Flagship courses (require 70%+ quiz)

---

## AI Features

### AI Verification System
- **Journal Evaluation**: AI assesses journal quality (depth, specificity, self-reflection)
- **Skill Demonstrations**: Scenario-based tests with rubrics
- **Conversation Simulations**: Practice difficult conversations with AI role-play
- **Progress Gates**: Quality-gated progression through courses

### AI Companion Features
- **Content Companion**: Context-aware help on articles/courses
- **Journal Companion**: Reflection prompts, insight extraction
- **Dream Interpretation**: Symbol analysis, waking life connections
- **"Where I'm Stuck"**: Resource finder + micro-commitments
- **Assessment Synthesis**: Combine assessments into integrated profile
- **Growth Timeline**: Visualize progress over time

---

## Integrations

| Service | Purpose |
|---------|---------|
| Stripe | Subscriptions, course purchases, AI credits |
| NextAuth + Google | Authentication |
| Supabase PostgreSQL | Database (41 models) |
| LM Studio | Local AI (configurable) |
| Vercel | Deployment + Analytics |
| ConvertKit | Email marketing (ready) |

---

## Working Philosophy

### The Deepest Layer

This platform points toward stillness. Presence. The direct experience of being.

Everything serves that. The courses, articles, AI tools—they're fingers pointing at the moon.

**Non-negotiable:**
- No bouncing animations competing with contemplative content
- No gamification that pulls attention outward
- No commercial urgency that fragments presence
- No visual noise during moments meant for stillness

### Presence in Design
- Interface should breathe
- Transitions slow enough to feel intentional
- White space is room to arrive
- Design for regulation, not stimulation

### Content Principles
- Depth over volume
- Free content genuinely valuable
- Premium goes deeper, more structured

### Brand Voice
Warm but not soft. Direct but not harsh. Practical mysticism.

---

## Future Development Areas

### Planned Improvements
- [ ] Custom learning path generator from assessment results
- [ ] Expanded practices library (currently 13, could be 50+)
- [ ] Book content (digital books based on course material)
- [ ] Improved user dashboard / workbench UI
- [ ] Content for all 150 dimension-stage combinations

### Removed
- [x] Giscus (GitHub comments—users aren't tech people)

---

## File Quick Reference

| Purpose | File |
|---------|------|
| Stripe client | `lib/stripe.ts` |
| Subscription config | `lib/subscriptions.ts` |
| Course loader | `lib/courses.ts` |
| Practice loader | `lib/practices.ts` |
| Article loader | `lib/posts.ts` |
| Learning paths | `lib/learning-paths.ts` |
| AI context | `lib/presence.ts` |
| Assessment framework | `lib/assessment/framework.ts` |
| Dimension health | `lib/assessment/dimension-health.ts` |
| AI verification | `lib/ai-verification/` |
| Database schema | `prisma/schema.prisma` |
| AI Companion | `app/components/FloatingCompanion.tsx` |
| Verification UI | `app/components/verification/` |
