# DesignPlanner Web - Project Specification

## Project Overview
A modern web-based task scheduling and team management system for architecture firms, featuring real-time collaboration, Material Design 3 UI, and satisfying drag-and-drop interactions.

## Core Features

### 1. User Management
- **Individual logins** for all team members
- **Role-based access**: Admin, Manager, TeamMember
- **Team assignment**: Each user belongs to one team
- **JWT authentication** with secure sessions

### 2. Views & Permissions

#### Manager Access:
- **Team View**: See and manage their assigned team
- **Global View**: See all teams in the company
- **Switch between views** with toggle/dropdown
- **Full CRUD** on all tasks and assignments
- **Approve/reject** leave requests

#### Team Member Access:
- **Personal View**: See only their assignments
- **Create tasks** without approval
- **Update task status** on assigned tasks
- **Request leave** (pending approval)
- **Cannot modify** database entities (clients, projects, task types)

### 3. Calendar Views
All views share the same responsive grid structure:
- **Daily**: 1 day × all employees × 2 slots
- **Weekly**: 5 days × all employees × 2 slots
- **Biweekly**: 10 days × all employees × 2 slots  
- **Monthly**: 20-23 days × all employees × 2 slots

### 4. Task Management
- **Maximum 4 tasks per slot** (AM/PM)
- **Auto-resizing task cards** within fixed slot size
- **Drag-and-drop** between any slots
- **Real-time updates** via SignalR
- **Color-coded** by client branding

### 5. Leave Request System
- **Request Types**: Full day or half-day (AM/PM)
- **Workflow**: 
  1. Employee requests leave
  2. Shows as "pending" (grayed out) in calendar
  3. Manager receives notification
  4. Manager approves/rejects
  5. If approved: slots blocked, leave balance updated
  6. If rejected: pending status removed

## Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Material UI v5** (Material Design 3)
- **Framer Motion** for animations
- **React DnD** for drag-and-drop
- **Socket.io** for real-time updates
- **Vite** for fast development

### Backend Stack
- **ASP.NET Core 8.0** Web API
- **Entity Framework Core** with SQLite (dev) / PostgreSQL (prod)
- **SignalR** for real-time communication
- **JWT** authentication
- **AutoMapper** for DTO mapping

### Database Schema

#### Core Entities:
```
Users
├── Id (GUID)
├── Email
├── PasswordHash
├── EmployeeId (FK)
├── Role (Admin/Manager/TeamMember)
├── RefreshToken
└── LastLogin

Employees
├── Id
├── FirstName
├── LastName
├── TeamId (FK)
├── Position
├── AnnualLeaveDays (default: 25)
├── UsedLeaveDays
└── Skills (many-to-many)

Teams
├── Id
├── Name
├── ManagerId (FK to Employee)
└── Color (for UI)

Clients
├── Id
├── Name
├── Color (#hex)
├── Active
└── Projects (one-to-many)

Projects
├── Id
├── Name
├── ClientId (FK)
├── Deadline
├── Status
├── DesignerId (FK to Employee)
├── ProjectManagerId (FK to Employee)
└── Tasks (one-to-many)

Tasks
├── Id
├── Title
├── Description
├── ProjectId (FK)
├── TaskTypeId (FK)
├── EstimatedHours
├── Priority (Low/Medium/High/Critical)
├── Status (NotStarted/InProgress/Done/OnHold/Blocked)
└── CreatedBy (FK to User)

TaskTypes
├── Id
├── Name (Design/Review/Meeting/Documentation/etc)
└── Color

Assignments
├── Id
├── TaskId (FK)
├── EmployeeId (FK)
├── Date
├── Slot (Morning/Afternoon)
├── ActualHours
└── Status

LeaveRequests
├── Id
├── EmployeeId (FK)
├── StartDate
├── EndDate
├── Slots (JSON array of date+slot)
├── Type (Annual/Sick/Training)
├── Status (Pending/Approved/Rejected)
├── Notes
├── RequestedAt
├── ReviewedBy (FK to User)
└── ReviewedAt
```

## UI/UX Design (Material Design 3)

### Design Principles
1. **Clean & Modern**: Generous whitespace, clear hierarchy
2. **Smooth Animations**: 300ms transitions, spring physics for drag-drop
3. **Responsive**: Mobile-first, works on all devices
4. **Accessible**: WCAG 2.1 AA compliant
5. **Satisfying Interactions**: Haptic-like feedback, smooth transitions

### Color Scheme (Material You)
```css
--md-sys-color-primary: #006494;
--md-sys-color-secondary: #54627b;
--md-sys-color-tertiary: #6f5674;
--md-sys-color-surface: #fdfbff;
--md-sys-color-background: #fdfbff;
--md-sys-color-error: #ba1a1a;
```

### Component Design

#### Task Cards
```css
.task-card {
  /* Dynamic sizing based on slot occupancy */
  height: calc((100% - 12px) / min(var(--task-count), 4));
  
  /* Material elevation */
  box-shadow: var(--md-elevation-1);
  
  /* Smooth transitions */
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Hover state */
  &:hover {
    box-shadow: var(--md-elevation-2);
    transform: translateY(-2px);
  }
  
  /* Dragging state */
  &.dragging {
    opacity: 0.5;
    transform: rotate(2deg);
  }
}
```

#### Slot Animation
```javascript
// Framer Motion animation for task reorganization
const slotAnimation = {
  layout: true,
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: {
    type: "spring",
    stiffness: 500,
    damping: 30
  }
};
```

### Grid Layout
```css
.calendar-grid {
  display: grid;
  grid-template-columns: 200px repeat(var(--day-count), 1fr);
  grid-auto-rows: minmax(120px, auto);
  gap: 8px;
  
  /* Responsive breakpoints */
  @media (max-width: 768px) {
    grid-template-columns: 80px repeat(var(--day-count), 1fr);
  }
  
  @media (max-width: 480px) {
    /* Stack to single column on mobile */
    grid-template-columns: 1fr;
  }
}

.time-slot {
  min-height: 120px;
  max-height: 200px;
  padding: 8px;
  border-radius: 12px;
  background: var(--md-sys-color-surface-variant);
  
  /* Fixed size - tasks resize, not slots */
  overflow-y: auto;
  overflow-x: hidden;
}
```

## Real-time Synchronization

### SignalR Hubs
```csharp
public interface IScheduleHub
{
    Task TaskAssigned(AssignmentDto assignment);
    Task TaskUpdated(TaskDto task);
    Task TaskRemoved(int assignmentId);
    Task LeaveRequested(LeaveRequestDto request);
    Task LeaveReviewed(LeaveRequestDto request);
}
```

### Frontend Integration
```typescript
// Auto-reconnect with exponential backoff
const connection = new HubConnectionBuilder()
  .withUrl("/api/hubs/schedule")
  .withAutomaticReconnect([0, 2000, 10000, 30000])
  .build();

// Subscribe to updates
connection.on("TaskAssigned", (assignment) => {
  dispatch(addAssignment(assignment));
  showToast("New task assigned", "info");
});
```

## Sample Data Structure

### Teams
- **Team A**: Development Team (Manager: John Smith)
- **Team B**: Design Team (Manager: Sarah Johnson)

### Employees
1. John Smith (Manager, Team A)
2. Sarah Johnson (Manager, Team B)
3. Mike Wilson (Senior Developer, Team A)
4. Emily Brown (Developer, Team A)
5. James Davis (Senior Designer, Team B)
6. Lisa Anderson (Designer, Team B)

### Clients (with colors)
1. **AWS** (#FF9900 - Orange)
2. **MSFT** (#0078D4 - Blue)
3. **GOOGLE** (#4285F4 - Google Blue)
4. **EQX** (#ED1C24 - Red)
5. **TATE** (#000000 - Black)

### Projects (Format: ABC123 only)
1. **AWS001**
2. **MSF023**
3. **GOO017**
4. **EQX042**
5. **TAT008**
6. **AWS015**
7. **MSF056**
8. **GOO029**
9. **EQX011**
10. **TAT003**

### Task Types
- Design Review
- Client Meeting
- Concept Development
- Documentation
- Site Visit
- 3D Modeling
- Presentation Prep

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup and configuration
- [ ] Authentication system
- [ ] Database models and migrations
- [ ] Basic API endpoints
- [ ] Login/Register UI

### Phase 2: Core Features (Week 2)
- [ ] Calendar grid components
- [ ] Task CRUD operations
- [ ] Drag-and-drop implementation
- [ ] Real-time updates
- [ ] Role-based views

### Phase 3: Advanced Features (Week 3)
- [ ] Leave request system
- [ ] Team management
- [ ] Notifications
- [ ] Analytics dashboard
- [ ] Excel export

### Phase 4: Polish & Deploy (Week 4)
- [ ] UI animations and transitions
- [ ] Performance optimization
- [ ] Testing and bug fixes
- [ ] Documentation
- [ ] Deployment setup

## Success Criteria
- [ ] All employees can login individually
- [ ] Managers can view and manage teams
- [ ] Real-time updates work across all clients
- [ ] Drag-and-drop is smooth and satisfying
- [ ] Leave requests workflow functions correctly
- [ ] Task cards auto-resize within slots (max 4)
- [ ] All views (daily/weekly/biweekly/monthly) responsive
- [ ] Material Design 3 consistently applied
- [ ] Page load < 2 seconds
- [ ] No data loss during operations

## Next Steps
1. Initialize backend project with ASP.NET Core
2. Setup React with Material UI and TypeScript
3. Create database models and migrations
4. Implement authentication system
5. Build first calendar view prototype

---

*Last Updated: [Current Date]*
*Version: 1.0.0*