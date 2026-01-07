# Dashboard/Workbench Improvements

## Current State Analysis

The existing profile dashboard at `/profile` already includes:

### Existing Components
1. **TodaysFocus** - Dynamic hero for returning users
2. **QuickCheckIn** / **WeeklyCheckIn** - Daily emotional check-ins
3. **ContinueJourney** - In-progress articles and courses
4. **StreakTracker** - Activity streaks
5. **SelfDiscovery** - Assessment access
6. **IntegrationHealth** - 4-pillar health visualization
7. **IntegrationCheckIn** - Weekly reflection
8. **Recommendations** - Personalized content suggestions
9. **WhereImStuck** - Help/support access
10. **CourseProgress** - Course completion tracking
11. **ReadingStats** - Reading analytics
12. **Certificates** - Earned certificates
13. **AICredits** - AI feature usage
14. **HealthNudges** - Proactive wellness prompts
15. **OnboardingPrompt** / **ReassessmentPrompt** - Contextual prompts

### Current Strengths
- Good section organization
- Responsive layout
- Collapsible sections for clutter reduction
- Quick access links
- Integration with assessment data

### Current Limitations
- No custom learning path integration
- Practices not featured prominently
- No "active path" progress visualization
- Limited personalization based on stage
- No quick-access practice finder by state
- No long-term progress visualization
- Missing gamification elements
- No community/social features

---

## Proposed Improvements

### 1. Active Learning Path Widget (Priority: HIGH)

**Purpose**: Surface the user's custom learning path front and center

**Location**: After "Continue Your Journey" section

**Features**:
- Current path title and description
- Visual progress bar (X of Y steps completed)
- Current step card with:
  - Step title
  - Content type (article/course/practice)
  - Estimated time
  - Direct link to content
- Next 2 steps preview
- "Generate New Path" button if no active path
- Quick skip/mark complete controls

**Implementation**:
```tsx
// app/profile/ActiveLearningPath.tsx
// Fetches from /api/learning-paths/custom
// Shows current CustomLearningPath with progress
```

---

### 2. Practice Finder Widget (Priority: HIGH)

**Purpose**: Quick access to the right practice based on current state

**Location**: After daily check-in section

**Features**:
- "How are you feeling?" quick selector:
  - Nervous system state (fight/flight, freeze, regulated)
  - Emotion (anxious, sad, angry, numb, overwhelmed)
- Shows 3 recommended practices based on selection
- Each practice shows:
  - Name
  - Duration
  - Intensity
  - Quick description
- "See all practices" link to /practices
- Remembers last selected state

**Implementation**:
```tsx
// app/profile/PracticeFinder.tsx
// Uses practice metadata (bestFor) to match user state
// Links to /practices/[slug]
```

---

### 3. Stage-Aware Dashboard Themes (Priority: MEDIUM)

**Purpose**: Visual cues that reflect user's development stage

**Features**:
- Subtle color theme changes based on overall stage:
  - Collapse: Warm, grounding tones
  - Regulation: Stabilizing earth tones
  - Integration: Balanced neutrals
  - Embodiment: Vibrant but calm
  - Optimization: Clean, refined
- Different "Today's Focus" suggestions per stage
- Stage-appropriate empty states and encouragements

**Implementation**:
- CSS custom properties for stage colors
- Logic in TodaysFocus to vary content

---

### 4. Long-Term Progress Visualization (Priority: MEDIUM)

**Purpose**: Show development over time

**Location**: New section or tab in IntegrationHealth

**Features**:
- Timeline graph showing score changes over weeks/months
- Per-pillar trend lines
- Milestone markers (completed courses, assessments)
- "Growth highlights" - biggest improvements
- Comparison: "You vs 3 months ago"

**Implementation**:
```tsx
// app/profile/ProgressTimeline.tsx
// Queries historical DimensionHealth records
// Uses lightweight charting (e.g., recharts or custom SVG)
```

---

### 5. Enhanced Quick Actions (Priority: MEDIUM)

**Purpose**: Faster access to common actions

**Location**: Header area (already exists, enhance)

**Additional Actions**:
- Start a practice (opens practice finder)
- Quick journal entry (modal)
- Report stuck/need help
- Today's recommended content

**Implementation**:
- Floating action button (FAB) on mobile
- Enhanced quick access grid

---

### 6. Dimension Focus Cards (Priority: MEDIUM)

**Purpose**: Surface specific dimensions needing attention

**Location**: After IntegrationHealth

**Features**:
- Shows 1-3 lowest scoring dimensions
- Each card shows:
  - Dimension name and score
  - Stage description
  - "Why this matters" insight
  - Direct link to relevant content
- Updates based on assessment data

**Implementation**:
```tsx
// app/profile/GrowthEdges.tsx
// Pulls from DimensionHealth, shows lowest 3
// Links to filtered content by dimension
```

---

### 7. Gamification Elements (Priority: LOW)

**Purpose**: Increase engagement through achievement tracking

**Features**:
- **Badges/Achievements**:
  - First assessment completed
  - 7-day streak
  - 30-day streak
  - 100 articles read
  - All pillars assessed
  - Reached Regulation in all pillars
  - Reached Integration in all pillars
  - etc.

- **XP/Points System**:
  - Reading articles = 10 XP
  - Completing courses = 50 XP
  - Daily check-in = 5 XP
  - Practice logged = 15 XP
  - Assessment = 100 XP

- **Levels**:
  - Based on XP
  - Unlocks features or content

**Implementation**:
- New Achievement model in Prisma
- Background job to check achievement criteria
- Badge display component

---

### 8. Social/Community Features (Priority: LOW)

**Purpose**: Connect users with similar journeys

**Features**:
- Anonymous "people like you" stats
- Optional journey sharing
- Discussion prompts based on content
- Study groups for courses
- Accountability partners

**Note**: Requires significant infrastructure and moderation

---

## Implementation Priority Order

### Phase 1: Core Improvements (Next Sprint)
1. **Active Learning Path Widget** - Direct integration with custom path feature
2. **Practice Finder Widget** - Surfaces new practices content
3. **Dimension Focus Cards** - Better use of assessment data

### Phase 2: Enhanced Visualization (Following Sprint)
4. **Stage-Aware Themes** - Polish and personalization
5. **Long-Term Progress Timeline** - Historical tracking
6. **Enhanced Quick Actions** - UX improvements

### Phase 3: Engagement (Future)
7. **Gamification** - Badges and streaks
8. **Social Features** - Community building

---

## Technical Notes

### API Endpoints Needed
- `GET /api/learning-paths/custom/active` - Get active learning path
- `GET /api/practices/recommend?state=X&emotion=Y` - Practice recommendations
- `GET /api/health/history` - Historical dimension scores
- `GET /api/achievements` - User achievements (future)

### Database Additions
- `CustomLearningPath` model (already added)
- `Achievement` model (future)
- `UserXP` model (future)

### Component Structure
```
app/profile/
├── ActiveLearningPath.tsx  (new)
├── PracticeFinder.tsx      (new)
├── GrowthEdges.tsx         (new)
├── ProgressTimeline.tsx    (new)
├── IntegrationHealth.tsx   (enhance)
├── ... existing components
```

---

## Mockup: New Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    PROFILE HEADER                           │
│  [Avatar] Name • On path since Month Year                   │
│  [Quick Actions: Journal | Practices | ...]                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   TODAY'S FOCUS                             │
│  Based on your stage: [Specific recommendation]             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────┬───────────────────────────────┐
│     DAILY CHECK-IN          │     PRACTICE FINDER           │
│  Quick + Weekly             │  "How are you feeling?"       │
│                             │  [State Selector]             │
│                             │  → Practice 1                 │
│                             │  → Practice 2                 │
│                             │  → Practice 3                 │
└─────────────────────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              ACTIVE LEARNING PATH                           │
│  "Your Integration Journey"                                 │
│  ████████░░░░░░░░░░ 40% complete (4 of 10 steps)           │
│                                                             │
│  Current Step: "Nervous System Basics" [Article]            │
│  Next: "Extended Exhale Practice" [Practice]                │
│                                                             │
│  [Continue] [Skip] [View Full Path]                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              CONTINUE YOUR JOURNEY                          │
│  In-progress articles and courses                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────┬───────────────────────────────┐
│   INTEGRATION HEALTH        │        GROWTH EDGES           │
│   4 Pillar Overview         │  • Emotional Regulation (32%) │
│   [Visualization]           │  • Attachment Patterns (35%)  │
│                             │  • Sleep Quality (38%)        │
│                             │  [See Recommendations]        │
└─────────────────────────────┴───────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              PROGRESS OVER TIME                             │
│  [Timeline Graph - Last 3 Months]                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          LEARNING PROGRESS (Collapsible)                    │
│  Courses | Articles | Certificates                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│          ACCOUNT & SETTINGS (Collapsible)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Success Metrics

- **Engagement**: Time on dashboard, return visits
- **Feature Usage**: Practice finder interactions, path completions
- **Progress**: Users moving up development stages
- **Retention**: Monthly active users, streak maintenance
- **Satisfaction**: User feedback, NPS

---

## Next Steps

1. Create `ActiveLearningPath.tsx` component
2. Create `PracticeFinder.tsx` component
3. Create `GrowthEdges.tsx` component
4. Update `page.tsx` to include new components
5. Test integration with existing assessment/health data
6. Gather user feedback
