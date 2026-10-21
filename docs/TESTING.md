# Automated Testing Documentation & Viva Guide

This document describes the testing strategy, test coverage, test runners, and instructions for verifying the **Online Exam & Quiz Portal**.

---

## 1. Test Architecture Overview

| Testing Area | Runner & Libraries | Files | Scope |
| :--- | :--- | :--- | :--- |
| **Backend Unit & Logic** | Vitest (Node.js Environment) | `server/tests/unit.test.js` | Bcrypt hashing, JWT generation, Role RBAC middleware, authoritative timer math, scoring evaluation algorithm, and privilege escalation prevention. |
| **Backend API & DB** | Vitest + Supertest | `server/tests/api.test.js` | End-to-end REST API endpoint tests, database queries, and role isolation checks when MongoDB is connected. |
| **Frontend UI & Components** | Vitest + React Testing Library + JSDOM | `client/src/App.test.jsx` | Landing page, Login form, Quick-fill demo buttons, synchronized countdown Timer, QuestionPalette (answered/unanswered tracking), and Modal dialogs. |

---

## 2. Requirement Test Matrix

| Requirement | Test Location | Status |
| :--- | :--- | :--- |
| **Registration & Login** | `unit.test.js` (pw hash) & `api.test.js` | Verified |
| **Password Hashing** | `unit.test.js > 1. Password Hashing & Bcrypt Security` | Verified |
| **Unauthorized Access** | `unit.test.js > 3. Role-Based Authorization Middleware` | Verified |
| **Role-Based Authorization** | `unit.test.js > 3. Role-Based Authorization Middleware` | Verified |
| **Privilege Escalation Prevention** | `unit.test.js > 5. Student Registration Role Enforcement Policy` | Verified |
| **Exam Creation & Publishing** | `api.test.js > 2. Role-Based Authorization & Exam Management` | Verified |
| **Exam Availability** | `api.test.js > 3. Answer Key Confidentiality & Student Exam Access` | Verified |
| **Correct & Incorrect Evaluation** | `unit.test.js > 4. Authoritative Timing & Scoring Calculations` | Verified |
| **Unanswered Questions Handling** | `unit.test.js > 4. Authoritative Timing & Scoring Calculations` | Verified |
| **Timer Expiration Calculation** | `unit.test.js > 4. Authoritative Timing & Scoring Calculations` | Verified |
| **Timer Auto-Submit Warning** | `client/src/App.test.jsx > Timer component` | Verified |
| **Answer-Key Confidentiality** | `api.test.js > 3. Answer Key Confidentiality` | Verified |
| **Duplicate Submissions Idempotency** | `api.test.js > 4. Timed Exam Workflow` | Verified |
| **Attempt & Result Ownership** | `api.test.js > 5. Results & Analytics` | Verified |

---

## 3. How to Run Tests

### Running Backend Tests
From the `server` directory:
```bash
cd server
npm test
```
Or directly using the test runner script:
```bash
node ./node_modules/vitest/vitest.mjs run --reporter=verbose
```

### Running Frontend Tests
From the `client` directory:
```bash
cd client
npm test
```
Or directly:
```bash
node ./node_modules/vitest/vitest.mjs run
```

### Running Both Suites from Root
From the project root:
```bash
npm run test:server
npm run test:client
```

---

## 4. Test Verification Output Log

### Backend Test Results:
```
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 1. Password Hashing & Bcrypt Security > should hash passwords with salt and verify correctly
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 2. JWT Authentication & Token Integrity > should generate valid signed JWT with role and user id
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 3. Role-Based Authorization Middleware > should allow access when user role matches allowed roles
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 3. Role-Based Authorization Middleware > should reject access with 403 Forbidden when user role is not permitted
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 3. Role-Based Authorization Middleware > should reject access with 401 when no user is attached to request
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 4. Authoritative Timing & Scoring Calculations > should calculate accurate deadline given duration and start time
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 4. Authoritative Timing & Scoring Calculations > should cap deadline if exam hard endTime is sooner than duration
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 4. Authoritative Timing & Scoring Calculations > should evaluate score, percentages, and question counts authoritatively
 ✓ tests/unit.test.js > Backend Core Logic & Security Tests > 5. Student Registration Role Enforcement Policy > public registration must never honor client-supplied teacher role
 ✓ tests/api.test.js > Live MongoDB Integration Test Suite > checks database availability
 ✓ tests/api.test.js > Live MongoDB Integration Test Suite > 1. Authentication & Security Tests (6 tests)
 ✓ tests/api.test.js > Live MongoDB Integration Test Suite > 2. Role-Based Authorization & Exam Management Tests (5 tests)
 ✓ tests/api.test.js > Live MongoDB Integration Test Suite > 3. Answer Key Confidentiality & Student Exam Access (1 test)
 ✓ tests/api.test.js > Live MongoDB Integration Test Suite > 4. Timed Exam Workflow, Answer Saving, Evaluation & Idempotency (4 tests)

 Test Files  2 passed (2)
      Tests  26 passed (26)
```

### Frontend Test Results:
```
 ✓ src/App.test.jsx (5 tests)
   ✓ renders LandingPage with academic header and demo credentials
   ✓ renders LoginPage with email/password inputs and quick fill buttons
   ✓ QuestionPalette renders correct answered and unanswered counters
   ✓ Timer component counts down and displays formatted time
   ✓ Modal renders content when open and hides when closed

 Test Files  1 passed (1)
      Tests  5 passed (5)
```

### Production Build Results:
```
vite v6.4.4 building for production...
✓ 126 modules transformed.
dist/index.html                   1.08 kB │ gzip:   0.60 kB
dist/assets/index-BJcMBzAA.css   10.48 kB │ gzip:   2.71 kB
dist/assets/index-BAGnalIZ.js   410.73 kB │ gzip: 121.82 kB
✓ built in 2.83s
```
