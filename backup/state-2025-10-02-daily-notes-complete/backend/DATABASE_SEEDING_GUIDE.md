# DesignPlanner Database Seeding Guide

This guide explains how to populate the DesignPlanner database with comprehensive sample data for development and testing purposes.

## Overview

The database seeder creates realistic sample data including:

- **6 Users** (1 Manager + 5 Team Members) with simple passwords for testing
- **1 Team** (Design & Development Team) with all employees assigned
- **5 Clients** with specific colors: AWS (#FF9900), MSFT (#0078D4), GOOGLE (#4285F4), EQX (#ED1C24), TATE (#000000)
- **10 Projects** using ABC123 format (AWS001, MSF023, GOO017, etc.)
- **35+ Tasks** with realistic assignments across current and next week
- **Task Assignments** demonstrating 4-task-per-slot layout
- **6 Leave Requests** (mix of pending and approved)
- **Employee Skills** with proficiency levels
- **Realistic leave balances** and usage tracking

## Methods to Seed the Database

### Method 1: Development API Endpoint (Recommended for Development)

When running the application in Development mode, you can use the built-in API endpoint:

```bash
# Basic seeding (only adds data if database is empty)
POST http://localhost:5000/api/dev/seed-database

# Force recreate (clears and recreates all sample data)
POST http://localhost:5000/api/dev/seed-database?forceRecreate=true
```

Using curl:
```bash
# Basic seeding
curl -X POST "http://localhost:5000/api/dev/seed-database"

# Force recreate
curl -X POST "http://localhost:5000/api/dev/seed-database?forceRecreate=true"
```

### Method 2: Console Application (Standalone)

Navigate to the Data project directory and run the seeder:

```bash
cd DesignPlannerWeb/backend/DesignPlanner.Data
dotnet run

# Force recreate all data
dotnet run -- --force

# Verbose output
dotnet run -- --verbose

# Show help
dotnet run -- --help
```

### Method 3: Programmatic Integration

You can integrate seeding into your application startup or other services:

```csharp
// In your service or startup code
using var scope = serviceProvider.CreateScope();
var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();

// Basic seeding
await seeder.SeedAsync();

// Force recreate
await seeder.SeedAsync(forceRecreate: true);
```

## Configuration

### Connection String

Update the connection string in the appropriate configuration file:

**For API endpoint**: `DesignPlanner.Api/appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DesignPlannerDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
  }
}
```

**For Console Application**: `DesignPlanner.Data/appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DesignPlannerDB;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
  }
}
```

Or pass via command line:
```bash
dotnet run -- --ConnectionStrings:DefaultConnection="your_connection_string"
```

## Sample Login Credentials

After seeding, you can use these accounts for testing:

### Manager Account
- **Username**: `manager`
- **Password**: `password123`
- **Role**: Manager
- **Name**: Sarah Johnson
- **Position**: Team Manager

### Team Member Accounts
- **Username**: `alex.smith` | **Password**: `password123` | **Position**: Senior UI/UX Designer
- **Username**: `emma.wilson` | **Password**: `password123` | **Position**: Full Stack Developer  
- **Username**: `david.brown` | **Password**: `password123` | **Position**: Backend Developer
- **Username**: `lisa.taylor` | **Password**: `password123` | **Position**: Frontend Developer
- **Username**: `mike.garcia` | **Password**: `password123` | **Position**: QA Tester

## Sample Data Details

### Clients and Projects

| Client | Color | Projects |
|--------|-------|----------|
| AWS | #FF9900 (Orange) | AWS001 - Cloud Migration Dashboard, AWS015 - Serverless Analytics Platform |
| MSFT | #0078D4 (Blue) | MSF023 - Teams Integration Suite, MSF056 - Azure DevOps Extensions |
| GOOGLE | #4285F4 (Google Blue) | GOO017 - Firebase Real-time Chat App, GOO029 - Google Workspace Automation |
| EQX | #ED1C24 (Red) | EQX042 - Data Center Monitoring System, EQX011 - Network Performance Analytics |
| TATE | #000000 (Black) | TAT008 - Digital Art Gallery Platform, TAT003 - Virtual Museum Tours |

### Task Types and Colors

- **Design** (#FF6B6B) - UI/UX Design tasks
- **Development** (#4ECDC4) - Software development tasks
- **Testing** (#45B7D1) - Quality assurance and testing
- **Research** (#96CEB4) - Research and analysis tasks
- **Planning** (#FECA57) - Project planning and management
- **Review** (#FF9FF3) - Code review and documentation

### Leave Requests Sample Data

- **Past approved leave**: Alex Smith's family vacation (3 days)
- **Upcoming training**: Lisa Taylor's React Advanced Conference (3 days)
- **Pending annual leave**: Emma Wilson's Europe trip (5 days)
- **Pending sick leave**: Mike Garcia's doctor appointment (1 day)
- **Half-day approved**: David Brown's afternoon appointment (0.5 days)
- **Manager leave**: Sarah Johnson's family vacation (6 days)

## Testing Scenarios

The seeded data is designed to test:

### Calendar Views
- **Daily View**: See individual employee schedules with tasks
- **Weekly View**: View team workload distribution
- **Biweekly View**: Extended planning and task assignments
- **Monthly View**: Long-term project planning and leave requests

### Drag-and-Drop Functionality
- Tasks are assigned to both Morning and Afternoon slots
- Multiple tasks per slot (up to 4 tasks demonstrated)
- Different task priorities and statuses for testing

### Leave Request Workflows
- Manager approval workflow (pending requests)
- Different leave types (Annual, Sick, Training)
- Half-day leave functionality
- Leave balance tracking

### Team Management Features
- Employee skill tracking and proficiency levels
- Position-based task assignments
- Team-wide workload visibility
- Manager oversight capabilities

## Troubleshooting

### Database Connection Issues
1. Ensure SQL Server is running
2. Verify connection string is correct
3. Check that the database server allows the connection
4. For LocalDB, ensure it's installed and running

### Seeding Fails with Existing Data
- Use `--force` flag to clear and recreate all data
- Or manually clear specific tables if you want to preserve some data

### Migration Issues
- Ensure all migrations are applied: `dotnet ef database update`
- Check for pending migrations: `dotnet ef migrations list`

### Permission Issues
- Ensure the database user has CREATE, INSERT, UPDATE, DELETE permissions
- For integrated security, ensure your Windows user has appropriate database access

## Development Notes

### Safe Seeding
- The seeder checks for existing data by default
- Use `forceRecreate=true` to clear and regenerate all sample data
- Entity relationships are maintained correctly
- All foreign key constraints are respected

### Extensibility
The seeder is designed to be easily extended:
- Add new sample entities in the respective seed methods
- Modify date ranges for different testing scenarios  
- Adjust task distribution patterns
- Add new skill categories or leave types

### Performance
- Seeding typically takes 5-10 seconds depending on database performance
- Uses Entity Framework bulk operations where possible
- Includes proper logging for monitoring progress

## Support

If you encounter issues with database seeding:

1. Check the application logs for detailed error messages
2. Use `--verbose` flag with console application for detailed output
3. Verify database permissions and connection string
4. Ensure all required NuGet packages are installed
5. Check that Entity Framework migrations are up to date

The sample data provides a comprehensive foundation for testing all aspects of the DesignPlanner application in a realistic environment.