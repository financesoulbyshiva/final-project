# LUCOUS — Phase 3.4 API Contracts

## 1. Teacher Publishing Endpoints

### 1.1 POST `/api/teacher/publish`
Publishes a validated lesson draft or assessment draft and generates a unique access code.

- **Authentication**: Required (`Bearer <JWT>`, role: `TEACHER`)
- **Request Body**:
  ```json
  {
    "contentType": "lesson" | "assessment",
    "contentId": "string"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Content published successfully.",
      "accessCode": "LU-7K9M2P",
      "publishedAt": "2026-10-12T03:00:00.000Z",
      "content": {
        "id": "...",
        "title": "Laws of Motion",
        "status": "PUBLISHED",
        "accessCode": "LU-7K9M2P",
        "publishedAt": "..."
      }
    }
    ```
  - `400 Bad Request`: Incomplete or invalid draft content (fails schema validation).
  - `403 Forbidden`: Authenticated teacher does not own the requested content.
  - `404 Not Found`: Content ID does not exist.

### 1.2 POST `/api/teacher/unpublish`
Revokes published status and invalidates student access.

- **Authentication**: Required (`Bearer <JWT>`, role: `TEACHER`)
- **Request Body**:
  ```json
  {
    "contentType": "lesson" | "assessment",
    "contentId": "string"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Content unpublished successfully. Student access has been revoked."
    }
    ```

### 1.3 GET `/api/teacher/published`
Lists all published content and active access codes for the authenticated teacher.

- **Authentication**: Required (`Bearer <JWT>`, role: `TEACHER`)
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "published": [
        {
          "id": "...",
          "contentType": "lesson",
          "title": "Photosynthesis",
          "accessCode": "LU-7K9M2P",
          "publishedAt": "2026-10-12T03:00:00.000Z",
          "subject": "Biology",
          "topic": "Light Dependent Reactions",
          "itemCount": 5
        }
      ]
    }
    ```

---

## 2. Student Access Endpoints

### 2.1 POST `/api/student/access/verify`
Validates an access code and retrieves the published lesson or assessment.

- **Authentication**: Public / No auth required.
- **Request Body**:
  ```json
  {
    "code": "LU-7K9M2P"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "content": {
        "id": "published-id",
        "contentType": "lesson" | "assessment",
        "accessCode": "LU-7K9M2P",
        "title": "Laws of Motion",
        "description": "...",
        "subject": "Physics",
        "educationLevel": "school",
        "gradeOrSemester": "Class 10",
        "boardOrScheme": "CBSE",
        "topic": "Newton's First Law",
        "publishedAt": "2026-10-12T03:00:00.000Z",
        "teacherName": "Mr. Sharma",
        "lessonData": { ... },
        "assessmentData": { ... }
      }
    }
    ```
  - `400 Bad Request`: Code missing or malformed format.
  - `404 Not Found`: Code not found or content is currently an unpublished draft.
  - `429 Too Many Requests`: Rate limit exceeded for code verification attempts.

### 2.2 POST `/api/student/access/check-answer`
Validates a student's answer submission on the server and provides instant feedback with source citation.

- **Authentication**: Public / Student.
- **Request Body**:
  ```json
  {
    "accessCode": "LU-7K9M2P",
    "questionId": "q_1",
    "answer": "Law of Inertia"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "success": true,
      "isCorrect": true,
      "correctAnswer": "Law of Inertia",
      "explanation": "Newton's first law states that an object remains at rest unless acted upon by a net external force.",
      "sourceReference": "Section 3.1 Excerpt"
    }
    ```
