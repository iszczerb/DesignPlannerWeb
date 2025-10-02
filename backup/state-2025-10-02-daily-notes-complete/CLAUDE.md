# CRITICAL ISSUES AND SOLUTIONS

## 0. CRITICAL PROTECTION RULES - MOST IMPORTANT

### ⚠️ NEVER DELETE DATABASE FILES ⚠️
**ABSOLUTE RULE: NEVER DELETE designplanner.db FILES UNDER ANY CIRCUMSTANCES**
- NEVER run commands that delete .db, .db-shm, .db-wal files
- NEVER suggest database deletion as a solution
- ALWAYS ask user before any database-related operations
- If database issues occur, find alternative solutions that preserve data

### ⚠️ NEVER USE GIT RESTORE OR REVERT COMMANDS ⚠️
**ABSOLUTE RULE: NEVER REVERT OR RESTORE GIT FILES WITHOUT EXPLICIT USER PERMISSION**
- NEVER run `git restore` on any files
- NEVER run `git reset` or `git revert` commands
- NEVER overwrite user's work or hours of development
- ALWAYS preserve existing code and styling
- If there are syntax errors, fix them directly - DO NOT revert files
- User lost hours of iOS glassmorphism work due to accidental git restore
- **THIS CAUSED USER TO LOSE SLEEP AT 3AM TRYING TO FIX THE DAMAGE**

### ⚠️ TIMEZONE UTC ISSUE - CRITICAL DATE BUG ⚠️
**CRITICAL: ALWAYS CHECK FOR UTC TIMEZONE ISSUES WITH DATE DISPLAY**
- JavaScript Date objects can cause UTC vs local timezone mismatches
- If daily view shows "Day 24" but todo header shows "Day 23" - IT'S TIMEZONE UTC!
- ALWAYS use proper timezone handling for date display
- Common fix: Use date formatting that respects local timezone
- NEVER assume dates will display correctly without timezone consideration
- **USER ALWAYS CATCHES THIS BUG - BE PROACTIVE!**

## 1. 403 FORBIDDEN ERROR - RECURRING AUTHORIZATION ISSUE

### THE PROBLEM:
- Keeps getting 403 errors on `/api/schedule/teams/all` and other endpoints
- Error message: "Failed to load team information"
- Shows "No schedule data available"

### ROOT CAUSE:
1. The endpoint `/api/schedule/teams/all` requires `[Authorize(Roles = "Manager,Admin")]`
2. Your JWT token has the wrong role (TeamMember instead of Manager)
3. Even after fixing the role in the database, the OLD JWT token persists

### PERMANENT FIX:
**IMMEDIATE ACTION REQUIRED:**
1. **LOGOUT** - Click logout button in the app
2. **LOGIN AGAIN** with username: `admin` password: `password123`
3. This will generate a NEW JWT token with the correct Manager role

### BACKEND VERIFICATION:
- DatabaseSeeder.cs correctly creates admin with `UserRole.Admin` (line 148)
- The admin user (ID=1, username="admin") has the correct role

### IF PROBLEM PERSISTS:
1. Clear browser localStorage: Open DevTools Console and run:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. Verify role in backend by calling: `GET http://localhost:5199/api/dev/debug-users`

3. Alternative fix - Remove role restriction from endpoint (NOT RECOMMENDED for production):
   ```csharp
   // Change from:
   [Authorize(Roles = "Manager,Admin")]
   // To:
   [Authorize]
   ```

## 2. TEAM ASSIGNMENT ISSUE

### THE PROBLEM:
- New team members show "Unassigned" instead of their team name
- Conflicting team systems: Frontend enum vs Backend database

### SOLUTION IMPLEMENTED:
1. DatabaseSeeder now creates 4 teams: Structural, Non-Structural, BIM, R&D
2. Frontend uses `teamId` (number) instead of `teamType` (enum)
3. TeamMemberEditModal fetches teams from database dynamically

## 3. ALWAYS RUN AFTER DATABASE CHANGES:

```bash
# If you delete/reset the database:
1. Stop all backend processes
2. Delete designplanner.db files
3. Run: cd backend/DesignPlanner.Api && dotnet run
4. LOGOUT and LOGIN again to get new JWT token
```

## 4. COMMON ERRORS AND FIXES:

### Error: 403 Forbidden
**Fix:** Logout and login again

### Error: Failed to load teams
**Fix:** Check user role, logout/login

### Error: No schedule data available
**Fix:** Usually caused by 403 error, fix authorization first

## 5. TESTING CHECKLIST:

Before testing any feature:
- [ ] Backend is running
- [ ] Frontend is running
- [ ] You're logged in as admin
- [ ] Your JWT token is fresh (logout/login if unsure)

## 6. KEY ENDPOINTS AND ROLES:

```
/api/schedule/teams/all     - Requires: Manager, Admin
/api/schedule/teams         - Requires: Manager, Admin
/api/schedule/calendar      - Requires: Any authenticated user
/api/employee/teams         - Requires: Any authenticated user
```

## 7. DEFAULT USERS:

```
Username: admin
Password: password123
Role: Admin (can see all teams and schedules)

Username: alex.smith
Password: password123
Role: TeamMember (limited access)
```

## REMEMBER:
**THE MOST COMMON CAUSE OF 403 ERRORS IS AN OLD JWT TOKEN!**
**ALWAYS TRY LOGOUT/LOGIN FIRST!**