# LUCOUS — Phase 3.4 Testing Checklist

## 1. Teacher Publishing & Access Codes
- [x] Teacher authentication guard (401 when no token)
- [x] Role authorization guard (403 when non-teacher attempts to publish)
- [x] Cross-teacher ownership guard (Teacher B cannot publish Teacher A's draft)
- [x] Draft validation before publication (rejects incomplete or malformed content)
- [x] Unambiguous, cryptographically random code generation (e.g. `LU-XXXXXX`)
- [x] Collision-handling and uniqueness enforcement
- [x] Atomic state update: `status: "PUBLISHED"`, `publishedAt`, `accessCode`
- [x] Access code retrieval in teacher published content list
- [x] Unpublishing / revoking immediately revokes student access

## 2. Student Access & Code Verification
- [x] Code normalization (handles lowercase, spaces, missing/present `LU-` prefix)
- [x] Unpublished drafts are never accessible via student code lookup (returns 404)
- [x] Non-existent code returns safe 404 error
- [x] Revoked content returns 404 error
- [x] Valid code returns published lesson or assessment with sanitized teacher info
- [x] Sensitive teacher info (email, password hash, internal IDs) is never exposed
- [x] Server-side answer verification (`POST /check-answer`) for Multiple Choice, True/False, Fill in Blank, and Matching
- [x] Explanations and source citations delivered upon answer check

## 3. UI, Themes & Responsiveness
- [x] Light mode: Crisp text contrast, clean borders, legible cards, accessible inputs
- [x] Dark mode: Dark background/card tokens, soft borders, high contrast text
- [x] Publish confirmation modal behaves properly in both themes
- [x] Access code display with copy-to-clipboard button and toast feedback
- [x] Interactive review questions with instant feedback states (success green, retry amber)
- [x] Mobile and desktop responsive layouts

## 4. Regressions
- [x] `node backend/test-assessment-generation.js` (Phase 3.3 suite)
- [x] `node backend/test-lesson-generation.js` (Phase 3.2 suite)
- [x] `node backend/test-teacher-upload.js` (Phase 3.1.1 suite)
- [x] `node backend/test-ai-tutor.js` (AI tutor suite)
- [x] `node backend/test-curriculum-ux.js` (Curriculum UX suite)
- [x] `npm.cmd run lint` (0 errors)
- [x] `npm.cmd run build` (Next.js production build passes)
