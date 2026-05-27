# VedaAI — AI Assessment Creator

TL;DR
- VedaAI converts uploaded documents into structured question papers (descriptive + MCQs), runs live quizzes, records student responses, and provides leaderboards.

**Features**
- **Document-to-questions:** Upload PDF/text and auto-generate sections and questions (descriptive + MCQs).
- **AI Ensemble:** Uses Groq + Google Gemini models for question and distractor generation with sanitization and deduplication.
- **MCQ generation:** AI-backed options with inferred `correctAnswer` when confident and shareable links (QR support).
- **Background worker:** Asynchronous generation via Redis + BullMQ so the API stays responsive.
- **Real-time UI:** Socket.IO updates for job progress and notifications.
- **Quiz flow + ranking:** Students enter name/roll, take quizzes, and see rankings.
- **Robust parsing:** PDF parsing with OCR fallback and sentence-based chunking to avoid mid-word splits.

**System Architecture (high-level)**
- **Frontend (Next.js + Tailwind):** Dashboard, assignment creation, quiz UI and ranking pages.
- **Backend (Express + TypeScript):** REST + WebSocket API exposing assignments, MCQs and quiz endpoints.
- **Worker process:** Consumes BullMQ jobs (question generation, MCQ assembly, PDF export).
- **Queue (BullMQ + Redis):** Reliable background job processing and retry.
- **Database (MongoDB):** Persist assignments, MCQ sets, student responses and metadata.
- **AI Service:** Orchestrates calls to Groq and Gemini, sanitizes outputs and dedupes results.

**Tech Stack & Purpose**
- **Next.js (React + TypeScript):** UI, routing and SSR/SSG where appropriate.
- **Tailwind CSS:** Styling and design tokens (see `frontend/src/app/globals.css`).
- **Express + TypeScript:** API layer, auth hooks, and WebSocket integration.
- **Socket.IO:** Real-time progress and notifications.
- **BullMQ + Redis:** Background job queue for CPU/IO-bound AI tasks.
- **MongoDB:** Persistent storage for assignments and student responses.
- **pdfjs-dist, tesseract, canvas:** Document parsing and OCR.
- **Groq / Google Gemini:** Primary AI models for generation (replaceable/configurable).

**Repository Layout (important folders)**
- `backend/` — Express server, routes, services, workers, models and AI orchestration.
- `frontend/` — Next.js app, components, styles and pages.
- `uploads/` — Temporary uploaded files used for parsing.

**Environment (common vars)**
- `MONGODB_URI` — MongoDB connection string
- `REDIS_URL` — Redis connection string (used by BullMQ)
- `PORT` — Backend port (default `5000`)
- `CLIENT_URL` / `FRONTEND_URL` — Frontend origin(s) for CORS and share links
- `GROQ_API_KEY`, `GEMINI_API_KEY` — AI provider credentials

**Local Setup (quick)**
- Backend

```powershell
cd backend
npm install
cp .env.example .env   # set MONGODB_URI, REDIS_URL, CLIENT_URL, API keys
npm run build
npm start
```

- Worker (optional, runs via start script concurrently)

```powershell
cd backend
# run worker directly if needed
node dist/workers/questionGenerator.js
```

- Frontend

```powershell
cd frontend
npm install
npm run dev     # starts on 3000 (or next free port)

npm start        # serve production build
```

**Common commands**
- Run backend dev: `npm run dev` (from `backend/`)
- Build backend: `npm run build` (from `backend/`)
- Start backend + worker: `npm start` (from `backend/`)
- Run frontend dev: `npm run dev` (from `frontend/`)

**Troubleshooting**
- If the dev frontend shows a blank page because of stale dev artifacts, remove the `.next` cache and rebuild:

```powershell
cd frontend
Remove-Item -Recurse -Force .next
npm run build
```

- If `Port 3000` is in use, Next will pick another port (e.g. `3001`) — either free 3000 or use the provided port.
- If you see `Cannot find module './xxx.js'` or `Unexpected end of JSON input` in dev, clean `.next` and restart the dev server.
- For CORS issues ensure `CLIENT_URL` includes your frontend origin and the backend sets `app.options('*', cors())`.

**AI & Quality notes**
- The AI pipeline uses an ensemble (Groq + Gemini) with prompt sanitization and deduplication to avoid verbatim source text and improve distractor diversity.
- MCQ generation tries to provide `correctAnswer` when confident; otherwise a safe template fallback is used.

**Deployment notes**
- Frontend: recommended deploy to Vercel (set `NEXT_PUBLIC_API_URL` to backend). Use the production Vercel URL in `CLIENT_URL` for share/QR links.
- Backend + Worker: deploy together (Render, Heroku, or similar). Ensure Redis and MongoDB are configured and both server + worker processes are started (concurrently or process manager).

**Where to look**
- Frontend entry: frontend/src/app/layout.tsx and components under frontend/src/components/
- Backend entry: backend/src/index.ts
- Worker: backend/src/workers/questionGenerator.ts
- AI orchestration: backend/src/services/aiService.ts and backend/src/services/questionAgent.ts
- MCQ service & routes: backend/src/services/mcqService.ts, backend/src/routes/mcq.ts

If you want, I can:
- Add a small architecture diagram (mermaid) to this README.
- Expand troubleshooting with exact error traces we saw (dev runtime module errors).
- Create an `.env.example` template.

---
Updated README.md
# In another terminal, start worker
