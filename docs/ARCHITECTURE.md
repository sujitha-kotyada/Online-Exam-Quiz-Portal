# System Architecture & Technical Design

This document details the software architecture, design patterns, security mechanisms, and authoritative timing model of the **Online Exam & Quiz Portal (Study Check)** built for the B.Tech Full Stack Web Development project.

---

## 1. High-Level Architecture Overview

The application follows the classic three-tier **MERN Stack** architecture:

```
[ Client Tier ]                [ Server Tier ]               [ Database Tier ]
React 19 + Vite (SPA)   <--->  Node.js + Express.js   <--->  MongoDB (Mongoose)
(Plain CSS Design Sys)         RESTful APIs + JWT            BSON Document Store
```

### Architectural Principles:
1. **Separation of Concerns:** Distinct separation between presentation (React SPA), application logic (Express controllers, services, middleware), and data persistence (Mongoose models).
2. **Authoritative Server Control:** The client is treated as untrusted. Exam timers, answer keys, scoring calculations, eligibility checks, and attempt limits are strictly enforced on the server.
3. **Stateless RESTful Communication:** Authentication utilizes JSON Web Tokens (JWT) carried in the `Authorization: Bearer <token>` header, making API services scalable and stateless.
4. **Idempotency & Resilience:** Submissions and answer synchronization operations are idempotent, preventing duplicate grade records and race conditions.

---

## 2. Directory & Component Structure

```
Online Exam & Quiz Portal/
├── client/                      # React 19 Single Page Application (Vite)
│   ├── src/
│   │   ├── api/                 # Axios HTTP client & API abstraction services
│   │   │   ├── axios.js         # Base Axios instance with auth interceptor
│   │   │   ├── authApi.js       # Auth endpoints
│   │   │   ├── examApi.js       # Exams & questions CRUD endpoints
│   │   │   ├── attemptApi.js    # Attempt lifecycle endpoints
│   │   │   └── resultApi.js     # Scoring and analytics endpoints
│   │   ├── components/          # Reusable presentation components
│   │   │   ├── Navbar.jsx       # Role-aware navigation header
│   │   │   ├── Footer.jsx       # Academic portal footer
│   │   │   ├── ProtectedRoute.jsx # Client-side route guard with role checks
│   │   │   ├── Timer.jsx        # Synchronized countdown timer with auto-submit
│   │   │   ├── QuestionPalette.jsx # Answered/unanswered navigation grid
│   │   │   ├── Modal.jsx        # Accessible dialog window
│   │   │   └── LoadingSpinner.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx  # Global authentication context & state
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx   # Shared layout wrapper
│   │   ├── pages/               # Routed page views
│   │   │   ├── LandingPage.jsx  # Hero, viva credentials & architectural highlights
│   │   │   ├── LoginPage.jsx    # Login with quick-fill demo buttons
│   │   │   ├── RegisterPage.jsx # Student registration
│   │   │   ├── NotFoundPage.jsx # 404 page
│   │   │   ├── student/         # Student role pages
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   ├── AvailableExams.jsx
│   │   │   │   ├── ExamDetails.jsx
│   │   │   │   ├── ExamAttempt.jsx  # Distraction-free exam screen
│   │   │   │   ├── ResultDetails.jsx
│   │   │   │   └── AttemptHistory.jsx
│   │   │   └── teacher/         # Teacher role pages
│   │   │       ├── TeacherDashboard.jsx
│   │   │       ├── MyExams.jsx
│   │   │       ├── CreateEditExam.jsx
│   │   │       ├── QuestionEditor.jsx
│   │   │       ├── ExamPreview.jsx
│   │   │       └── ExamSubmissions.jsx # Analytics & question diagnostics
│   │   ├── styles/
│   │   │   └── index.css        # Academic design tokens & responsive CSS
│   │   ├── App.jsx              # Router tree definitions
│   │   └── main.jsx             # React entry point
├── server/                      # Express.js REST API
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js            # Mongoose MongoDB connection manager
│   │   ├── controllers/         # HTTP request/response handlers
│   │   ├── middleware/          # JWT auth, role guard, error & validation
│   │   ├── models/              # User, Exam, Question, Attempt, Result
│   │   ├── routes/              # Modular REST endpoint routing
│   │   ├── services/            # Core business, scoring, and lifecycle logic
│   │   ├── validators/          # Express-validator input sanitizers
│   │   ├── utils/               # JWT token generator
│   │   ├── scripts/             # Teacher seeding & demo data generator
│   │   ├── app.js               # Express app setup, helmet, CORS, rate limiting
│   │   └── server.js            # HTTP server startup & graceful shutdown
│   └── tests/                   # Vitest unit and integration test suites
├── docs/                        # Architecture, DB, API, Testing docs
└── README.md                    # Root setup and execution documentation
```

---

## 3. Authoritative Timing & Exam Lifecycle Workflow

A central requirement is preventing client-side timing manipulation and ensuring student answers are resilient against browser refreshes.

```
       STUDENT CLIENT                           EXPRESS SERVER                      MONGODB
             │                                        │                                │
             │ 1. POST /api/exams/:id/start          │                                │
             ├───────────────────────────────────────>│ 2. Check eligibility & limits  │
             │                                        │    Calculate authoritative     │
             │                                        │    startedAt & deadline        │
             │                                        │    Create Attempt record       ├──────> Save Attempt
             │                                        │    Strip correctAnswer/keys    │
             │ 3. Return attempt & sanitized questions│                                │
             │<───────────────────────────────────────┤                                │
             │                                        │                                │
[Timer counts down from deadline]                     │                                │
[Answers auto-saved on selection]                     │                                │
             │                                        │                                │
             │ 4. PUT /api/attempts/:id/answers       │                                │
             ├───────────────────────────────────────>│ 5. Validate status & deadline  │
             │                                        │    Save answers to Attempt     ├──────> Update Attempt
             │<───────────────────────────────────────┤                                │
             │                                        │                                │
[Page Refresh / Network Glitch]                       │                                │
             │ 6. POST /api/exams/:id/start           │                                │
             ├───────────────────────────────────────>│ 7. Detect existing in-progress │
             │                                        │    attempt with active deadline│
             │ 8. Return ongoing attempt & answers    │                                │
             │<───────────────────────────────────────┤                                │
             │                                        │                                │
[Manual Click OR Timer Expiry]                        │                                │
             │ 9. POST /api/attempts/:id/submit       │                                │
             ├───────────────────────────────────────>│ 10. Mark Attempt 'submitted'   │
             │                                        │     Fetch actual correct keys  ├──────> Query Questions
             │                                        │     Evaluate score & counts    │
             │                                        │     Persist Result record      ├──────> Save Result
             │ 11. Return Final Score & Result        │                                │
             │<───────────────────────────────────────┤                                │
```

### Key Security Safeguards:
- **No Client Deadlines:** The client never dictates how much time remains. The countdown is computed via `Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))`.
- **Latency Grace Period:** A 30-second clock skew/network latency allowance is granted when saving answers, preventing network drops from penalizing legitimate submissions.
- **Answer-Key Confidentiality:** `correctAnswer` and `explanation` are removed using Mongoose query projections (`.select('-correctAnswer -explanation')`) on all student-facing endpoints.
- **Idempotent Submission:** If a student clicks submit multiple times, the server detects the `submitted` status and returns the already-calculated `Result` object without re-evaluating or inserting duplicate records.

---

## 4. Security & Hardening Matrix

| Security Layer | Implementation Detail | Purpose |
| :--- | :--- | :--- |
| **Password Storage** | `bcryptjs` with salt rounds = 10 | Resist rainbow-table and brute-force cracking |
| **Stateless Authentication** | Signed JWT with 24-hour expiration | Validated on every protected route |
| **Privilege Escalation** | `AuthService.register` forces `role: 'student'` | Prevents users from registering as teachers |
| **HTTP Security Headers** | `helmet` middleware | Mitigate XSS, clickjacking, MIME sniffing |
| **Rate Limiting** | `express-rate-limit` (300 requests / 15 mins) | Prevent DoS and credential brute-forcing |
| **CORS Restriction** | Configured for `CLIENT_URL` (localhost:5173) | Restrict cross-origin resource requests |
| **Input Validation** | `express-validator` | Sanitize and validate request payloads |
| **Data Confidentiality** | `toJSON` override on User model | Guarantees `passwordHash` is never leaked |
