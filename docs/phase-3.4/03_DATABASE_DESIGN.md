# LUCOUS Phase 3.4 — Database Design & Schema Specifications
## MongoDB & Prisma Integration for Publishing and Access Codes

### 1. Existing Relevant Models
Prior to Phase 3.4, the schema in `backend/prisma/schema.prisma` contained:
- `UploadedMaterial`: Teacher uploaded source files.
- `LessonDraft`: AI-generated and teacher-edited lessons.
- `AssessmentDraft`: AI-generated and teacher-edited quizzes and games.

Both `LessonDraft` and `AssessmentDraft` had a `status` field typed as `String @default("DRAFT")`, but lacked:
- An authoritative student access code identifier.
- Publication timestamp tracking.
- Database-level uniqueness constraints for student access lookups.

### 2. Schema Changes Implemented
The schema in `backend/prisma/schema.prisma` was minimally and safely extended:

```prisma
model LessonDraft {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  teacherId          String   @db.ObjectId
  sourceMaterialId   String   @db.ObjectId
  sourceMaterialName String?
  title              String
  educationLevel     String?
  gradeOrSemester    String?
  boardOrScheme      String?
  subject            String
  chapter            String?
  topic              String?
  content            Json
  status             String   @default("DRAFT") // "DRAFT" | "REVIEWED" | "PUBLISHED"
  accessCode         String?  @unique           // Unique student access code (e.g., LU-7K9M2P)
  publishedAt        DateTime?                  // Timestamp when teacher published content
  aiProvider         String?
  aiModel            String?
  sourceWordCount    Int?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  teacher            User             @relation("TeacherLessons", fields: [teacherId], references: [id])
  sourceMaterial     UploadedMaterial @relation("MaterialLessons", fields: [sourceMaterialId], references: [id])

  @@index([teacherId])
  @@index([sourceMaterialId])
}

model AssessmentDraft {
  id                 String   @id @default(auto()) @map("_id") @db.ObjectId
  teacherId          String   @db.ObjectId
  sourceMaterialId   String   @db.ObjectId
  sourceMaterialName String?
  title              String
  contentType        String   @default("PRACTICE") // "PRACTICE" | "TEST" | "GAME"
  gameFormat         String   @default("QUIZ_SHOW")
  difficulty         String   @default("MEDIUM")
  questionCount      Int      @default(5)
  educationLevel     String?
  gradeOrSemester    String?
  boardOrScheme      String?
  subject            String
  chapter            String?
  topic              String?
  content            Json
  status             String   @default("DRAFT") // "DRAFT" | "REVIEWED" | "PUBLISHED"
  accessCode         String?  @unique           // Unique student access code (e.g., LU-8F4K2Q)
  publishedAt        DateTime?                  // Timestamp when teacher published content
  aiProvider         String?
  aiModel            String?
  sourceWordCount    Int?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  teacher            User             @relation("TeacherAssessments", fields: [teacherId], references: [id])
  sourceMaterial     UploadedMaterial @relation("MaterialAssessments", fields: [sourceMaterialId], references: [id])

  @@index([teacherId])
  @@index([sourceMaterialId])
}
```

### 3. Field Definitions & Constraints
| Field | Type | Constraint | Description |
|---|---|---|---|
| `accessCode` | String? | `@unique` | Format `LU-XXXXXX`. Authoritative code shared with students. `null` when draft/unpublished. |
| `publishedAt` | DateTime? | Optional | ISO timestamp when publishing occurred. Set to `null` upon revocation. |
| `status` | String | Default "DRAFT" | Values: `DRAFT`, `REVIEWED`, `PUBLISHED`. |

### 4. Indexing & MongoDB Uniqueness Strategy
- In MongoDB Prisma, `@unique` creates a unique sparse index on `accessCode`.
- MongoDB allows multiple documents to have `accessCode: null` when the unique index is sparse (or Prisma manages unique nulls).
- Explicit `@@index([accessCode])` was deliberately omitted to prevent MongoDB duplicate index declaration errors.
- Query performance for student access code lookups (`findUnique({ where: { accessCode } })`) is $O(1)$.

### 5. Dual Persistence Strategy (Production & In-Memory Fallback)
`backend/services/publishing-service.js` supports:
1. **Prisma Client Primary:** Direct MongoDB read/write with atomic updates.
2. **In-Memory Development/Test Store:** Seamless fallback when running offline unit tests or disconnected development, preventing test suite flakiness while enforcing identical integrity rules.

### 6. Migration and Rollback Safety
- **Non-destructive:** Added optional fields (`accessCode`, `publishedAt`) without dropping or altering existing collections.
- **Prisma Client Generated:** Generated cleanly via `npx prisma generate` (v6.19.3).
- **Rollback:** Fields can be ignored or dropped without breaking previous phase records or user data.
