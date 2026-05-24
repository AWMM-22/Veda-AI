# VedaAI Frontend

Next.js + TypeScript frontend for the VedaAI Assessment Creator.

## Setup

```bash
npm install
npm run dev
```

## Features

- **Responsive Design** - Works on desktop and mobile
- **Collapsible Sidebar** - Save screen space on desktop
- **Real-time Updates** - WebSocket connection for live status
- **PDF Preview** - Styled question paper display
- **Form Validation** - Client-side validation with error messages

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard with stats |
| `/assignments` | Assignment list with search/filter |
| `/assignments/create` | Multi-step creation form |
| `/assignments/[id]` | Question paper output |

## State Management

Zustand store manages:
- Assignment list
- Current assignment
- Loading states
- Sidebar toggle

## WebSocket

Connected automatically on relevant pages. Joins assignment room to receive real-time status updates during AI generation.
