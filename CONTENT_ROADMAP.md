# Integrated Human - Content & Monetization Roadmap

## Vision
Build a sustainable income through high-quality content on personal integration, combining free content (traffic + trust), one-time products (entry point), and subscription (recurring revenue).

**No 1:1 coaching for now** - focus on scalable content and products.

---

## Current State (Updated Dec 2024)

### Content
- 75+ articles across Mind, Body, Soul, Relationships
- Archetype quiz functional
- Start Here quiz functional
- Learning paths structure in place
- Newsletter signup ready (ConvertKit)

### Courses (COMPLETE - 35 TOTAL)
- **4 Flagship courses** ($197-$297):
  - The Integration Path (8 modules) - $247
  - Relationship Mastery (8 modules) - $297
  - Masculine Integration (8 modules) - $247
  - Feminine Embodiment (8 modules) - $247

- **31 Standard courses** ($47-$97) across categories:
  - Mind (9 courses): Shadow Work, Inner Critic, Emotional Intelligence, etc.
  - Body (8 courses): Nervous System, Somatic Awareness, Breathwork, etc.
  - Soul (8 courses): Purpose Discovery, Spiritual Bypassing, Death & Meaning, etc.
  - Relationships (6 courses): Attachment Repair, Boundaries, Communication, etc.

### Features Built
- [x] Course progress tracking (database + UI)
- [x] Profile page with completion badges
- [x] Homepage with featured courses section
- [x] Courses page grouped by category (including Flagship)
- [x] Module navigation with mark complete
- [x] Google OAuth authentication
- [x] Reading list & article progress tracking
- [x] **Stripe payment integration** - full checkout flow working
- [x] **Purchase verification** - client-side + webhook
- [x] **Purchased courses display** - in profile
- [x] **Lead magnets** - 4 downloadable resources with email capture
- [x] **Interactive exercises** - Journal, Checklist, Checkbox components in modules
- [x] **Quiz system** - Certificate gating with 70% pass requirement
- [x] **Learning paths** - Curated course sequences
- [x] **Mega menu navigation** - with Free resources link

### Still Needed
- [x] Standalone journaling in profile (view all journal entries, free-form journaling, daily prompts)

- [x] Course content gating (ModuleAccessGuard component - first module free, rest locked)
- [ ] Email sequences in ConvertKit (infrastructure ready)
- [ ] Digital workbooks (PDF products)
- [ ] AI guide/avatar (code exists but not deployed)


## Phase 1: Foundation - MOSTLY COMPLETE
*Goal: Build email list, create first lead magnets, fill content gaps*

### 1.1 Lead Magnets (Email Capture) - COMPLETE

| Lead Magnet | Format | Status |
|-------------|--------|--------|
| "Shadow Work Prompts" | Printable HTML/PDF | ✅ Built |
| "Nervous System Reset" | Printable HTML/PDF | ✅ Built |
| "Integration Starter Kit" | Printable HTML/PDF | ✅ Built |
| "Relationship Patterns Guide" | Printable HTML/PDF | ✅ Built |

All lead magnets accessible at `/free` with email capture via ConvertKit.

### 1.2 SEO Content (Traffic Drivers)

New articles targeting search volume:

| Article | Target Keywords | Status |
|---------|-----------------|--------|
| "How to Do Shadow Work: A Complete Guide" | shadow work | ✅ Exists |
| "Anxious Attachment: Signs and How to Heal" | anxious attachment | ✅ Exists |
| "Avoidant Attachment: Understanding the Pattern" | avoidant attachment | ✅ Exists |
| "Healing the Father Wound" | father wound | ✅ Exists |
| "Healing the Mother Wound" | mother wound | ✅ Exists |
| "Nervous System Regulation: A Practical Guide" | nervous system | ✅ Exists |
| "Psychedelic Integration: Before, During, After" | psychedelic integration | ✅ Exists |
| "Somatic Exercises for Anxiety" | somatic exercises | ✅ Exists |
| "Masculine Energy: What It Actually Means" | masculine energy | ✅ Exists |
| "Feminine Energy: Beyond the Stereotypes" | feminine energy | ✅ Exists |

### 1.3 High-Value Deep Content

| Article | Category | Status |
|---------|----------|--------|
| "Why You Choose Unavailable Partners" | Relationships | ✅ Exists |
| "Reclaiming Your Aggression" | Mind | ✅ Exists |
| "The Anger You Won't Let Yourself Feel" | Mind | ✅ Exists |
| "Dating After Trauma" | Relationships | ✅ Exists |
| "Post-Breakup Integration" | Relationships | ✅ Exists |
| "Career Burnout to Purpose" | Mind/Soul | ✅ Exists |
| "The Shame Beneath the Surface" | Mind | ✅ Exists |
| "Codependency vs. Healthy Attachment" | Relationships | ✅ Exists |
| "Disorganized Attachment: The Hidden Pattern" | Relationships | ✅ Exists |
| "When Meditation Doesn't Work" | Soul | ✅ Exists |

---

## Phase 2: First Products - MOSTLY COMPLETE
*Goal: Create entry-level paid products*

### 2.1 Digital Workbooks (One-Time Purchase) - NOT STARTED

| Product | Price | Description | Pages |
|---------|-------|-------------|-------|
| **Shadow Work Workbook** | $29 | 30-day journey with daily prompts, exercises, journaling | 50-60 |
| **Integration Journal** | $25 | Weekly framework for Mind/Body/Soul/Relationships check-ins | 40-50 |
| **Attachment Healing Workbook** | $29 | Identify patterns, repair exercises, relationship inventory | 45-55 |
| **Nervous System Reset Guide** | $19 | 14-day protocol with daily practices | 30-40 |

### 2.2 Assessments & Quizzes - PARTIAL

| Quiz | Status | Description |
|------|--------|-------------|
| **Archetype Assessment** | ✅ Complete | Identifies masculine/feminine archetypes |
| **Shadow Profile Quiz** | ✅ Complete | Identifies 8 shadow patterns with integration guidance |
| **Nervous System Check** | ✅ Complete | Polyvagal-based state assessment |
| **Start Here Quiz** | ✅ Complete | Entry point for new visitors |

Premium Reports (Future):
| Product | Price | Description |
|---------|-------|-------------|
| **Archetype Deep Dive Report** | $19 | Personalized 15-20 page PDF from quiz results |
| **Shadow Profile Report** | $25 | Extended shadow analysis with exercises |

### 2.3 Courses (One-Time Purchase) - COMPLETE

**35 courses total** with interactive exercises, quizzes, and certificates.

See CLAUDE.md for full course breakdown.

---

## Phase 3: Subscription Launch (Months 4-6)
*Goal: Launch membership for recurring revenue*

### 3.1 Membership Structure

**The Integration Path - $15/month or $120/year**

What members get:

**Monthly Content:**
- 1 Deep Dive article (3000+ words, exclusive)
- 1 Guided practice (audio meditation, breathwork, or somatic)
- 1 Integration exercise with worksheet
- Monthly theme with focus areas

**Library Access:**
- All past deep dives
- Practice library (growing monthly)
- All workbooks included (Shadow, Attachment, etc.)
- Private podcast feed with audio versions

**Community:**
- Private Discord channels
- Monthly themed discussions
- Accountability partner matching

### 3.2 First 12 Months Content Calendar

| Month | Theme | Deep Dive Topic | Practice |
|-------|-------|-----------------|----------|
| 1 | Foundations | "The Integration Framework" | Body scan meditation |
| 2 | Shadow | "The Golden Shadow: Gifts You've Buried" | Shadow dialogue exercise |
| 3 | Attachment | "Rewiring Your Attachment System" | Self-soothing practice |
| 4 | Body | "Trauma Lives in the Body" | Somatic release sequence |
| 5 | Masculine | "The King's Journey: Sovereignty" | Presence meditation |
| 6 | Feminine | "The Wild Woman: Reclaiming Instinct" | Movement practice |
| 7 | Relationships | "Why Your Relationships Repeat" | Pattern mapping |
| 8 | Emotions | "Anger as Ally" | Anger release practice |
| 9 | Purpose | "Finding Your Work" | Values clarification |
| 10 | Death | "Living with Mortality" | Death meditation |
| 11 | Integration | "When Parts Don't Fit" | Parts dialogue |
| 12 | Presence | "Beyond Self-Improvement" | Just sitting |

---

## Phase 4: Flagship Course - COMPLETE
*Goal: Create premium transformational offering*

### 4.1 The Integration Path Course - BUILT

**Price:** $247

**Format:** 8-week self-paced course with interactive exercises

All 4 flagship courses complete with full module content, quizzes, and certificate system.

---

## Phase 5: Expansion (Months 9-12+)
*Goal: Add specialized offerings*

### 5.1 Specialized Courses - COMPLETE

All specialized courses have been built as part of the 35-course library.

### 5.2 Additional Revenue Streams

- **Affiliate partnerships:** Therapy platforms, meditation apps, books
- **Sponsored content:** Aligned brands only
- **Licensed content:** Sell framework to coaches/therapists
- **Group programs:** (When ready) Cohort-based with community calls

---

## Content Creation Priority Queue

### Immediate (This Month)

1. [x] Lead magnet: "Shadow Work Prompts" PDF - COMPLETE
2. [x] Lead magnet: "Nervous System Reset" PDF - COMPLETE
3. [ ] Article: "Anxious Attachment: Signs and How to Heal"
4. [ ] Article: "Avoidant Attachment: Understanding the Pattern"
5. [ ] Article: "Healing the Father Wound"

### Next Month

6. [ ] Article: "Healing the Mother Wound"
7. [x] Article: "How to Do Shadow Work: A Complete Guide" - EXISTS
8. [ ] Article: "Why You Choose Unavailable Partners"
9. [ ] Email sequences for lead magnets in ConvertKit
10. [ ] Shadow Work Workbook (first draft)

### Month 3

11. [x] Article: "Nervous System Regulation: A Practical Guide" - EXISTS
12. [ ] Article: "Psychedelic Integration Guide"
13. [ ] Article: "Disorganized Attachment: The Hidden Pattern"
14. [ ] Shadow Work Workbook (complete)
15. [ ] Integration Journal (first draft)

---

## Revenue Projections

### Year 1 Goals (Conservative)

| Stream | Monthly | Annual |
|--------|---------|--------|
| Subscription (150 members × $15) | $2,250 | $27,000 |
| Workbooks (30/mo × $25 avg) | $750 | $9,000 |
| Standard courses (20/mo × $65 avg) | $1,300 | $15,600 |
| Flagship courses (8/mo × $265 avg) | $2,120 | $25,440 |
| Affiliates | $200 | $2,400 |
| **Total** | **$6,620** | **$79,440** |

### Year 2 Goals (Growth)

| Stream | Monthly | Annual |
|--------|---------|--------|
| Subscription (400 members × $15) | $6,000 | $72,000 |
| Products + Courses | $5,000 | $60,000 |
| Affiliates | $500 | $6,000 |
| **Total** | **$11,500** | **$138,000** |

---

## Tech Requirements

### For Payments - COMPLETE
- [x] Stripe checkout integration
- [x] Stripe Customer Portal for subscription management
- [x] Purchase verification (client-side + webhook)
- [x] Purchase tracking in database

### For Content Gating - COMPLETE
- [x] User authentication (Google OAuth)
- [x] Membership status check in Next.js (ModuleAccessGuard component)
- [x] Protected routes for premium course content (first module free, rest locked)
- [ ] Download protection for PDFs (pending workbook creation)

### For Email - PARTIAL
- [x] ConvertKit (already set up)
- [x] Lead magnet email capture
- [ ] Email sequences for each lead magnet
- [ ] Welcome sequence for new subscribers
- [ ] Launch sequences for products

### For Community - NOT STARTED
- [ ] Discord with role sync to Stripe
- [ ] Free tier vs Member tier channels

### For Courses - COMPLETE
- [x] Self-hosted in Next.js (chosen approach)
- [x] Course pages with module navigation
- [x] Progress tracking with database persistence
- [x] Completion badges on profile
- [x] Mark complete functionality
- [x] Payment integration with Stripe
- [x] Interactive exercises (Journal, Checklist, Checkbox)
- [x] Quiz system with certificate gating
- [x] Learning paths

---

## Notes

- All pricing is adjustable based on market response
- Start with fewer products, do them well
- Quality > quantity for content
- Build email list aggressively with lead magnets
- Free content should be genuinely valuable, not watered down
- Premium content goes deeper, more structured, more actionable

---

## Next Steps (Updated Dec 2024)

### Pre-Launch (Content Gating) - COMPLETE
1. ~~**Lock course content** - Gate modules behind purchase~~ DONE - ModuleAccessGuard component
2. **Test full purchase flow** - End-to-end verification

### Content
3. Write SEO-targeted articles (attachment styles priority)
4. Create workbook PDFs (Shadow Work, Integration Journal)
5. Set up email sequences in ConvertKit

### Technical
6. ~~Add interactive exercises to remaining course modules~~ COMPLETE - 226 MDX module files with exercises
7. AI guide integration (avatar work in progress)
