# LUCOUS Phase 3.4 — Frontend Design Specification
## Component Hierarchy, Theme Tokens & Responsive Layouts

### 1. Existing Reused UI Components
Phase 3.4 strictly adheres to the established LUCOUS design system and tokens:
- `@/components/ui/button`: Buttons with default, outline, and destructive variants.
- `@/components/ui/card`: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- `@/components/ui/badge`: Status badges for drafts, published states, difficulty, and subjects.
- `@/components/ui/dialog`: Accessible modals for publishing confirmation.
- `@/components/ui/input`: Text inputs with active focus rings and border transitions.
- Lucide React: Semantic iconography (`KeyRound`, `Sparkles`, `BookOpen`, `Send`, `Check`, `Copy`, `Share2`, etc.).

### 2. Component Architecture
```
Teacher Dashboard:
src/components/teacher/
├── teacher-home.tsx                (Navigation with Published tab)
├── lesson-draft-editor.tsx         (Publish button + PublishConfirmationDialog)
├── assessment-editor.tsx           (Publish button + PublishConfirmationDialog)
├── publish-confirmation-dialog.tsx (Summary modal + access-code reveal)
├── access-code-display.tsx         (Copy code, share URL, preview action)
└── published-content-list.tsx      (Table of active codes + unpublish action)

Student Experience:
src/components/student/
├── student-home.tsx                (QUICK_ACTIONS includes "Enter Code")
├── access-page-view.tsx            (Page coordinator)
├── access-code-form.tsx            (Normalized code input + auto-verify from URL)
├── published-lesson-viewer.tsx     (Rich tabbed lesson and assessment viewer)
├── question-interaction.tsx        (Interactive grading & explanation reveal)
└── lesson-detail-view.tsx          (Route wrapper for /student/learn/[contentId])
```

### 3. Theme Compliance (Light & Dark Modes)
All Phase 3.4 elements utilize standard semantic CSS variables:
- `bg-background` and `text-foreground` for root containers.
- `bg-card` and `text-card-foreground` with `border-border/70` for content containers.
- `bg-primary/10 text-primary border-primary/20` for subject and category tags.
- `bg-purple-500/10 text-purple-600 dark:text-purple-400` for unique access code badges.
- `bg-emerald-500/10 text-emerald-600 dark:text-emerald-400` for published statuses and correct answers.
- `bg-destructive/10 text-destructive` for validation and quiz incorrect alerts.

### 4. Responsive Breakpoints & Accessibility
- **Mobile (< 640px):**
  - Full-width access code input with `text-xl` tracking.
  - Horizontally scrollable section tabs for lesson viewer (`overflow-x-auto`).
  - 1-column layouts for quiz options and summary cards.
- **Desktop (>= 640px):**
  - Centered `max-w-lg` access code card.
  - Multi-column grids for question options, key terms, and summary metrics.
  - Fixed-width stat strips in lesson viewer banner.
- **Accessibility:**
  - Standard HTML labels and `aria-describedby` error associations.
  - Keyboard navigable tab buttons and quiz answer selection.
  - Visible focus rings (`focus-visible:ring-1 focus-visible:ring-ring`).
