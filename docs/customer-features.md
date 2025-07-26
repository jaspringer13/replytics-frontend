# Customer Features Implementation Guide

This document outlines the detailed implementation plans for customer management features in the dashboard.

## Appointment History

### Data Structure & API
- Create `AppointmentHistory` interface with fields:
  ```typescript
  interface AppointmentHistory {
    id: string
    customerId: string
    date: string
    service: string
    status: 'completed' | 'cancelled' | 'no-show' | 'scheduled'
    duration: number
    cost: number
    notes?: string
    outcome?: string
  }
  ```
- Add API endpoint: `GET /api/customers/:id/appointments`
- Implement filtering params: status, dateRange, service

### State Management
- Add appointments state with loading/error states
- Implement useEffect to fetch data when tab becomes active
- Add pagination for large appointment lists

### UI Components
- **AppointmentCard**: Show date, service, status badge, cost
- **Timeline view** with chronological ordering
- **Filter controls**: date picker, status dropdown, service type
- **Empty state** for customers with no appointments

### Features
- Click to expand appointment details (notes, outcome)
- Status color coding (completed: green, cancelled: red, no-show: orange)
- Quick actions: reschedule, add notes, mark no-show
- Export appointment history to CSV/PDF

## Customer Notes & Communication History

### Data Structure & API
- `CustomerNote` interface:
  ```typescript
  interface CustomerNote {
    id: string
    customerId: string
    content: string
    type: 'note' | 'sms' | 'call'
    createdBy: string
    createdAt: string
    updatedAt: string
    isPrivate: boolean
    tags: string[]
  }
  ```
- API endpoints:
  - `GET /api/customers/:id/notes` (with pagination, filters)
  - `POST /api/customers/:id/notes` (create new note)
  - `PUT /api/notes/:id` (edit existing note)
  - `DELETE /api/notes/:id` (soft delete with audit trail)

### State Management
- notes state with CRUD operations
- Real-time updates via WebSocket for team collaboration
- Optimistic updates for better UX
- Search/filter state (by type, date range, tags, user)

### UI Components
- **NoteCard**: Display note content, timestamp, author, edit/delete actions
- **AddNoteForm**: Rich text editor with @ mentions, file attachments
- **CommunicationTimeline**: Unified view of notes, SMS, calls
- **SearchBar**: Filter by content, tags, date, communication type
- **TagInput**: Categorize notes (follow-up, complaint, preference, etc.)

### Features
- Rich text editing with formatting (bold, italic, lists, links)
- File attachments (images, documents) with preview
- @mentions for team notifications
- Quick templates for common note types
- Export notes to PDF/CSV
- Note privacy controls (public vs team-only)
- Auto-generated notes from communication (SMS/call logs)
- Full-text search across all notes and communications

### Communication Integration
- Display SMS message history with send/receive timestamps
- Show call logs with duration, outcome, recording links
- Auto-create notes from missed calls or failed messages
- Link notes to specific appointments or interactions