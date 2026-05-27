# VedaAI - AI Assessment Creator

VedaAI is a robust, scalable Node.js + Express + TypeScript application powering the VedaAI Assessment Creator platform.
It provides an end-to-end workflow for generating, storing, and distributing AI-generated assignments for educational purposes.
Key features include a queue-based asynchronous processing pipeline, modular service layer, integration with state-of-the-art LLMs for question generation, PDF export, and real-time status updates via WebSocket.

System Overview

The backend accepts assignment creation requests through a RESTful API. To ensure high reliability and scalability, every incoming assignment is processed asynchronously via a job queue powered by BullMQ and Redis.
Each assignment document, along with its settings, is stored in MongoDB using a type-safe schema.
Assignment generation leverages an AI service (via LLM APIs such as Gemini or Groq). To maximize the accuracy of generated content and minimize hallucination, the system implements chunking—large pieces of input data are divided into manageable chunks before being sent to the LLM, ensuring deterministic outputs and context integrity.
Generated assignments are rendered and exported as PDFs via a dedicated service using Puppeteer.
Real-time status updates are delivered to connected clients over WebSocket, enabling transparent multi-user collaboration and monitoring.
The design is extensible, supporting future integrations with new AI providers and external school systems.
```mermaid
flowchart TD
    A[Client (Frontend)] -- "POST /api/assignments" --> B[RESTful API (Express)]
    B -- "Validation & Save (status: pending)" --> C[MongoDB]
    B -- "Add Assignment Job" --> D[BullMQ Queue (Redis)]
    D -- "Job Pickup" --> E[AI Worker]
    E -- "Chunk Input Data" --> F[Chunked Data]
    F -- "Send To LLM (Gemini/Groq)" --> G[LLM API]
    G -- "Receive Questions/Answers" --> E
    E -- "Save Results (status: completed)" --> C
    E -- "Generate PDF (Puppeteer)" --> H[PDF Service]
    H -- "Store/Retrieve PDF" --> C
    E -- "Emit WebSocket Update" --> I[WebSocket Server]
    I -- "Push Status/Results" --> A

    %% Additional extensibility
    E -- "Future: Integrate More AI Providers"--> J[Other AI API]
    B -- "Future: Integrate School Systems" --> K[School System API]
```

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Express API    │────▶│   MongoDB       │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│                 │◄────│                 │◄────│                 │
│  Zustand Store  │     │  BullMQ Queue   │     │  Redis Cache    │
│  Socket.IO      │◄────│  Socket.IO      │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌─────────────────┐
                        │  AI Worker      │
                        │  (Question Gen) │
                        └─────────────────┘
```
##System architecture
### Queue-Based Assignment Processing Flow

```mermaid
flowchart TD
    A[Client] -- "POST /api/assignments" --> B[API Server]
    B -- "Save Assignment<br/>(status: pending)" --> C[MongoDB]
    B -- "Add Job" --> D[Redis/BullMQ Queue]
    D -- "Job Pickup" --> E[Worker Process]
    E -- "Chunk Assignment Data<br/>Send to LLM (aiService)" --> F[LLM Service]
    F -- "LLM Response<br/>(Questions, Answers)" --> E
    E -- "Save Results<br/>(status: completed)" --> C
    E -- "Generate PDF<br/>(pdfService)" --> G[PDF Export]
    E -- "Emit Updates" --> H[WebSocket Server]
    H -- "Push Status" --> A
```
## Project Structure

```
veda-ai/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/           # DB & Redis config
│   │   ├── models/           # Mongoose models
│   │   ├── routes/           # API routes
│   │   ├── services/         # AI & PDF services
│   │   ├── workers/          # BullMQ background workers
│   │   ├── websocket/        # Socket.IO setup
│   │   ├── types/            # TypeScript types
│   │   └── index.ts          # Entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                # Next.js + TypeScript
    ├── src/
    │   ├── app/              # Next.js App Router
    │   ├── components/       # React components
    │   ├── store/             # Zustand state management
    │   ├── lib/               # API & Socket clients
    │   └── types/             # TypeScript types
    ├── package.json
    └── tailwind.config.ts
```

## Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management
- **Socket.IO Client** - Real-time updates
- **Lucide React** - Icons
- **React Hot Toast** - Notifications

### Backend
- **Node.js + Express** - API server
- **TypeScript** - Type safety
- **MongoDB + Mongoose** - Document database
- **Redis + BullMQ** - Queue & caching
- **Socket.IO** - Real-time communication
- **Puppeteer** - PDF generation
- **Zod** - Validation
- **Multer** - File uploads

### AI Integration
- Simulated AI service (replace with Gemini/Groq API)
- Structured prompt generation
- Parsed response handling

## Features

### Core
- ✅ Create assignments with file upload, due date, question types
- ✅ AI-powered question generation with sections & difficulty levels
- ✅ Real-time status updates via WebSocket
- ✅ Structured question paper output
- ✅ PDF export with proper formatting
- ✅ Responsive design (Desktop + Mobile)

### Bonus
- ✅ Download as PDF (proper formatting)
- ✅ Action bar (Regenerate)
- ✅ Difficulty badges (Easy/Moderate/Hard)
- ✅ Collapsible sidebar
- ✅ Search & filter assignments
- ✅ Queue-based background processing

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis

### Backend Setup

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start server
npm run dev

# In another terminal, start worker
npm run worker
```

### Frontend Setup

```bash
cd frontend
npm install

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://default:your_redis_password@localhost:6379/0
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
NODE_ENV=development
```

#### Frontend (.env.local)
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/assignments` | Create assignment |
| GET | `/api/assignments` | List assignments |
| GET | `/api/assignments/:id` | Get assignment |
| DELETE | `/api/assignments/:id` | Delete assignment |
| POST | `/api/assignments/:id/regenerate` | Regenerate questions |
| GET | `/api/assignments/:id/pdf` | Download PDF |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join-assignment` | Client → Server | Join room for updates |
| `status-update` | Server → Client | Assignment status change |

## Approach

1. **Queue-Based Architecture**: BullMQ handles AI generation asynchronously, preventing API timeouts and enabling retries.

2. **Real-Time Updates**: Socket.IO rooms notify clients when generation completes, eliminating polling.

3. **State Management**: Zustand provides simple, performant state sharing across components.

4. **PDF Generation**: Puppeteer renders styled HTML to PDF, ensuring consistent formatting across browsers.

5. **Responsive Design**: Mobile-first approach with collapsible sidebar and adaptive layouts.

## License

MIT
