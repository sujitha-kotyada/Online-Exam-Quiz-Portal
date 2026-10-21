# Study Check

Study Check is a full-stack online examination and quiz portal built with the MERN stack. It provides separate experiences for students and faculty, timed assessments, automatic saving, server-authoritative timing, result analysis, and role-based access control.

## Features

### Students

- Register and sign in as a student.
- Browse published examinations.
- Take multiple-choice or subjective written-answer questions.
- Save answers automatically and submit manually or when time expires.
- Review scores, answer history, and performance details. Subjective scores remain provisional until faculty grading is complete.

### Faculty

- Register and sign in as a faculty member.
- Create, edit, publish, unpublish, and delete examinations.
- Add multiple-choice or subjective written-answer questions with marks, topics, answer keys, and grading guidance.
- Preview an examination before publishing it.
- Review submissions, manually grade written answers with feedback, and view question-level performance statistics.

## Technology

- **Frontend:** React 19, React Router, Vite, Axios, and custom CSS
- **Backend:** Node.js, Express, Mongoose, and MongoDB
- **Authentication:** JWT and bcrypt
- **Validation and security:** Express Validator, Helmet, CORS, and rate limiting
- **Testing:** Vitest, React Testing Library, Supertest, and MongoDB Memory Server

## Project structure

```text
.
├── client/          React frontend
├── server/          Express API and database layer
├── docs/             Architecture, API, database, and testing documentation
└── README.md
```

## Prerequisites

Install the following before starting:

- **Node.js** 18 or later (20 LTS or newer is recommended)
- **npm** 9 or later
- **MongoDB** 6 or later, either:
  - a local MongoDB server, or
  - a MongoDB Atlas cluster

Verify Node.js and npm:

```bash
node --version
npm --version
```

## Installation

Clone the repository or download the project, then open a terminal in the project directory.

Install backend dependencies:

```bash
cd server
npm install
```

Install frontend dependencies:

```bash
cd ../client
npm install
```

If you are using Windows PowerShell, the same commands work from the project folder. Use `cd ..` to move back to the project root when needed.

## Environment configuration

### Backend

Create `server/.env` by copying `server/.env.example`.

On macOS/Linux:

```bash
cp server/.env.example server/.env
```

On Windows PowerShell:

```powershell
Copy-Item server\.env.example server\.env
```

At minimum, configure the database connection and replace the JWT secret:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/online_exam_portal
JWT_SECRET=replace_with_a_long_random_secret_at_least_32_characters
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

Never commit `server/.env` or any real credentials to source control.

### MongoDB Atlas

For Atlas, replace `MONGODB_URI` with your Atlas connection string:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/online_exam_portal?retryWrites=true&w=majority
```

Make sure your Atlas database user has the required permissions and that your current IP address is allowed by the cluster network access rules.

### Frontend

The frontend uses `/api` by default, and the Vite development server proxies those requests to `http://localhost:5000`. This normally requires no extra configuration.

If the API is hosted elsewhere, create `client/.env` from `client/.env.example` and set:

```env
VITE_API_URL=https://your-api-host.example.com/api
```

## Running locally

Start MongoDB before starting the backend. Then use two terminals.

### Terminal 1: start the API

```bash
cd server
npm start
```

The API runs at <http://localhost:5000>. Its health endpoint is:

<http://localhost:5000/api/health>

For automatic server restarts during development:

```bash
npm run dev
```

### Terminal 2: start the frontend

```bash
cd client
npm run dev
```

Open the URL shown by Vite, normally <http://localhost:5173>.


- Do not commit `.env` files, passwords, tokens, or database connection strings.
- Use HTTPS and restrict database network access in production.
- Create separate non-production accounts for demonstrations and testing.

## License

This project is provided for educational and demonstration purposes.
