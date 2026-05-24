# VedaAI - AI Assessment Creator

A full-stack AI-powered assessment creation platform for teachers. Create, generate, and manage question papers with ease.

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
