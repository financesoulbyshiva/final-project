# LUCOUS — Phase 5: Student Progress, Smart Assessment & Learning Improvement
## Comprehensive System & Gap Audit

**Date:** 2026-10-12  
**Starting Commit:** `9e53905` (`feat(phase-4): contextual AI tutor, verified videos and interactive games`)  
**Active Branch:** `feat/phase-5-student-progress`  
**Base Ancestry:** `9e53905` -> `1e3f60d` (Phase 3) -> `8210914` (Phase 2) -> `a53baee` (Phase 1)

---

## 1. Executive Summary

Phase 4 successfully delivered a contextual AI Tutor with multilingual pedagogy (EN, HI, MR, TE), verified YouTube videos with privacy-enhanced embeds and reporting, and three playable interactive games (Memory Match, Ordering Puzzle, and Timed Challenge) backed by curriculum data.

The goal of Phase 5 is to complete the full end-to-end **Student Learning Loop**:
$$\text{Login} \longrightarrow \text{Curriculum Selection} \longrightarrow \text{Learning Dashboard} \longrightarrow \text{AI Tutor / Videos / Games} \longrightarrow \text{Practice} \longrightarrow \text{Test} \longrightarrow \text{Results} \longrightarrow \text{Weak Topics} \longrightarrow \text{Retest} \longrightarrow \text{Improvement}$$

This audit inspects the existing code across Prisma models, backend route handlers (`backend/server.js`), curriculum services (`backend/curriculum-service.js`), frontend Next.js pages/components (`src/app/(dashboard)/student/*`, `src/components/student/*`), and automated test suites to establish what is already implemented, what has been empirically verified, what defects exist, and what exact gaps must be resolved.

---

## 2. Feature Status & Verification Matrix

| Area | Already Implemented | Verified by Automated Tests | Real Integration Verified | Confirmed Missing / Defect | Severity |
|---|---|---|---|---|---|
| **1. Curriculum & Learn Flow** | Cascading dropdowns (School & Diploma), session persistence, topic dashboard tabs | Yes (`test-education-dropdowns-phase3.js`, `test-student-learn-journey.js`) | Yes (In-memory + MongoDB verified) | No direct link to Practice / Test from the topic dashboard (student must re-pick topic) | Medium |
| **2. Contextual AI Tutor** | 4-part progressive pedagogy, 4 languages, thread continuity, 403 ownership guard | Yes (`test-ai-videos-games-phase4.js`) | Yes (Gemini provider + preview fallback) | Conversation reset on topic switch works; complete | None |
| **3. Curated Videos** | Allowlist, `youtube-nocookie` embeds, external search fallback, reporting API | Yes (`test-ai-videos-games-phase4.js`) | Yes | Complete | None |
| **4. Interactive Games** | 3 game types (`memory_match`, `ordering_challenge`, `timed_challenge`), XP caps, deduplication | Yes (`test-ai-videos-games-phase4.js`) | Yes | Complete | None |
| **5. Practice & Test Execution** | `StudentQuizPage` supporting `PLAY`, `PRACTICE`, `TEST`, `RETEST`; instant feedback (`/student/check`) | Partial (Fallback questions verified; `POST /api/student/attempts` untested) | Partial | 1. `/practice` and `/test` pages do not accept `searchParams.topicId`<br>2. `POST /api/student/attempts` crashes with `Malformed ObjectID` on fallback topic IDs<br>3. No answer deduplication in quiz attempts | **High** |
| **6. Results & Weak Topics** | `GET /api/student/results`, `GET /api/student/weak-topics` (threshold `< 60%`) | Partial | Partial | 1. No fallback store for attempts (empty when MongoDB unavailable or for non-ObjectId topics)<br>2. Boundary `< 60%` vs `= 60%` not tested<br>3. No retest improvement calculation (delta between initial test and retest) | **High** |
| **7. Progress & XP Engine** | `GET /api/student/progress`, `POST /api/student/progress`, user XP tracking | Partial (Lesson completion count verified) | Partial | 1. `POST /api/student/attempts` awards **0 XP**<br>2. No replay protection for repeated attempt submissions<br>3. Progress only tracks raw lesson counts, not subject/topic completion | **High** |
| **8. Teacher & Publishing** | Material upload, lesson/assessment drafting, access codes, teacher verification lifecycle | Yes (`test-teacher-approval.js`) | Yes | Complete | None |
| **9. Parent & Teacher Views** | `/api/parent/children`, `/api/parent/child/:id/overview`, `/api/teacher/students` | Partial | Partial | Complete for current phase requirements | Low |
| **10. Security & Ownership** | JWT auth, role guards, student isolation on AI tutor and parent linkages | Yes (`test-registration-and-profiles.js`, `test-teacher-approval.js`, `test-ai-videos-games-phase4.js`) | Yes | Cross-student attempt and progress negative tests missing | Medium |

---

## 3. Deep-Dive Audit Findings

### 3.1 Student Practice & Test Flow (`POST /api/student/attempts`)
* **Current Implementation:**
  In `backend/server.js` (lines 1322–1381):
  ```js
  const questions = await prisma.question.findMany({
    where: {
      topicId: String(topicId),
      id: { in: answers.map((a) => String(a.questionId)) },
    },
  });
  ```
* **Defect 1 (Curriculum Disconnect):**
  If `topicId` is an in-memory or fallback curriculum topic (e.g., `top_1`, `top_2`, `top_msbte_...`), `prisma.question.findMany` returns `[]`. There is no fallback to `getFallbackQuestionById(qId)`. Consequently, all answers are graded as incorrect (`correctCount = 0`), giving students 0% score even when their answers are 100% accurate.
* **Defect 2 (Crash on MongoDB ObjectId Coercion):**
  If `process.env.MONGODB_URI` is present and `topicId` or `req.userId` is not a 24-character hexadecimal ObjectId (e.g. `top_1`, `student-alpha`), `prisma.attempt.create` throws:
  `Malformed ObjectID: provided hex string representation must be exactly 12 bytes`.
  The endpoint returns a 500 Internal Server Error instead of saving the attempt.
* **Defect 3 (No Answer Deduplication):**
  The request payload is not deduplicated by `questionId`. A client could submit the same question multiple times to manipulate score calculations.
* **Defect 4 (No XP Awarded):**
  While `QuizRunner` informs students about points and XP, `POST /api/student/attempts` never increments `inMemoryUserXp` or `user.xp`. Assessments earn 0 XP.

### 3.2 Navigation & Preset Topic Handoff
* **Current Implementation:**
  - `src/app/(dashboard)/student/retest/page.tsx` correctly reads `searchParams`:
    ```tsx
    export default async function StudentRetestPage({ searchParams }) {
      const { topicId, mode } = await searchParams;
      const presetTopicId = topicId && topicId.trim() ? topicId : null;
      return <StudentQuizPage mode={mode === "PRACTICE" ? "PRACTICE" : "RETEST"} presetTopicId={presetTopicId} />;
    }
    ```
  - `src/app/(dashboard)/student/practice/page.tsx` and `test/page.tsx` do **NOT** accept or pass `searchParams`:
    ```tsx
    export default function StudentPracticePage() {
      return <StudentQuizPage mode="PRACTICE" />; // Missing presetTopicId!
    }
    ```
* **Impact:**
  When a student completes a topic in `TopicLearningDashboard` and wants to practice or test that specific topic, they are forced to go through the entire `TopicPicker` hierarchy again.

### 3.3 Weak Topics & Retest Intelligence (`GET /api/student/weak-topics`)
* **Current Implementation:**
  In `backend/server.js` (lines 1406–1448):
  ```js
  const latestByTopic = new Map();
  for (const attempt of attempts) {
    if (!latestByTopic.has(attempt.topicId)) {
      latestByTopic.set(attempt.topicId, attempt);
    }
  }
  const weakTopics = [...latestByTopic.values()]
    .filter((a) => a.score < 60)
    ...
  ```
* **Findings:**
  1. **Strict 60% Boundary:** A score `< 60` is classified as weak. A score of exactly `60%` is treated as passing/competent. This meets the spec, but must be formally locked in regression tests.
  2. **Persistence Fallback Missing:** If MongoDB is offline or if attempts were made using non-ObjectId topic IDs, `prisma.attempt.findMany` fails and returns a 500 error, resulting in an empty weak-topic list. An in-memory store (`inMemoryAttempts`) is required.
  3. **Missing Retest Improvement Tracking:**
     When a student takes a retest, the platform does not compare the retest score to the initial assessment. The student cannot see their learning growth (e.g. *Initial: 40% → Retest: 85% (+45% improvement)*).

### 3.4 Student Progress Engine & Overview (`GET /api/student/progress`)
* **Current Implementation:**
  Returns only `{ completedCount, totalContent }`.
* **Gaps:**
  - Does not return subject-level progress or topic-level completion status.
  - Does not return assessment statistics (tests taken, weak topics resolved, retest improvement average).
  - In `StudentHome`, the dashboard only displays a single lesson count bar rather than comprehensive progress across study material, tests, and weak-topic resolution.

### 3.5 Security & Data Ownership
* **Current Implementation:**
  - `requireStudent` middleware ensures only authenticated students can access `/api/student/*`.
  - Attempts are associated with `req.userId`.
* **Gaps:**
  - Negative test suite needed to verify that Student B cannot query or access Student A's `/api/student/results`, `/api/student/weak-topics`, or `/api/student/progress`.
  - Replay attacks: Rapid duplicate submissions of identical quiz answers must be deduplicated and idempotent.

---

## 4. Remediation Plan

### Stage 1: Student Progress Engine & Persistence Hardening (Phase 5.1)
1. Add `inMemoryAttempts = []` in `backend/server.js` with structured records:
   `{ id, userId, topicId, mode, correct, total, score, xp, createdAt }`.
2. Guard Prisma calls in `POST /api/student/attempts`, `GET /api/student/results`, `GET /api/student/weak-topics` with `isMongoId(req.userId)` and `isMongoId(topicId)`.
3. In `POST /api/student/attempts`:
   - Fall back to `getFallbackQuestionById(questionId)` if database lookup returns empty.
   - Deduplicate incoming answers by `questionId`.
   - Calculate verified XP: 10 XP per correct question + 15 XP bonus for passing score ($\ge 60\%$). Cap maximum XP per attempt at 100 XP.
   - Prevent replay duplicate award: Check recent attempts within the last 30 seconds for identical question-answer signatures.
   - Persist to both in-memory store and Prisma when valid MongoDB ObjectIds are present.

### Stage 2: Practice & Test Flow Integration (Phase 5.2)
1. Update `src/app/(dashboard)/student/practice/page.tsx` and `test/page.tsx` to accept `searchParams` and forward `presetTopicId`.
2. Add quick-action buttons in `src/components/student/topic-learning-dashboard.tsx`:
   - "Practice Topic" button linking directly to `/student/practice?topicId=${topic.id}`.
   - "Take Topic Test" button linking directly to `/student/test?topicId=${topic.id}`.
3. Enhance `QuizRunner` in `src/components/student/quiz-runner.tsx` to display XP awarded on results screen.

### Stage 3: Weak Topics & Retest Intelligence (Phase 5.3)
1. In `backend/server.js`:
   - Enhance `GET /api/student/weak-topics` to compute retest history and improvement delta:
     `{ topicId, topicName, chapterName, initialScore, latestScore, improvement, attemptsCount, action }`.
   - Ensure boundary test for exactly `60%` (not weak) and `59.9%` (weak).
   - If latest score on RETEST $\ge 60\%$, automatically remove topic from weak topics and mark as mastered.
2. In `src/components/student/results-view.tsx`:
   - Display retest improvement badges (e.g. `+30% Improved`).

### Stage 4: Enhanced Student Progress View (Phase 5.4)
1. Enhance `GET /api/student/progress` to return:
   - `completedCount`, `totalContent`.
   - `totalAttempts`, `averageScore`, `masteredTopicsCount`, `weakTopicsCount`.
   - `subjectProgress`: Array of subjects with completed topic counts and total topic counts.
2. Update `src/components/student/student-home.tsx` to surface subject-level progress, earned XP, and retest improvement without redesigning existing layouts.

### Stage 5: Curriculum Coverage & Automated Verification (Phase 5.5 – 5.7)
1. Write comprehensive test suite `backend/test-student-progress-phase5.js` covering:
   - Progress persistence and retrieval.
   - XP validation and duplicate submission prevention.
   - Practice and test scoring with question deduplication.
   - Weak-topic threshold (<60% vs =60%).
   - Retest tracking and improvement delta calculation.
   - Cross-student access isolation (negative tests).
   - Role restrictions.
   - Full regression across Phase 1–4 suites.
2. Run `npx tsc --noEmit` and `npm run build`.

---

## 5. Risk Assessment

* **Zero UI Redesign Constraint:** All changes in frontend components must exclusively use existing UI components (`Card`, `Badge`, `Progress`, `Button`, `Avatar`) and CSS utility classes.
* **Database Coexistence:** Support both live MongoDB Atlas deployments and offline in-memory mock modes seamlessly by guarding all Prisma queries with `isMongoId()`.
* **Idempotency:** Protect XP rewards from being multiplied by network retries or repeated submission requests.
