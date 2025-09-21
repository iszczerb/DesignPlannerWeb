# ROLE-BASED SCHEDULE ACCESS IMPLEMENTATION PLAN

## 🎯 REQUIREMENTS

### Current Issues to Fix:
1. **Admin appears as row in schedule** ❌ - Admin should NOT have a schedule row
2. **Admin needs team dropdown** ❌ - Should see dropdown to select teams to view
3. **Role-based filtering needed** ❌ - Different access levels per role

### Target Behavior:
- **Admin (manager account)**: No schedule row, dropdown to select teams, can see all teams
- **Manager**: Only sees their team members, shows team name
- **Team Members**: Only sees their own row, no team controls

## 📝 STEP-BY-STEP IMPLEMENTATION PLAN

### **STEP 1: Fix Admin Row Display** 🔧
**Status**: ⏳ IN PROGRESS
**Problem**: Admin appears in schedule when they shouldn't
**Solution**: Filter out admin users from employee list in backend

**Tasks**:
1. Find ScheduleService calendar data generation
2. Add filter to exclude users with Admin role from employee rows
3. Test admin row no longer appears

### **STEP 2: Create Enhanced Team Dropdown for Admin** 🎛️
**Status**: 📋 PENDING
**Problem**: Current TeamToggle is too basic
**Solution**: Replace with proper dropdown for admin role

**Tasks**:
1. Create new `TeamSelectDropdown` component
2. Features:
   - "View All Teams" option
   - Individual team selection
   - Team name display
   - Only shows for Admin role
3. Replace current basic toggle

### **STEP 3: Update Backend Team Filtering** 🏢
**Status**: 📋 PENDING
**Problem**: Need precise team member filtering
**Solution**: Enhance existing endpoints for better filtering

**Tasks**:
1. Add endpoint `/api/schedule/teams/{teamId}/members`
2. Modify calendar endpoint to support specific team filtering
3. Use proper Employee-Team relationships from database

### **STEP 4: Implement Frontend Role Logic** 👤
**Status**: 📋 PENDING
**Problem**: Frontend needs role-specific behavior
**Solution**: Add proper role handling to calendar components

**Tasks**:
1. Detect user role from JWT token
2. Conditional rendering based on role
3. Admin: Shows dropdown, sees all teams
4. Manager: Shows team name, sees only their team
5. TeamMember: Shows only their name, sees only themselves

### **STEP 5: Integration & Testing** 🧪
**Status**: 📋 PENDING
**Problem**: Need to ensure everything works together
**Solution**: Systematic testing of each role

**Tasks**:
1. Test Admin: Can select teams, no admin row appears
2. Test Manager: Sees only their team
3. Test TeamMember: Sees only themselves
4. Database: Verify all data comes from database correctly

## 🔧 TECHNICAL DETAILS

### Current Backend Structure:
- **ScheduleController.cs**: Role-based access controls
- **Endpoints**: `/api/schedule/teams` and `/api/schedule/teams/all`
- **Service**: IScheduleService with team management methods

### Current Frontend Structure:
- **TeamCalendarView.tsx**: Main calendar component
- **TeamToggle.tsx**: Basic team switching (needs replacement)
- **CalendarGrid.tsx**: Schedule display

### Database Integration:
- Use Employee-Team relationships from our solid database foundation
- Filter based on User roles (Admin, Manager, TeamMember)
- Exclude Admin users from employee schedule display

## 🚀 CURRENT STATUS
**Starting with STEP 1: Fix Admin Row Display**

Each step will be tested immediately before moving to the next!