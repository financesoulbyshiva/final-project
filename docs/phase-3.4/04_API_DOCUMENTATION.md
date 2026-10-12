# LUCOUS Phase 3.4 — API Documentation
## Teacher Publishing Endpoints & Student Access Endpoints

### 1. Teacher Publishing Endpoints (`/api/teacher`)

#### `POST /api/teacher/publish`
Publishes an approved lesson draft or assessment draft and generates a unique student access code.

- **Authentication:** Required (Bearer Token)
- **Role Required:** `TEACHER`
- **Request Body:**
  ```json
  {
    "contentType": "LESSON", // or "ASSESSMENT"
    "contentId": "6724a8bc34f9a1234567890a"
  }
  ```
- **Validation Rules:**
  - `contentType` must be `"LESSON"` or `"ASSESSMENT"`.
  - `contentId` must be a valid, existing draft owned by the authenticated teacher.
  - Draft must be complete (valid learning objectives, explanation steps, review questions or quiz questions).
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Lesson published successfully.",
      "contentId": "6724a8bc34f9a1234567890a",
      "contentType": "LESSON",
      "title": "Introduction to Photosynthesis",
      "accessCode": "LU-7K9M2P",
      "status": "PUBLISHED",
      "publishedAt": "2026-10-12T03:30:00.000Z"
    }
    ```
  - `400 Bad Request`: Validation failure (missing required content fields).
  - `401 Unauthorized`: Missing or invalid token.
  - `403 Forbidden`: User role is not TEACHER.
  - `404 Not Found`: Draft does not exist or belongs to another teacher.

---

#### `POST /api/teacher/unpublish`
Revokes publication of a lesson or assessment, clearing the access code and terminating student access immediately.

- **Authentication:** Required (Bearer Token)
- **Role Required:** `TEACHER`
- **Request Body:**
  ```json
  {
    "contentType": "LESSON",
    "contentId": "6724a8bc34f9a1234567890a"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Content unpublished successfully. Student access has been revoked.",
      "contentId": "6724a8bc34f9a1234567890a",
      "status": "REVIEWED"
    }
    ```
  - `404 Not Found`: Content not found or not owned by teacher.

---

#### `GET /api/teacher/published`
Retrieves all published lessons and assessments owned by the authenticated teacher.

- **Authentication:** Required (Bearer Token)
- **Role Required:** `TEACHER`
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "count": 2,
      "items": [
        {
          "id": "6724a8bc34f9a1234567890a",
          "contentType": "LESSON",
          "title": "Introduction to Photosynthesis",
          "subject": "Biology",
          "chapter": "Life Processes",
          "topic": "Photosynthesis",
          "accessCode": "LU-7K9M2P",
          "publishedAt": "2026-10-12T03:30:00.000Z",
          "summary": "Light dependent and Calvin cycle reactions."
        }
      ]
    }
    ```

---

### 2. Student Access Endpoints (`/api/student/access`)

#### `POST /api/student/access/verify`
Looks up published content by access code with sliding-window rate limiting. Returns sanitized, student-safe payload.

- **Authentication:** Public (No token required)
- **Rate Limit:** 25 requests per IP per minute
- **Request Body:**
  ```json
  {
    "code": "LU-7K9M2P" // Also accepts "lu-7k9m2p" or "7k9m2p"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "item": {
        "contentType": "LESSON",
        "contentId": "6724a8bc34f9a1234567890a",
        "title": "Introduction to Photosynthesis",
        "subject": "Biology",
        "chapter": "Life Processes",
        "topic": "Photosynthesis",
        "accessCode": "LU-7K9M2P",
        "publishedAt": "2026-10-12T03:30:00.000Z",
        "content": {
          "title": "Introduction to Photosynthesis",
          "summary": "Light dependent and Calvin cycle reactions.",
          "learningObjectives": ["Understand chlorophyll role", "Identify light reaction steps"],
          "explanationSteps": [
            {
              "stepNumber": 1,
              "heading": "Light Absorption",
              "explanation": "Chlorophyll pigments absorb photons in thylakoid membranes."
            }
          ],
          "sourceGroundedExamples": [],
          "keyTerms": [],
          "reviewQuestions": [
            {
              "id": "q-1",
              "question": "Which organelle houses photosynthesis?",
              "hasAnswer": true
            }
          ]
        }
      }
    }
    ```
  - `400 Bad Request`: Code parameter missing or empty.
  - `404 Not Found`:
    ```json
    {
      "success": false,
      "message": "Invalid access code, or this content is not currently published."
    }
    ```
  - `429 Too Many Requests`: Exceeded rate limit.

---

#### `POST /api/student/access/check-answer`
Evaluates a student's answer against the securely stored answer key on the server.

- **Authentication:** Public (No token required)
- **Rate Limit:** 25 requests per IP per minute
- **Request Body:**
  ```json
  {
    "code": "LU-7K9M2P",
    "questionId": "q-1",
    "studentAnswer": "Chloroplast"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "questionId": "q-1",
      "isCorrect": true,
      "correctAnswer": "Chloroplast",
      "explanation": "Photosynthesis occurs exclusively within plant chloroplasts.",
      "sourceReference": "Chapter 6, Page 92"
    }
    ```
  - `404 Not Found`: Invalid access code or non-existent question ID.
