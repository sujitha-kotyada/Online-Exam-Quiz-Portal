# RESTful API Documentation

All API endpoints are prefixed with `/api`. Protected endpoints require an `Authorization: Bearer <jwt_token>` header.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register Student Account
- **Route:** `POST /api/auth/register`
- **Access:** Public (Strictly provisions `'student'` role)
- **Request Body:**
  ```json
  {
    "name": "Jane Student",
    "email": "jane@student.edu",
    "password": "Password@123"
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "token": "...", "user": { ... } }`
  - `400 Bad Request`: Validation failure (short password, invalid email format)
  - `409 Conflict`: Email already in use

### 1.2 User Login
- **Route:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "jane@student.edu",
    "password": "Password@123"
  }
  ```
- **Responses:**
  - `200 OK`: `{ "success": true, "token": "...", "user": { ... } }`
  - `401 Unauthorized`: Invalid credentials

### 1.3 User Logout
- **Route:** `POST /api/auth/logout`
- **Access:** Public
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Logged out successfully" }`

### 1.4 Get Profile (Me)
- **Route:** `GET /api/auth/me`
- **Access:** Private (`student` or `teacher`)
- **Responses:**
  - `200 OK`: `{ "success": true, "user": { "_id": "...", "name": "...", "email": "...", "role": "..." } }`
  - `401 Unauthorized`: Token missing or expired

---

## 2. Examination Endpoints (`/api/exams`)

### 2.1 List Exams
- **Route:** `GET /api/exams`
- **Access:** Private
- **Behavior:**
  - If requested by a **Teacher**: returns all exams created by this teacher.
  - If requested by a **Student**: returns all **published** exams available to take.
- **Responses:**
  - `200 OK`: `{ "success": true, "exams": [ { "_id": "...", "title": "...", "durationMinutes": 30, "questionCount": 5, "totalMarks": 10 } ] }`

### 2.2 Get Exam by ID
- **Route:** `GET /api/exams/:examId`
- **Access:** Private
- **Responses:**
  - `200 OK`: `{ "success": true, "exam": { ... } }`
  - `403 Forbidden`: Exam is in draft mode and requester is not the creating teacher.
  - `404 Not Found`: Exam does not exist.

### 2.3 Create Exam
- **Route:** `POST /api/exams`
- **Access:** Private (Teacher Only)
- **Request Body:**
  ```json
  {
    "title": "Data Structures Midterm",
    "description": "Topics: Stacks, Queues, Trees",
    "durationMinutes": 30,
    "maxAttempts": 2,
    "allowAnswerReview": true,
    "instructions": "Answer all questions. Auto-submits on timer expiry."
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "exam": { "status": "draft", ... } }`
  - `403 Forbidden`: Requester is a student.

### 2.4 Update Exam
- **Route:** `PUT /api/exams/:examId`
- **Access:** Private (Teacher Only — must own exam)
- **Responses:**
  - `200 OK`: `{ "success": true, "exam": { ... } }`
  - `403 Forbidden`: Non-owner teacher or student.

### 2.5 Delete Exam
- **Route:** `DELETE /api/exams/:examId`
- **Access:** Private (Teacher Only — must own exam)
- **Behavior:** Cascades delete to all questions, attempts, and results for this exam.
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Exam and all associated data deleted successfully" }`

### 2.6 Toggle Publish Status
- **Route:** `PATCH /api/exams/:examId/publish`
- **Access:** Private (Teacher Only — must own exam)
- **Behavior:** Toggles status between `'draft'` and `'published'`. Cannot publish if questionCount == 0.
- **Responses:**
  - `200 OK`: `{ "success": true, "exam": { "status": "published" } }`
  - `400 Bad Request`: Cannot publish exam without questions.

---

## 3. Question Bank Endpoints (`/api/exams/:examId/questions`)

### 3.1 List Questions for Exam
- **Route:** `GET /api/exams/:examId/questions`
- **Access:** Private
- **Security Guarantee:**
  - If requester is a **Teacher**: returns questions with `correctAnswer` and `explanation`.
  - If requester is a **Student**: `correctAnswer` and `explanation` are stripped via `.select('-correctAnswer -explanation')`.
- **Responses:**
  - `200 OK`: `{ "success": true, "questions": [ ... ] }`

### 3.2 Add Question to Exam
- **Route:** `POST /api/exams/:examId/questions`
- **Access:** Private (Teacher Only — must own exam)
- **Request Body:**
  ```json
  {
    "questionText": "What is the time complexity of binary search?",
    "options": [
      { "id": "opt_1", "text": "O(1)" },
      { "id": "opt_2", "text": "O(log N)" },
      { "id": "opt_3", "text": "O(N)" },
      { "id": "opt_4", "text": "O(N^2)" }
    ],
    "correctAnswer": "opt_2",
    "marks": 2,
    "topic": "Algorithms",
    "explanation": "Binary search halves search interval each step: O(log N)."
  }
  ```
- **Responses:**
  - `201 Created`: `{ "success": true, "question": { ... } }`

### 3.3 Update Question
- **Route:** `PUT /api/exams/:examId/questions/:questionId`
- **Access:** Private (Teacher Only — must own exam)
- **Responses:**
  - `200 OK`: `{ "success": true, "question": { ... } }`

### 3.4 Delete Question
- **Route:** `DELETE /api/exams/:examId/questions/:questionId`
- **Access:** Private (Teacher Only — must own exam)
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Question deleted successfully" }`

---

## 4. Assessment Attempt Endpoints (`/api/attempts` & `/api/exams/:examId/start`)

### 4.1 Start or Resume Exam Attempt
- **Route:** `POST /api/exams/:examId/start`
- **Access:** Private (Student Only)
- **Behavior:**
  - Checks if exam is `published` and within schedule.
  - Checks if student already has an active `in-progress` attempt. If yes, returns it with `isResumed: true` (ensuring refresh safety).
  - Verifies completed attempts < `maxAttempts`.
  - Creates Attempt with authoritative server `startedAt` and `deadline`.
  - Returns attempt session and questions without answer keys.
- **Responses:**
  - `200 OK`: `{ "success": true, "isResumed": false, "attempt": { ... }, "questions": [ ... ] }`
  - `403 Forbidden`: Max attempts reached.

### 4.2 Get Active Attempt Details
- **Route:** `GET /api/attempts/:attemptId`
- **Access:** Private (Student Only — must own attempt)
- **Responses:**
  - `200 OK`: `{ "success": true, "attempt": { ... }, "questions": [ ... ] }`
  - `403 Forbidden`: Attempt belongs to another student.

### 4.3 Save Candidate Answers
- **Route:** `PUT /api/attempts/:attemptId/answers`
- **Access:** Private (Student Only — must own attempt)
- **Request Body:**
  ```json
  {
    "answers": [
      { "questionId": "654321...", "selectedOption": "opt_2" }
    ]
  }
  ```
- **Behavior:** Checks deadline (+30s latency buffer). Merges answers into Attempt document.
- **Responses:**
  - `200 OK`: `{ "success": true, "message": "Answers saved successfully", "attempt": { ... } }`
  - `400 Bad Request`: Deadline expired.

### 4.4 Submit Exam Attempt
- **Route:** `POST /api/attempts/:attemptId/submit`
- **Access:** Private (Student Only — must own attempt)
- **Behavior:**
  - Idempotent: If attempt is already `submitted`, returns existing `Result`.
  - Sets `submittedAt = new Date()` and status = `'submitted'`.
  - Server evaluates each submitted option against trusted database question keys.
  - Computes score, total marks, percentage, correct/incorrect/unanswered counts.
  - Saves Result record and returns final score.
- **Responses:**
  - `200 OK`: `{ "success": true, "result": { "score": 8, "totalMarks": 10, "percentage": 80, ... } }`

---

## 5. Results & Analytics Endpoints (`/api/results` & `/api/exams/:examId/results`)

### 5.1 My Results History
- **Route:** `GET /api/results/my`
- **Access:** Private (Student Only)
- **Responses:**
  - `200 OK`: `{ "success": true, "results": [ ... ] }`

### 5.2 Get Result Details by ID
- **Route:** `GET /api/results/:resultId`
- **Access:** Private (Student owner OR Exam teacher)
- **Behavior:** If student requests and `allowAnswerReview` is `false`, correct answers and explanations are stripped from the response.
- **Responses:**
  - `200 OK`: `{ "success": true, "result": { ... } }`

### 5.3 Faculty Cohort Results & Question Diagnostics
- **Route:** `GET /api/exams/:examId/results`
- **Access:** Private (Teacher Only — must own exam)
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "exam": { ... },
      "analytics": {
        "totalSubmissions": 12,
        "averageScore": 7.5,
        "averagePercentage": 75.0,
        "highestScore": 10,
        "lowestScore": 4,
        "passRate": 83.33,
        "questionAccuracy": [
          {
            "questionId": "...",
            "questionText": "...",
            "totalAnswers": 12,
            "correctAnswers": 10,
            "accuracyPercentage": 83.33
          }
        ]
      },
      "results": [ ... ]
    }
    ```
