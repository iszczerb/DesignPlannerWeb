import { AssignmentTaskDto, CreateAssignmentDto, UpdateAssignmentDto } from '../types/schedule';
import { getAddedMembers } from './teamMemberPersistence';

// Keys for localStorage
const LOCAL_ASSIGNMENTS_KEY = 'localTaskAssignments';
const LOCAL_ASSIGNMENT_COUNTER_KEY = 'localAssignmentCounter';

// Storage interfaces
interface LocalAssignment extends AssignmentTaskDto {
  isLocal: true;
  createdAt: string;
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

// Get next local assignment ID
const getNextLocalId = (): number => {
  const currentCounter = safeParseJSON(LOCAL_ASSIGNMENT_COUNTER_KEY, 1000000);
  const nextId = currentCounter + 1;
  localStorage.setItem(LOCAL_ASSIGNMENT_COUNTER_KEY, JSON.stringify(nextId));
  return nextId;
};

// Check if employee is a new member (exists only locally)
export const isNewMember = (employeeId: number): boolean => {
  const addedMembers = getAddedMembers();
  return addedMembers.some(member => member.employeeId === employeeId);
};

// Local assignment operations
export const storeLocalAssignment = (assignment: CreateAssignmentDto): LocalAssignment => {
  const assignments = getLocalAssignments();
  const newAssignment: LocalAssignment = {
    assignmentId: getNextLocalId(),
    taskId: assignment.taskId,
    employeeId: assignment.employeeId,
    assignedDate: assignment.assignedDate,
    slot: assignment.slot,
    estimatedHours: assignment.estimatedHours || 8,
    actualHours: null,
    notes: assignment.notes || '',
    isLocal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Default task properties for local assignments
    projectId: assignment.projectId || 1,
    taskTypeId: assignment.taskTypeId || 1,
    priority: assignment.priority || 2,
    status: assignment.status || 1,
    title: assignment.title || 'Local Task',
    description: assignment.description || '',
    startDate: assignment.assignedDate,
    dueDate: assignment.assignedDate,
    completedDate: null,
    projectName: 'Local Project',
    taskTypeName: 'Local Task Type'
  };

  assignments.push(newAssignment);
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  return newAssignment;
};

export const updateLocalAssignment = (assignmentId: number, updates: Partial<UpdateAssignmentDto>): LocalAssignment | null => {
  const assignments = getLocalAssignments();
  const assignmentIndex = assignments.findIndex(a => a.assignmentId === assignmentId);

  if (assignmentIndex === -1) {
    return null;
  }

  const assignment = assignments[assignmentIndex];
  const updatedAssignment: LocalAssignment = {
    ...assignment,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  assignments[assignmentIndex] = updatedAssignment;
  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
  return updatedAssignment;
};

export const deleteLocalAssignment = (assignmentId: number): boolean => {
  const assignments = getLocalAssignments();
  const filteredAssignments = assignments.filter(a => a.assignmentId !== assignmentId);

  if (filteredAssignments.length === assignments.length) {
    return false; // Assignment not found
  }

  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(filteredAssignments));
  return true;
};

export const getLocalAssignments = (): LocalAssignment[] => {
  return safeParseJSON(LOCAL_ASSIGNMENTS_KEY, []);
};

export const getLocalAssignmentsByEmployee = (employeeId: number): LocalAssignment[] => {
  return getLocalAssignments().filter(a => a.employeeId === employeeId);
};

export const getLocalAssignmentsByDateRange = (startDate: string, endDate: string): LocalAssignment[] => {
  return getLocalAssignments().filter(a =>
    a.assignedDate >= startDate && a.assignedDate <= endDate
  );
};

// Merge local assignments with backend assignments for specific employee and date
export const mergeAssignmentsWithLocal = (backendAssignments: AssignmentTaskDto[], employeeId?: number, date?: string): AssignmentTaskDto[] => {
  const localAssignments = getLocalAssignments();

  // Filter local assignments for specific employee and date if provided
  const relevantLocalAssignments = localAssignments.filter(assignment => {
    if (employeeId !== undefined && assignment.employeeId !== employeeId) {
      return false;
    }
    if (date !== undefined && assignment.assignedDate !== date) {
      return false;
    }
    return true;
  });

  return [...backendAssignments, ...relevantLocalAssignments];
};

// Check if assignment is local
export const isLocalAssignment = (assignmentId: number): boolean => {
  return getLocalAssignments().some(a => a.assignmentId === assignmentId);
};

// Clean up old local assignments (optional - call periodically)
export const cleanupOldLocalAssignments = (maxAgeInDays: number = 30): void => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);
  const cutoffTime = cutoffDate.getTime();

  const assignments = getLocalAssignments().filter(a =>
    new Date(a.createdAt).getTime() > cutoffTime
  );

  localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
};

// Clear all local assignments (for testing/reset)
export const clearAllLocalAssignments = (): void => {
  localStorage.removeItem(LOCAL_ASSIGNMENTS_KEY);
  localStorage.removeItem(LOCAL_ASSIGNMENT_COUNTER_KEY);
};