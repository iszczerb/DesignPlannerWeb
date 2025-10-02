import {
  TeamMemberDto,
  EmployeeScheduleDto,
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  TeamType,
  TEAM_TYPE_LABELS
} from '../types/schedule';
import { EmployeeListItem } from '../types/employee';

// Utility functions for team member management and data generation




/**
 * Converts EmployeeListItem to TeamMemberDto using ONLY database data
 */
export const enhanceEmployeeWithTeamData = (employee: EmployeeListItem): TeamMemberDto => {
  // Split full name if needed
  const nameParts = employee.fullName?.split(' ') || [employee.firstName, employee.lastName];
  const firstName = employee.firstName || nameParts[0] || '';
  const lastName = employee.lastName || nameParts[nameParts.length - 1] || '';

  return {
    employeeId: employee.id,
    employeeName: employee.fullName || `${firstName} ${lastName}`,
    firstName,
    lastName,
    role: employee.position || '',
    team: employee.teamName || '',
    teamType: TeamType.Structural, // Default - should come from database
    teamId: employee.teamId || 1, // Default to first team
    skills: [], // Should come from database
    startDate: employee.hireDate || '',
    isActive: employee.isActive,
    notes: ''
  };
};

/**
 * Converts EmployeeScheduleDto to TeamMemberDto using ONLY database data
 */
export const enhanceScheduleEmployeeWithTeamData = (employee: EmployeeScheduleDto): TeamMemberDto => {
  // Split employeeName if needed - handle case where employeeName might be undefined
  const nameParts = (employee.employeeName || '').split(' ');
  const firstName = employee.firstName || nameParts[0] || '';
  const lastName = employee.lastName || nameParts[nameParts.length - 1] || '';

  return {
    employeeId: employee.employeeId,
    employeeName: employee.employeeName || `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    role: employee.role || '',
    team: employee.team || '',
    teamType: employee.teamType || TeamType.Structural,
    teamId: 1, // Default to first team - should come from database
    skills: employee.skills || [],
    startDate: employee.startDate || '',
    isActive: employee.isActive ?? true,
    notes: employee.notes || ''
  };
};





/**
 * Creates a new team member from CreateTeamMemberDto
 */
export const createTeamMember = (data: CreateTeamMemberDto): TeamMemberDto => {
  // Generate a unique employee ID (in a real app, this would come from the backend)
  const employeeId = Date.now(); // Simple unique ID based on timestamp

  return {
    employeeId,
    employeeName: `${data.firstName} ${data.lastName}`,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    team: '', // Will be set based on teamId
    teamType: TeamType.Structural, // Default
    teamId: data.teamId,
    skills: data.skills,
    startDate: data.startDate,
    isActive: true,
    notes: data.notes || `New team member`
  };
};

/**
 * Updates an existing team member from UpdateTeamMemberDto
 */
export const updateTeamMember = (existing: TeamMemberDto, updates: UpdateTeamMemberDto): TeamMemberDto => {
  const updatedMember = {
    ...existing,
    ...(updates.firstName && { firstName: updates.firstName }),
    ...(updates.lastName && { lastName: updates.lastName }),
    ...(updates.role && { role: updates.role }),
    ...(updates.teamId && { teamId: updates.teamId }),
    ...(updates.skills && { skills: updates.skills }),
    ...(updates.startDate && { startDate: updates.startDate }),
    ...(updates.isActive !== undefined && { isActive: updates.isActive }),
    ...(updates.notes !== undefined && { notes: updates.notes })
  };

  // Update employeeName if first or last name changed
  if (updates.firstName || updates.lastName) {
    updatedMember.employeeName = `${updatedMember.firstName} ${updatedMember.lastName}`;
  }

  return updatedMember;
};

export default {
  enhanceEmployeeWithTeamData,
  enhanceScheduleEmployeeWithTeamData,
  createTeamMember,
  updateTeamMember
};