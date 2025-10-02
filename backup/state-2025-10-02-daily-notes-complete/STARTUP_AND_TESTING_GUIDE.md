# DesignPlanner Web - Startup & Testing Guide

## 🚀 Quick Start (Your Daily Workflow)

### Step 1: Start the Backend API
```bash
# Terminal 1: Navigate to backend API
cd C:\Users\igor\source\repos\DesignPlannerWeb\backend\DesignPlanner.Api

# Run the API (will create database automatically)
dotnet run

# API will be available at: https://localhost:7001
```

### Step 2: Start the Frontend React App
```bash
# Terminal 2: Navigate to frontend
cd C:\Users\igor\source\repos\DesignPlannerWeb\frontend

# Start React development server
npm run dev

# React app will open automatically at: http://localhost:5173
```

### Step 3: Seed Sample Data (First Time Only)
```bash
# Option 1: Via API endpoint (easiest)
# Visit: https://localhost:7001/api/dev/seed-database
# Or use this PowerShell command:
Invoke-WebRequest -Uri "https://localhost:7001/api/dev/seed-database" -Method POST

# Option 2: Via console app
cd C:\Users\igor\source\repos\DesignPlannerWeb\backend\DesignPlanner.Data
dotnet run
```

### Step 4: Login and Test
Open http://localhost:5173 and login with:
- **Manager**: `manager` / `password123`
- **Team Member**: `alex.smith` / `password123`

---

## 🧪 Complete Testing Checklist

### Authentication System ✅
**Test Login/Registration:**
- [ ] Login with manager account (`manager` / `password123`)
- [ ] Login with team member account (`alex.smith` / `password123`)
- [ ] Verify role-based navigation (managers see more options)
- [ ] Test logout functionality
- [ ] Test invalid credentials handling

**Test User Management (Manager Only):**
- [ ] Navigate to Employee Management from dashboard
- [ ] Create new team member
- [ ] Edit existing employee information
- [ ] Reset employee password
- [ ] Toggle employee active status

### Calendar Views ✅
**Test All View Types:**
- [ ] Daily view: Single day with all employees
- [ ] Weekly view: 5 weekdays (Mon-Fri) with task grid
- [ ] Biweekly view: 10 weekdays across 2 weeks
- [ ] Monthly view: All weekdays in current month
- [ ] Navigation: Previous/Next periods work correctly
- [ ] Today highlighting: Current date prominently displayed

**Test Task Display:**
- [ ] Task cards show project code (AWS001, MSF023, etc.)
- [ ] Client color coding visible on task cards
- [ ] Task status indicators working (colored dots)
- [ ] Priority indicators (!, !!) display correctly
- [ ] 1-4 tasks per slot layout working:
  - 1 task: Full width, full height
  - 2 tasks: Half width each, same height
  - 3 tasks: Two top (half width/height), one bottom (full width/half height)
  - 4 tasks: 2x2 grid (all half width/height)

### Drag & Drop System ✅
**Test Task Movement:**
- [ ] Drag individual tasks between slots
- [ ] Visual feedback during drag (card follows cursor)
- [ ] Drop validation (green = valid, red = invalid)
- [ ] Cannot drop more than 4 tasks per slot
- [ ] Cannot drop on blocked slots (leave/holidays)
- [ ] Task cards resize smoothly when slot task count changes
- [ ] Real-time updates via SignalR (test with multiple browser windows)

**Test Role-Based Permissions:**
- [ ] Manager: Can move any employee's tasks
- [ ] Team Member: Can only move their own tasks (other tasks not draggable)

### Team Management ✅
**Test Team Views (Manager Only):**
- [ ] Toggle between "My Team" and "All Teams" in calendar header
- [ ] My Team view: Full edit permissions, normal styling
- [ ] Global view: Read-only mode, muted styling, lock icons
- [ ] No drag-and-drop allowed in global view
- [ ] Team sections collapsible with proper color coding
- [ ] Employee workload indicators visible

### Leave Request System ✅
**Test Team Member Leave Requests:**
- [ ] Click "Absence" button in navigation
- [ ] Select date range in calendar picker
- [ ] Choose AM/PM for partial days
- [ ] See real-time calculation: "Requesting X days | Y days remaining"
- [ ] Cannot request more than available balance
- [ ] Leave type selection (Annual/Sick/Training)
- [ ] Requested days appear as "Pending" in main calendar

**Test Manager Leave Approval:**
- [ ] "Absence" button shows red notification badge when requests pending
- [ ] Open absence management modal
- [ ] Review pending requests with employee details
- [ ] Approve/reject requests with optional comments
- [ ] Edit employee annual leave totals
- [ ] View team leave calendar overview

### Real-Time Updates (SignalR) ✅
**Test Multi-User Scenarios:**
- [ ] Open two browser windows with different users
- [ ] Move task in one window, verify it updates in other window
- [ ] Create leave request, verify manager sees notification
- [ ] Approve leave request, verify team member sees update
- [ ] Create new task, verify real-time appearance
- [ ] Connection status indicator shows green (connected)

### Material Design UI ✅
**Test Responsive Design:**
- [ ] Desktop view (>1200px): Full layout with all features
- [ ] Tablet view (768-1200px): Responsive grid with collapsed elements
- [ ] Mobile view (<768px): Stacked layout, touch-friendly
- [ ] All animations smooth and satisfying
- [ ] Material Design 3 color scheme consistent
- [ ] Loading states during API calls

---

## 🔍 Troubleshooting Common Issues

### Database Issues
**"Database does not exist"**
```bash
cd C:\Users\igor\source\repos\DesignPlannerWeb\backend\DesignPlanner.Api
dotnet ef database update
```

**"No sample data visible"**
```bash
# Re-run the seeder
Invoke-WebRequest -Uri "https://localhost:7001/api/dev/seed-database?forceRecreate=true" -Method POST
```

### Frontend Issues
**"Cannot connect to API"**
- Verify backend is running at https://localhost:7001
- Check CORS configuration in backend Program.cs
- Verify frontend .env file has correct API URL

**"SignalR not connecting"**
- Check browser console for WebSocket errors
- Verify JWT token is valid
- Check SignalR hub registration in backend

### Performance Issues
**"Calendar loads slowly"**
- Check browser dev tools for API response times
- Verify database indexes are working
- Consider reducing date range for testing

---

## 📊 Sample Data Reference

### Test Accounts
```
Manager Account:
- Username: manager
- Password: password123
- Role: Manager
- Can: Manage team, approve leave, create users

Team Member Accounts:
- alex.smith / password123 (Senior Developer)
- emma.wilson / password123 (UI/UX Designer)  
- david.brown / password123 (Full Stack Developer)
- lisa.taylor / password123 (QA Engineer)
- mike.garcia / password123 (Backend Developer)
```

### Clients & Projects
```
AWS (#FF9900):    AWS001, AWS015
MSFT (#0078D4):   MSF023, MSF056
GOOGLE (#4285F4): GOO017, GOO029
EQX (#ED1C24):    EQX042, EQX011
TATE (#000000):   TAT008, TAT003
```

### Leave Request Examples
- Alex: Approved vacation (past dates)
- Emma: Pending annual leave request (Europe trip)
- Lisa: Approved training (future conference)
- Mike: Pending sick leave (medical appointment)
- David: Approved half-day (afternoon off)

---

## 🎯 Success Criteria

### Phase 1 - Core Functionality
- [ ] All users can login successfully
- [ ] Calendar displays correctly in all view modes
- [ ] Task drag-and-drop works smoothly
- [ ] Leave requests flow completely
- [ ] Real-time updates working

### Phase 2 - Advanced Features  
- [ ] Team management permissions working
- [ ] Manager approval workflows complete
- [ ] Mobile responsive design functional
- [ ] All animations smooth and satisfying
- [ ] No console errors or warnings

### Phase 3 - Production Ready
- [ ] All sample data displays correctly
- [ ] Performance acceptable (<2s page loads)
- [ ] Error handling graceful
- [ ] UI polished and professional
- [ ] Ready for real user testing

---

## 🚀 What's Next?

Once basic testing is complete:

1. **Database Migration**: Switch from SQLite to PostgreSQL
2. **Deployment**: Set up Oracle Cloud hosting
3. **SSL Setup**: Configure HTTPS for production
4. **Domain Setup**: Configure custom domain
5. **Email Notifications**: Add email for leave requests
6. **Additional Features**: Analytics, reporting, etc.

---

## 📞 Support

If you encounter any issues:
1. Check this troubleshooting guide first
2. Look for error messages in browser console
3. Check backend API logs
4. Verify database seeding completed successfully
5. Contact support with specific error messages

**Happy Testing! 🎉**