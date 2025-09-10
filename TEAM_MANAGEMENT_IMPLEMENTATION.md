# Team Management Views Implementation

## Overview

This implementation provides managers with proper team-based views and permissions for schedule management. The system includes:

1. **"My Team" View**: Full edit permissions for team members
2. **"Global View"**: View-only mode for all teams with clear visual indicators

## Key Features Implemented

### Frontend Components

#### 1. TeamToggle Component
- **Location**: `frontend/src/components/calendar/TeamToggle.tsx`
- **Purpose**: Smart toggle in calendar header for switching between "My Team" and "All Teams" views
- **Features**: 
  - Clear visual distinction between modes
  - Disabled state support
  - Tooltip descriptions

#### 2. TeamSection Component
- **Location**: `frontend/src/components/calendar/TeamSection.tsx`
- **Purpose**: Collapsible team grouping with team metadata
- **Features**:
  - Team color coding and branding
  - Collapsible sections with team statistics
  - Permission-aware styling (full vs view-only)
  - Team workload summaries

#### 3. Enhanced EmployeeRow Component
- **Location**: `frontend/src/components/calendar/EmployeeRow.tsx` (updated)
- **Features**:
  - Team color stripe indicators
  - Permission-based styling (reduced opacity for view-only)
  - Lock icons for non-editable employees
  - Team indicator dots

#### 4. ViewModeIndicator Component
- **Location**: `frontend/src/components/calendar/ViewModeIndicator.tsx`
- **Purpose**: Clear visual indicator of current view mode and permissions
- **Features**:
  - "Managing: Team Name" vs "Global View - Read Only"
  - Color-coded badges

#### 5. Enhanced CalendarGrid Component
- **Location**: `frontend/src/components/calendar/CalendarGrid.tsx` (updated)
- **Features**:
  - Team-based rendering with TeamSection components
  - Traditional employee row rendering for "My Team" view
  - Team filtering and grouping logic

#### 6. Enhanced CalendarHeader Component
- **Location**: `frontend/src/components/calendar/CalendarHeader.tsx` (updated)
- **Features**:
  - Integrated TeamToggle for managers
  - ViewModeIndicator in header
  - Role-based control visibility

#### 7. TeamCalendarView Integration Component
- **Location**: `frontend/src/components/calendar/TeamCalendarView.tsx`
- **Purpose**: Complete integration wrapper managing team state and permissions
- **Features**:
  - Permission-aware drag-and-drop blocking
  - Team view mode state management
  - Collapsed team state management

### Backend Enhancements

#### 1. Enhanced ScheduleController
- **Location**: `backend/DesignPlanner.Api/Controllers/ScheduleController.cs` (updated)
- **New Endpoints**:
  - `GET /api/schedule/teams` - Get manager's teams
  - `GET /api/schedule/teams/all` - Get all teams with managed status
  - `GET /api/schedule/team/{teamId}/calendar` - Team-specific calendar
  - `GET /api/schedule/calendar/global` - Global team view

#### 2. Enhanced ScheduleService
- **Location**: `backend/DesignPlanner.Core/Services/ScheduleService.cs` (updated)
- **New Methods**:
  - `GetManagerTeamsAsync()` - Team management data
  - `GetAllTeamsWithManagedStatusAsync()` - Teams with permission status
  - `GetTeamCalendarViewAsync()` - Team-filtered calendar data
  - `GetGlobalCalendarViewAsync()` - Multi-team calendar data
  - `GetTeamColor()` - Consistent team color scheme

#### 3. TeamAuthorizationService
- **Location**: `backend/DesignPlanner.Core/Services/TeamAuthorizationService.cs`
- **Purpose**: Granular permission checking for team operations
- **Features**:
  - Team management permissions
  - Employee management permissions
  - View-only permissions
  - Bulk operation validation

#### 4. TeamAuthorizationAttribute
- **Location**: `backend/DesignPlanner.Api/Attributes/TeamAuthorizationAttribute.cs`
- **Purpose**: Declarative authorization for controller actions
- **Features**:
  - Resource-specific permission checking
  - Multiple permission types
  - Route/query/body parameter extraction

### Services and Utilities

#### 1. TeamService (Frontend)
- **Location**: `frontend/src/services/teamService.ts`
- **Purpose**: Team-related API calls and data transformations
- **Features**:
  - Team data fetching with permission status
  - Global calendar view handling
  - Permission validation helpers
  - Team color utilities

#### 2. Enhanced DTOs
- **Location**: `backend/DesignPlanner.Core/DTOs/ScheduleRequestDto.cs` (updated)
- **Changes**: Added `TeamId` property for team filtering

## Permission Model

### Manager Permissions
1. **"My Team" View**:
   - Full CRUD operations on team member tasks
   - Drag-and-drop task assignments
   - Create new tasks and assignments
   - Edit existing tasks and schedules

2. **"Global View"**:
   - Read-only visibility of all teams
   - No edit capabilities on other teams
   - Clear visual indicators of view-only mode
   - Drag-and-drop disabled for non-managed teams

### Visual Indicators

#### Team Management Indicators
- **Team Color Stripes**: Left border on employee rows
- **Lock Icons**: On non-editable team members
- **Opacity Reduction**: 60% opacity for view-only teams
- **Permission Badges**: "View Only" badges on restricted teams

#### Mode Indicators
- **Header Badge**: Shows current mode and permissions
- **Team Sections**: Clear "View Only" labeling
- **Hover States**: Disabled for restricted elements

## Usage Examples

### Basic Implementation
```tsx
import TeamSchedule from './pages/TeamSchedule';

function App() {
  return <TeamSchedule />;
}
```

### Custom Integration
```tsx
import TeamCalendarView from './components/calendar/TeamCalendarView';
import { TeamViewMode } from './components/calendar/TeamToggle';

function CustomSchedulePage() {
  const [teamViewMode, setTeamViewMode] = useState(TeamViewMode.MyTeam);
  
  return (
    <TeamCalendarView
      // ... calendar props
      teamViewMode={teamViewMode}
      onTeamViewChange={setTeamViewMode}
      userRole="Manager"
      teams={teams}
      // ... other props
    />
  );
}
```

## Testing the Implementation

### 1. Manager "My Team" View
- Switch to "My Team" mode
- Verify full editing capabilities on team members
- Test drag-and-drop functionality
- Confirm task creation and editing

### 2. Manager "Global View"
- Switch to "All Teams" mode
- Verify view-only mode indicators
- Test that drag-and-drop is disabled for other teams
- Confirm team sections show proper permissions

### 3. Team Member Access
- Log in as regular team member
- Verify limited view to own team only
- Confirm no team toggle visibility
- Test permission restrictions

### 4. Visual Verification
- Check team color coding consistency
- Verify lock icons on restricted elements
- Confirm opacity changes for view-only teams
- Test collapsed/expanded team states

## Integration Notes

### Dependencies Required
1. React DnD for drag-and-drop functionality
2. Existing schedule service and types
3. Authentication context for user roles
4. Team data from backend API

### Database Requirements
- Team entity with proper relationships
- Employee-Team associations
- Manager-Team relationships (may need to be added)

### Configuration
- Team color schemes in service
- Permission validation logic
- Role-based access control

## Security Considerations

### Frontend Security
- Permission checks before UI actions
- Disabled states for restricted operations
- Clear visual feedback for permissions

### Backend Security
- Authorization attributes on endpoints
- Team-based data filtering
- Permission validation at service level
- Resource ownership verification

## Future Enhancements

### Potential Improvements
1. **Team Manager Assignments**: Explicit manager-team relationships
2. **Advanced Permissions**: Role-based team permissions beyond manager/member
3. **Team Analytics**: Enhanced team performance metrics
4. **Mobile Responsiveness**: Team accordion design for mobile
5. **Real-time Updates**: Live team schedule updates
6. **Team Templates**: Predefined team structures and workflows

### Performance Optimizations
1. **Lazy Loading**: Load team data on demand
2. **Caching**: Team permission and data caching
3. **Pagination**: Large team member lists
4. **Virtual Scrolling**: Performance with many teams

## Files Created/Modified

### New Files Created:
- `frontend/src/components/calendar/TeamToggle.tsx`
- `frontend/src/components/calendar/TeamSection.tsx`
- `frontend/src/components/calendar/ViewModeIndicator.tsx`
- `frontend/src/components/calendar/TeamCalendarView.tsx`
- `frontend/src/services/teamService.ts`
- `frontend/src/pages/TeamSchedule.tsx`
- `backend/DesignPlanner.Core/Services/ITeamAuthorizationService.cs`
- `backend/DesignPlanner.Core/Services/TeamAuthorizationService.cs`
- `backend/DesignPlanner.Api/Attributes/TeamAuthorizationAttribute.cs`

### Files Modified:
- `frontend/src/components/calendar/CalendarHeader.tsx`
- `frontend/src/components/calendar/CalendarGrid.tsx`
- `frontend/src/components/calendar/EmployeeRow.tsx`
- `backend/DesignPlanner.Api/Controllers/ScheduleController.cs`
- `backend/DesignPlanner.Core/Services/IScheduleService.cs`
- `backend/DesignPlanner.Core/Services/ScheduleService.cs`
- `backend/DesignPlanner.Core/DTOs/ScheduleRequestDto.cs`

This implementation provides a comprehensive team management system with proper permissions, clear visual indicators, and robust authorization controls.