# LUCOUS — Phase 3.4: Teacher Review, Publishing, Unique Access Codes & Student Access
## Implementation Plan

### 1. Overview & Objective
Phase 3.4 connects teacher-authored curriculum content to students through a complete, secure publication and distribution loop:
1. **Teacher Review & Edit**: Teacher reviews and edits AI-generated lessons and assessments.
2. **Publishing & Code Generation**: Teacher publishes validated content; server generates a cryptographically random, collision-resistant access code (e.g., `LU-7K9M2P`).
3. **Teacher Management**: Teacher views all published content, copies codes, and can revoke/unpublish access at any time.
4. **Student Access & Interaction**: Student enters code (or follows link with code), server validates and delivers published content, and student interacts with lessons, games, and questions with instant feedback.
5. **Theme Support**: Flawless light and dark mode experiences across all teacher and student touchpoints.

### 2. Architecture & Components
```
[ Teacher Dashboard ]
   │
   ├── Review & Edit (LessonDraftEditor / AssessmentEditor)
   ├── Publish Confirmation Dialog (PublishConfirmationDialog)
   └── View & Copy Access Code (AccessCodeDisplay / PublishedContentList)
         │
         ▼ POST /api/teacher/publish
[ Backend: Publishing & Access Code Service ]
   ├── Validate content schema (publishing-validator.js)
   ├── Verify teacher ownership
   ├── Cryptographic random code generation (access-code-service.js)
   └── Atomic persistence (status: "PUBLISHED", accessCode, publishedAt)
         │
         ▼
[ Database / Prisma ]
   ├── LessonDraft (status, accessCode, publishedAt)
   └── AssessmentDraft (status, accessCode, publishedAt)
         │
         ▲ POST /api/student/access/verify
[ Student Interface ]
   ├── Enter Code (AccessCodeForm at /student/access)
   └── Interactive Content Viewer (PublishedLessonViewer / QuestionInteraction)
```

### 3. Key Milestones
- **Milestone 1: Database Schema & Client Types**: Add `accessCode` and `publishedAt` to `LessonDraft` and `AssessmentDraft` in `schema.prisma`. Add types in `src/types/published-content.ts` and `src/lib/api.ts`.
- **Milestone 2: Backend Publishing & Access Code Services**: Implement `access-code-service.js`, `publishing-validator.js`, and `publishing-service.js`.
- **Milestone 3: Backend Routers**: Implement `teacher-publishing.js` and `student-access.js`; register in `backend/server.js`.
- **Milestone 4: Teacher UI Components**: Implement `PublishConfirmationDialog`, `AccessCodeDisplay`, `PublishedContentList`, and integrate into `LessonDraftEditor` and `AssessmentEditor`.
- **Milestone 5: Student UI Components & Routes**: Implement `AccessCodeForm`, `PublishedLessonViewer`, `QuestionInteraction`, `/student/access`, and `/student/learn/[contentId]`.
- **Milestone 6: Dark Mode / Light Mode Audit**: Verify all controls, dialogs, inputs, and cards across both themes.
- **Milestone 7: Comprehensive Testing & Regressions**: Create `backend/test-publishing-and-access.js` covering auth, ownership, codes, publication lifecycle, student access, answer verification, and theme validation.
