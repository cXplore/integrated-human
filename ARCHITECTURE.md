# Integrated Human - Learning Architecture

## The Core Framework

```
4 PILLARS → 30 DIMENSIONS → 75+ FACETS
     ↓
LEARNING PATHS (curated journeys)
     ↓
COURSES + ARTICLES + PRACTICES
     ↓
AI VERIFICATION → MEANINGFUL CERTIFICATES
```

---

## 1. THE FOUR PILLARS

| Pillar | Focus | Dimensions |
|--------|-------|------------|
| **Mind** | Psychology, cognition, emotions | 8 dimensions |
| **Body** | Somatic, physical, nervous system | 7 dimensions |
| **Soul** | Meaning, spirituality, authenticity | 8 dimensions |
| **Relationships** | Connection, attachment, intimacy | 9 dimensions |

---

## 2. THE 30 DIMENSIONS

### Mind Pillar (8)
1. Emotional Regulation
2. Cognitive Flexibility
3. Self-Awareness
4. Present-Moment Awareness
5. Thought Patterns
6. Psychological Safety
7. Self-Relationship
8. Meaning & Purpose

### Body Pillar (7)
1. Interoceptive Awareness
2. Stress Physiology
3. Sleep & Restoration
4. Energy & Vitality
5. Movement & Physical Capacity
6. Nourishment Relationship
7. Embodied Presence

### Soul Pillar (8)
1. Authenticity
2. Existential Grounding
3. Transcendent Connection
4. Shadow Integration
5. Creative Expression
6. Life Engagement
7. Inner Wisdom Access
8. Spiritual Practice

### Relationships Pillar (9)
1. Attachment Patterns
2. Relational Communication
3. Boundary Health
4. Conflict & Repair
5. Trust & Vulnerability
6. Empathy & Attunement
7. Intimacy & Depth
8. Social Connection
9. Relational Self-Awareness

**Full framework with facets:** `lib/assessment/framework.ts`

---

## 3. THE DEVELOPMENT SPECTRUM

Every dimension is scored on a 5-stage spectrum:

| Stage | Range | Description |
|-------|-------|-------------|
| Collapse | 0-20 | Crisis, survival mode |
| Regulation | 21-40 | Building stability |
| Integration | 41-60 | Connecting pieces |
| Embodiment | 61-80 | Natural expression |
| Optimization | 81-100 | Refinement, mastery |

**Key insight:** Presence is available at every stage. Without presence, you regress.

---

## 4. LEARNING PATHS

Learning paths are curated journeys through content, designed to develop specific dimensions.

### Tier 1: Comprehensive (8-12 weeks, AI-verified)
| Path | Key Dimensions | Flagship Course |
|------|----------------|-----------------|
| Attachment to Secure Love | Attachment, Conflict, Trust, Boundaries | relationship-mastery |
| Nervous System Mastery | Psychological Safety, Stress Physiology | nervous-system-mastery |
| Trauma to Wholeness | Safety, Self-Relationship, Shadow, Attachment | trauma-informed-healing |
| Psychedelic Integration | Transcendence, Shadow, Existential | consciousness-and-the-psychedelic-experience |
| Shadow Integration | Self-Awareness, Shadow, Self-Relationship | shadow-work-foundations |

### Tier 2: Focused (4-6 weeks)
- Anxiety Liberation
- Emotional Mastery
- Purpose Discovery
- Meditation & Presence
- Body Reconnection
- Boundaries & Codependency
- Self-Worth Reclamation

### Tier 3: Specialized (4 weeks)
- The Embodied Man
- The Sovereign Woman
- Breakup Recovery
- Grief & Loss
- Family Origins

### Tier 4: Comprehensive/Overlapping
- The Integrated Life (all pillars)
- The Healing Journey (trauma + attachment + shadow)
- Consciousness Expansion (spirituality + psychedelics + meditation)

**Current paths:** `lib/learning-paths.ts`

---

## 5. CONTENT TYPES

### Courses (92 total)
- **Location:** `content/courses/[slug]/`
- **Structure:** `course.json` + MDX modules
- **Tiers:** intro, beginner, intermediate, advanced, flagship
- **Tags:** Development Spectrum stages, dimensions

### Articles (201 total)
- **Location:** `content/posts/[slug].mdx`
- **Purpose:** Deep exploration, SEO, discovery

### Practices (13 total)
- **Location:** `content/practices/[slug].mdx`
- **Purpose:** Guided exercises (breathwork, grounding, etc.)

---

## 6. AI VERIFICATION SYSTEM (Built)

The goal: Certificates mean demonstrated competence, not just completion.

### Components

**1. Journal Quality Evaluation** (`lib/ai-verification/journal-evaluator.ts`)
- AI evaluates: Depth, Specificity, Self-Reflection, Pattern Recognition, Emotional Honesty
- Each criterion scored 0-100 with weighted average
- Result: Pass / Needs Depth / Try Again
- Provides specific feedback and follow-up prompts

**2. Skill Demonstration** (`lib/ai-verification/skill-demonstration.ts`)
- 5 scenarios: Repair, Boundary-setting, Emotional Regulation, Vulnerability, Shadow Recognition
- Each scenario has a detailed rubric with 4 criteria
- User presented with situation, responds in writing
- AI evaluates against 5-level rubric (Emerging → Masterful)

**3. Conversation Simulation** (`lib/ai-verification/conversation-simulation.ts`)
- AI plays roles: Anxious/Avoidant/Defensive Partner, Critical Parent, Inner Critic, Wounded Part
- 5 practice scenarios with different target skills
- Real-time turn-by-turn evaluation
- Skills practiced: repair, boundaries, regulation, vulnerability, shadow work

**4. Progress Gates** (`lib/ai-verification/progress-gates.ts`)
- Quality-gated module progression
- Gates configured per course in `VERIFIED_COURSES`
- Types: journal, pattern-map, skill-demo, simulation
- Retry with configurable delay (12-24 hours)

**5. Certificate Requirements**
- All gates passed
- Final assessment passed (3 scenarios, min 60% overall)
- Minimum time in course (e.g., 4 weeks)
- Practice entries logged
- Quiz score threshold

### API Endpoints
- `POST /api/verification/journal` - Evaluate journal entry
- `GET/POST /api/verification/skill-demo` - List/evaluate skill scenarios
- `GET/POST /api/verification/simulation` - List/manage simulations
- `GET/POST /api/verification/gate` - Check/submit gate attempts

### Implementation
- `lib/ai-verification/` - Core verification logic
- `app/api/verification/` - API routes
- Database models: `GateAttempt`, `VerificationSession`, `SimulationSession`

---

## 7. CONTENT MAPPING

Every piece of content maps to dimensions:

```typescript
// In course.json
{
  "dimensions": ["attachment-patterns", "conflict-repair"],
  "spectrum": ["regulation", "integration"]
}

// In article frontmatter
dimensions: ["self-awareness", "shadow-integration"]
```

**Mapping file:** `lib/assessment/content-mapping.ts`

---

## 8. USER HEALTH TRACKING

Two-layer system for tracking growth:

### Verified Scores
- From assessments only
- Decay over time (Fresh → Aging → Stale → Expired)
- User controls reassessment timing

### Estimated Scores
- From activity (courses, articles, practices)
- Auto-updated on completion
- Prompts reassessment when significantly above verified

**Implementation:** `lib/assessment/dimension-health.ts`

---

## 9. FILE STRUCTURE

```
lib/
├── assessment/
│   ├── framework.ts      # 30 dimensions, facets, research
│   ├── dimension-health.ts
│   ├── content-mapping.ts
│   └── activity-tracker.ts
├── learning-paths.ts     # Path definitions
├── courses.ts            # Course loading
├── posts.ts              # Article loading
└── practices.ts          # Practice loading

content/
├── courses/              # 92 courses
├── posts/                # 201 articles
└── practices/            # 13 practices

app/
├── courses/              # Course pages
├── posts/                # Article pages
├── practices/            # Practice pages
├── learn/                # Learning path pages
└── profile/health/       # Health dashboard
```

---

## 10. KNOWN REDUNDANCIES

| Topic | Current | Action |
|-------|---------|--------|
| Purpose/Meaning | 6 courses | Consolidate to 2 |
| Sleep | 2 courses | Consolidate to 1 |
| Breathwork | 2 courses | Consolidate to 1 |
| Death/Mortality | 2 courses | Consolidate to 1 |
| Family Systems | 2 courses | Consolidate to 1 |
| Psychedelics | 4+ courses | Clarify progression |

---

## 11. GAPS

| Gap | Status | Priority |
|-----|--------|----------|
| Nutrition course | Articles only | HIGH |
| AI verification | Built | DONE |
| More learning paths | 8 of ~20 | MEDIUM |
| UI for verification | Not built | HIGH |

---

## Related Docs

- **CLAUDE.md** - Agent context, tech stack, patterns
- **CONTENT_MAP.md** - Detailed content-to-dimension mapping
- **IDEAS.md** - Future possibilities
