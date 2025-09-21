import { TeamMemberDto, EmployeeScheduleDto } from '../types/schedule';

// Keys for localStorage
const DELETED_MEMBERS_KEY = 'deletedTeamMembers';
const ADDED_MEMBERS_KEY = 'addedTeamMembers';
const UPDATED_MEMBERS_KEY = 'updatedTeamMembers';

// Storage interfaces
interface DeletedMember {
  employeeId: number;
  deletedAt: string;
}

interface AddedMember extends TeamMemberDto {
  addedAt: string;
}

interface UpdatedMember extends TeamMemberDto {
  updatedAt: string;
}

// Helper to safely parse JSON from localStorage
const safeParseJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Failed to parse localStorage key ${key}:`, error);
    return defaultValue;
  }
};

// Deleted members storage
export const storeDeletedMember = (employeeId: number): void => {
  const deleted = getDeletedMembers();
  const newDeleted: DeletedMember = {
    employeeId,
    deletedAt: new Date().toISOString()
  };

  // Remove if already exists and add new entry
  const filtered = deleted.filter(d => d.employeeId !== employeeId);
  filtered.push(newDeleted);

  localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(filtered));
};

export const getDeletedMembers = (): DeletedMember[] => {
  return safeParseJSON(DELETED_MEMBERS_KEY, []);
};

export const isEmployeeDeleted = (employeeId: number): boolean => {
  return getDeletedMembers().some(d => d.employeeId === employeeId);
};

// Added members storage
export const storeAddedMember = (member: TeamMemberDto): void => {
  const added = getAddedMembers();
  const newAdded: AddedMember = {
    ...member,
    addedAt: new Date().toISOString()
  };

  // Remove if already exists and add new entry
  const filtered = added.filter(a => a.employeeId !== member.employeeId);
  filtered.push(newAdded);

  localStorage.setItem(ADDED_MEMBERS_KEY, JSON.stringify(filtered));
};

export const getAddedMembers = (): AddedMember[] => {
  return safeParseJSON(ADDED_MEMBERS_KEY, []);
};

// Updated members storage
export const storeUpdatedMember = (member: TeamMemberDto): void => {
  const updated = getUpdatedMembers();
  const newUpdated: UpdatedMember = {
    ...member,
    updatedAt: new Date().toISOString()
  };

  // Remove if already exists and add new entry
  const filtered = updated.filter(u => u.employeeId !== member.employeeId);
  filtered.push(newUpdated);

  localStorage.setItem(UPDATED_MEMBERS_KEY, JSON.stringify(filtered));
};

export const getUpdatedMembers = (): UpdatedMember[] => {
  return safeParseJSON(UPDATED_MEMBERS_KEY, []);
};

// Apply all stored changes to calendar data
export const applyStoredTeamMemberChanges = (employees: EmployeeScheduleDto[], calendarDays?: any[]): EmployeeScheduleDto[] => {
  let result = [...employees];

  // 1. Remove deleted members
  const deletedIds = getDeletedMembers().map(d => d.employeeId);
  result = result.filter(emp => !deletedIds.includes(emp.employeeId));

  // 2. Apply updates to existing members
  const updatedMembers = getUpdatedMembers();
  result = result.map(emp => {
    const update = updatedMembers.find(u => u.employeeId === emp.employeeId);
    if (update) {
      return {
        ...emp,
        employeeName: update.employeeName,
        firstName: update.firstName,
        lastName: update.lastName,
        role: update.role,
        team: update.team,
        teamType: update.teamType,
        skills: update.skills,
        startDate: update.startDate,
        isActive: update.isActive,
        notes: update.notes
      };
    }
    return emp;
  });

  // 3. Add new members with proper day assignment structure (but exclude deleted ones)
  const allAddedMembers = getAddedMembers();
  const addedMembers = allAddedMembers.filter(member => !deletedIds.includes(member.employeeId));

  if (deletedIds.length > 0) {
    console.log('🔍 Deleted IDs:', deletedIds);
    console.log('🔍 All added members:', allAddedMembers.map(m => m.employeeId));
    console.log('🔍 Added members after filtering deleted:', addedMembers.map(m => m.employeeId));
  }
  if (addedMembers.length > 0) {
    // Create proper dayAssignments structure based on existing employees or calendar days
    const templateDayAssignments = result.length > 0
      ? result[0].dayAssignments.map(day => ({
          ...day,
          assignments: [],
          totalAssignments: 0,
          hasConflicts: false
        }))
      : calendarDays?.map(day => ({
          date: day.date,
          dayName: day.dayName,
          displayDate: day.displayDate,
          isWeekend: day.isWeekend,
          isHoliday: day.isHoliday,
          assignments: [],
          totalAssignments: 0,
          hasConflicts: false
        })) || [];

    const newEmployees: EmployeeScheduleDto[] = addedMembers.map(member => ({
      employeeId: member.employeeId,
      employeeName: member.employeeName,
      role: member.role,
      team: member.team,
      isActive: member.isActive,
      dayAssignments: templateDayAssignments,
      firstName: member.firstName,
      lastName: member.lastName,
      teamType: member.teamType,
      skills: member.skills,
      startDate: member.startDate,
      notes: member.notes
    }));

    result = [...result, ...newEmployees];
  }

  // 4. Sort alphabetically by name
  result.sort((a, b) => {
    const nameA = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.employeeName;
    const nameB = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.employeeName;
    return nameA.localeCompare(nameB);
  });

  return result;
};

// Clean up old entries (optional - call periodically)
export const cleanupOldEntries = (maxAgeInDays: number = 30): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
  const cutoffTime = cutoffDate.getTime();

  // Clean deleted members
  const deleted = getDeletedMembers().filter(d =>
    new Date(d.deletedAt).getTime() > cutoffTime
  );
  localStorage.setItem(DELETED_MEMBERS_KEY, JSON.stringify(deleted));

  // Clean added members
  const added = getAddedMembers().filter(a =>
    new Date(a.addedAt).getTime() > cutoffTime
  );
  localStorage.setItem(ADDED_MEMBERS_KEY, JSON.stringify(added));

  // Clean updated members
  const updated = getUpdatedMembers().filter(u =>
    new Date(u.updatedAt).getTime() > cutoffTime
  );
  localStorage.setItem(UPDATED_MEMBERS_KEY, JSON.stringify(updated));
};

// Clear all stored changes (for testing/reset)
export const clearAllStoredChanges = (): void => {
  localStorage.removeItem(DELETED_MEMBERS_KEY);
  localStorage.removeItem(ADDED_MEMBERS_KEY);
  localStorage.removeItem(UPDATED_MEMBERS_KEY);
};