# VedaAI - AI Assessment Creator

VedaAI is a full-stack assessment platform for teachers to upload PDFs, generate assignments and MCQs with AI, create exams, share them through QR codes, and review student results in a dashboard.

## What it does

- Upload a PDF or question paper
- Generate descriptive questions and MCQs with AI
- Create an exam and issue a unique exam link / QR code
- Let students scan the QR, enter name and roll number, answer questions, and submit
- Store responses and show rankings / results in the teacher dashboard

## Current architecture

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Express + TypeScript + MongoDB + Redis
- Queue: BullMQ for background question generation
- Realtime: Socket.IO for progress updates
- AI: Groq and Google Gemini integrations
- PDF: Puppeteer, pdfjs-dist, and OCR support

## Repository layout

- `backend/` - Express API, models, services, routes, workers
- `frontend/` - Next.js app router UI, components, store, lib
- `uploads/` - Temporary uploaded files

## Core flow

Teacher flow:
1. Upload PDF
2. Generate questions or MCQs
3. Preview / edit questions
4. Create an exam
5. Share QR code
6. View submissions and rankings

Student flow:
1. Scan QR code
2. Open public exam page
3. Enter name and roll number
4. Answer questions
5. Submit the exam

## Routes

Teacher / protected routes:
- `/dashboard`
- `/upload`
- `/create-exam`
- `/exam-management`
- `/results`
- `/analytics`

Student / public routes:
- `/exam/[examId]`
- `/submit`
- `/thank-you`

Legacy student route support:
- `/quiz/[token]` remains as a backward-compatible alias

## API highlights

Backend endpoints of note:
- `POST /api/assignments`
- `GET /api/assignments`
- `GET /api/assignments/:id`
- `POST /api/mcq/:assignmentId/generate`
- `POST /api/mcq/:assignmentId/create`
- `GET /api/exam/:examId`
- `POST /api/exam/:examId/submit`
- `GET /api/mcq/:assignmentId/results`

## Environment variables

Backend:
- `PORT`
- `MONGODB_URI`
- `REDIS_URL`
- `CLIENT_URL`
- `FRONTEND_URL`
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `TEACHER_PASSWORD`
- `TEACHER_SESSION_SECRET`

Frontend:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SOCKET_URL`
- `BACKEND_URL` (optional rewrite target)
- `TEACHER_PASSWORD`
- `TEACHER_SESSION_SECRET`

## Local development

Backend:

```powershell
cd backend
npm install
npm run dev
```

Worker:

```powershell
cd backend
npm run worker
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

## Build commands

Backend:

```powershell
cd backend
npm run build
```

Frontend:

```powershell
cd frontend
npm run build
```

## Deployment notes

- Deploy the frontend to Vercel.
- Deploy the backend to Render or another Node host.
- Set `FRONTEND_URL` on the backend to the public frontend URL so QR codes point to the student exam page.
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` on the frontend to the deployed backend.
- If you redeploy the frontend after route changes, clear the build cache if Vercel keeps serving stale routes.

## Troubleshooting

- If the dev frontend shows stale or broken chunks, remove the `.next` cache and restart.
- If a QR code opens a 404, verify that the frontend deployment contains the `/exam/[examId]` route and that the backend QR regeneration script has been run.
- If port 3000 is busy, Next.js will fall back to another local port. Stop the old process or restart the dev server explicitly on `3000`.

## QR regeneration

The backend includes a helper script to regenerate stored QR codes so they point to the current public frontend route:

```powershell
cd backend
npm run regenerate-qrcodes
```

## Notes

- Teacher access is protected by a login gate in the frontend.
- Student submissions are stored with the exam ID, roll number, score, and timestamp.
- The public exam route is mobile-friendly and intended for QR scanning on phones.
