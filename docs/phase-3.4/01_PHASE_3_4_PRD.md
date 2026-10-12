# LUCOUS Phase 3.4 — Product Requirements Document (PRD)
## Teacher Content Review, Publishing, Unique Access Codes & Student Access

### 1. Problem Statement
In previous phases (3.1 - 3.3), teachers uploaded curriculum materials, and LUCOUS AI generated structured lesson drafts and assessments (practice sheets, tests, and gamified challenges). However, teachers had no mechanism to:
1. Inspect, fine-tune, and curate drafts before exposing them to learners.
2. Publish vetted educational materials with a simple, secure distribution mechanism.
3. Prevent students from accessing unreviewed or private draft content.
4. Allow students across India (mobile, tablet, desktop) to access published teacher content without complex onboarding or account linking, simply using a 6-character access code.

### 2. Product Objectives
- **Teacher Autonomy & Quality Assurance:** Enable teachers to review AI drafts, edit curriculum details, refine questions and explanations, and save changes without premature publishing.
- **Controlled Publication:** Explicit publication flow with summary review dialog, generating a cryptographically secure, unique 6-character code (`LU-XXXXXX`).
- **Seamless Student Access:** Lightweight student-facing access-code entry interface with auto-formatting, instant validation, rate-limiting protection, and rich lesson/test view.
- **Instant Interactive Feedback:** Students can practice comprehension and quiz questions directly within the viewer, receiving immediate grading and pedagogical explanations without exposing raw answers in advance.
- **Revocation & Access Hygiene:** Teachers can unpublish content at any time; revoked items immediately become inaccessible to students.

### 3. User Stories
#### Teacher Persona
- *Story T-1 (Review & Edit):* "As a teacher, I want to review AI-generated lesson drafts and assessments, modify titles, learning objectives, explanations, and questions so that the content matches my curriculum standards."
- *Story T-2 (Save Drafts):* "As a teacher, I want to save intermediate edits as drafts so I can return to them later without publishing incomplete work."
- *Story T-3 (Explicit Publishing):* "As a teacher, I want to see a publication summary and confirm publishing before generating a student access code."
- *Story T-4 (Access Code Sharing):* "As a teacher, I want a unique, memorable access code and shareable link with 1-click copy so I can distribute it via WhatsApp, SMS, or Google Classroom."
- *Story T-5 (Management & Revocation):* "As a teacher, I want a list of all my published content, their access codes, and the ability to unpublish if revisions are needed."

#### Student Persona
- *Story S-1 (Code Entry):* "As a student, I want to enter a simple 6-character code given by my teacher and immediately open the corresponding lesson or test."
- *Story S-2 (Curriculum Learning):* "As a student, I want to read clear, step-by-step lesson explanations, real-world examples, and key terms in my preferred theme (light or dark)."
- *Story S-3 (Interactive Practice):* "As a student, I want to attempt practice questions and receive instant grading and helpful explanations."
- *Story S-4 (Security & Privacy):* "As a student, I should never see teacher draft notes, other students' submissions, or leaked administrative IDs."

### 4. Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-1 | Teacher draft listing with ownership scoping | P0 | Implemented |
| FR-2 | Teacher lesson & assessment draft editing with save | P0 | Implemented |
| FR-3 | Server-side validation of draft completeness before publish | P0 | Implemented |
| FR-4 | Cryptographically secure 6-character unique access code (`LU-[2-9A-HJ-NP-Z]{6}`) | P0 | Implemented |
| FR-5 | Collision detection and retry loop | P0 | Implemented |
| FR-6 | Teacher confirmation dialog displaying content summary & access code | P0 | Implemented |
| FR-7 | One-click copy access code & shareable student URL | P0 | Implemented |
| FR-8 | Teacher published content list with unpublish revocation action | P0 | Implemented |
| FR-9 | Student access code verification API with sliding-window rate limiting | P0 | Implemented |
| FR-10 | Student access code form with auto-uppercase and query-param prefill | P0 | Implemented |
| FR-11 | Sanitized student payload (no teacher IDs, no raw answer keys) | P0 | Implemented |
| FR-12 | Interactive student question checking API (`/check-answer`) | P0 | Implemented |
| FR-13 | Responsive, accessible UI supporting Light and Dark modes | P0 | Implemented |

### 5. Non-Functional Requirements
- **Security:** Strict authorization prevents cross-teacher draft access. Server-side answer evaluation ensures student payloads contain zero leaked answer keys.
- **Reliability:** Dual persistence (Prisma MongoDB with in-memory fallback for local development or disconnected tests).
- **Abuse Prevention:** IP-based sliding window rate-limiting on student access endpoints to thwart brute-force guessing.
- **Performance:** Access-code lookups indexed uniquely (`@unique` in Prisma schema). Verification latency < 50ms.
- **Design Alignment:** Seamless integration with LUCOUS theme tokens, semantic color schemes, and responsive mobile-first typography.

### 6. Acceptance Criteria
1. Teachers can edit and save drafts without publishing.
2. Publishing generates a unique `LU-XXXXXX` access code only after backend confirmation.
3. Access code lookup fails gracefully for invalid codes, drafts, or unpublished content.
4. Valid access code returns only student-safe content.
5. Unpublishing immediately terminates access code resolution for students.
