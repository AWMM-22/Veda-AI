# VedaAI Backend

Node.js + Express + TypeScript backend for the VedaAI Assessment Creator.

## Setup

```bash
npm install
npm run dev        # Start API server
npm run worker     # Start BullMQ worker (in another terminal)
```

## Architecture

### Queue-Based Processing Flow
1. Client creates assignment via POST /api/assignments
2. Assignment saved to MongoDB with status "pending"
3. Job added to BullMQ queue
4. Worker picks up job, updates status to "processing"
5. AI service generates structured questions
6. Results saved to MongoDB, status updated to "completed"
7. WebSocket emits status update to connected clients

### Services
- **aiService.ts** - Question generation (replace with real LLM API)
- **pdfService.ts** - PDF generation via Puppeteer

### Models
- **Assignment** - Stores assignment metadata, sections, questions, answer key

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://default:your_redis_password@localhost:6379/0
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
NODE_ENV=development
```

## API Documentation

### Create Assignment
```http
POST /api/assignments
Content-Type: multipart/form-data

{
  "title": "Quiz on Electricity",
  "subject": "Science",
  "className": "8th Grade",
  "schoolName": "Delhi Public School",
  "dueDate": "2025-06-30",
  "questionTypes": [
    { "type": "Multiple Choice Questions", "count": 4, "marks": 1 },
    { "type": "Short Questions", "count": 3, "marks": 2 }
  ],
  "additionalInfo": "1 hour exam duration",
  "file": <optional_file>
}
```

### Response
```json
{
  "success": true,
  "message": "Assignment created and queued for generation",
  "data": { "_id": "...", "title": "...", "status": "pending" }
}
```

## WebSocket

Connect to `ws://localhost:5000` and join assignment room:
```javascript
socket.emit('join-assignment', assignmentId);
socket.on('status-update', (data) => {
  console.log(data.status); // 'processing' | 'completed' | 'failed'
});
```
