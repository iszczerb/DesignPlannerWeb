/**
 * Comprehensive TypeScript interfaces for DesignPlanner database entities
 * These interfaces map to the backend DTOs and provide type safety for frontend operations
 */

import React from 'react';

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Entity types for database management
 */
export enum EntityType {
  Clients = 'clients',
  Projects = 'projects',
  Users = 'users',
  Teams = 'teams',
  Skills = 'skills',
  TaskTypes = 'taskTypes',
  Categories = 'categories'
}

/**
 * Project status enumeration matching backend ProjectStatus enum
 */
export enum ProjectStatus {
  Planning = 1,
  Active = 2,
  OnHold = 3,
  Completed = 4,
  Cancelled = 5
}

/**
 * Labels for project status
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.Planning]: 'Planning',
  [ProjectStatus.Active]: 'Active',
  [ProjectStatus.OnHold]: 'On Hold',
  [ProjectStatus.Completed]: 'Completed',
  [ProjectStatus.Cancelled]: 'Cancelled'
};

/**
 * Colors for project status
 */
export const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  [ProjectStatus.Planning]: '#f59e0b',
  [ProjectStatus.Active]: '#10b981',
  [ProjectStatus.OnHold]: '#6b7280',
  [ProjectStatus.Completed]: '#059669',
  [ProjectStatus.Cancelled]: '#dc2626'
};

/**
 * Holiday type enumeration matching backend HolidayType enum
 */
export enum HolidayType {
  BankHoliday = 1,
  CompanyHoliday = 2
}

/**
 * Labels for holiday types
 */
export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  [HolidayType.BankHoliday]: 'Bank Holiday',
  [HolidayType.CompanyHoliday]: 'Company Holiday'
};

/**
 * Colors for holiday types
 */
export const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
  [HolidayType.BankHoliday]: '#dc2626',
  [HolidayType.CompanyHoliday]: '#2563eb'
};

/**
 * User role enumeration for authorization
 */
export enum UserRole {
  Admin = 1,
  Manager = 2,
  TeamMember = 3
}

/**
 * Management level enumeration
 */
export enum ManagementLevel {
  None = 0,
  TeamLead = 1,
  Manager = 2,
  Director = 3,
  Executive = 4
}

/**
 * Labels for user roles
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.Manager]: 'Manager',
  [UserRole.TeamMember]: 'Team Member'
};

/**
 * Colors for user roles
 */
export const USER_ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.Admin]: '#dc2626',
  [UserRole.Manager]: '#2563eb',
  [UserRole.TeamMember]: '#059669'
};

/**
 * Labels for management levels
 */
export const MANAGEMENT_LEVEL_LABELS: Record<ManagementLevel, string> = {
  [ManagementLevel.None]: 'No Management',
  [ManagementLevel.TeamLead]: 'Team Lead',
  [ManagementLevel.Manager]: 'Manager',
  [ManagementLevel.Director]: 'Director',
  [ManagementLevel.Executive]: 'Executive'
};

/**
 * Colors for management levels
 */
export const MANAGEMENT_LEVEL_COLORS: Record<ManagementLevel, string> = {
  [ManagementLevel.None]: '#6b7280',
  [ManagementLevel.TeamLead]: '#059669',
  [ManagementLevel.Manager]: '#2563eb',
  [ManagementLevel.Director]: '#7c3aed',
  [ManagementLevel.Executive]: '#dc2626'
};

/**
 * Holiday status based on date relative to today
 */
export enum HolidayStatus {
  Past = 'past',
  Today = 'today',
  Upcoming = 'upcoming',
  Future = 'future'
}

// ============================================================================
// CLIENT INTERFACES
// ============================================================================

/**
 * Complete client entity data
 */
export interface Client {
  /** Client unique identifier */
  id: number;
  /** Client code (e.g., AWS, MSFT, GOOGLE) */
  code: string;
  /** Client name */
  name: string;
  /** Client description */
  description?: string;
  /** Contact email address */
  contactEmail?: string;
  /** Contact phone number */
  contactPhone?: string;
  /** Client address */
  address?: string;
  /** Whether the client is active */
  isActive: boolean;
  /** Client color for visual identification */
  color: string;
  /** When the client was created */
  createdAt: Date;
  /** Number of active projects for this client */
  projectCount: number;
}

/**
 * Interface for creating a new client
 */
export interface CreateClient {
  /** Client code (e.g., AWS, MSFT, GOOGLE) */
  code: string;
  /** Client name */
  name: string;
  /** Client description */
  description?: string;
  /** Client color for visual identification */
  color: string;
}

/**
 * Interface for updating an existing client
 */
export interface UpdateClient {
  /** Client unique identifier */
  id: number;
  /** Client code (e.g., AWS, MSFT, GOOGLE) */
  code: string;
  /** Client name */
  name: string;
  /** Client description */
  description?: string;
  /** Client color for visual identification */
  color: string;
  /** Whether the client is active */
  isActive: boolean;
}

/**
 * Response interface for paginated client lists
 */
export interface ClientListResponse {
  /** List of clients */
  clients: Client[];
  /** Total number of clients */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching clients
 */
export interface ClientQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering clients */
  searchTerm?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// PROJECT INTERFACES
// ============================================================================

/**
 * Complete project entity data
 */
export interface Project {
  /** Project unique identifier */
  id: number;
  /** Client identifier */
  clientId: number;
  /** Client name */
  clientName: string;
  /** Category identifier */
  categoryId?: number;
  /** Category name */
  categoryName?: string;
  /** Category color */
  categoryColor?: string;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Project status */
  status: ProjectStatus;
  /** Project status display name */
  statusName: string;
  /** Project start date */
  startDate?: Date;
  /** Project end date */
  endDate?: Date;
  /** Project deadline date */
  deadlineDate?: Date;
  /** When the project was created */
  createdAt: Date;
  /** When the project was last updated */
  updatedAt: Date;
  /** Number of tasks in the project */
  taskCount: number;
  /** Project duration in days */
  duration?: number;
  /** Whether the project is overdue */
  isOverdue: boolean;
}

/**
 * Interface for creating a new project
 */
export interface CreateProject {
  /** Client identifier for the project */
  clientId: number;
  /** Category identifier for the project */
  categoryId?: number;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Project status */
  status?: ProjectStatus;
  /** Project start date */
  startDate?: Date;
  /** Project end date (optional) */
  endDate?: Date;
  /** Project deadline date (optional) */
  deadlineDate?: Date;
}

/**
 * Interface for updating an existing project
 */
export interface UpdateProject {
  /** Project unique identifier */
  id: number;
  /** Client identifier for the project */
  clientId: number;
  /** Category identifier for the project */
  categoryId?: number;
  /** Project name */
  name: string;
  /** Project description */
  description?: string;
  /** Project status */
  status: ProjectStatus;
  /** Project start date */
  startDate?: Date;
  /** Project end date (optional) */
  endDate?: Date;
  /** Project deadline date (optional) */
  deadlineDate?: Date;
}

/**
 * Response interface for paginated project lists
 */
export interface ProjectListResponse {
  /** List of projects */
  projects: Project[];
  /** Total number of projects */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching projects
 */
export interface ProjectQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering projects */
  searchTerm?: string;
  /** Filter by client */
  clientId?: number;
  /** Filter by project status */
  status?: ProjectStatus;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by start date from */
  startDateFrom?: Date;
  /** Filter by start date to */
  startDateTo?: Date;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// TEAM INTERFACES
// ============================================================================

/**
 * Team member information
 */
export interface TeamMember {
  /** Employee unique identifier */
  id: number;
  /** Employee ID */
  employeeId?: string;
  /** Employee first name */
  firstName: string;
  /** Employee last name */
  lastName: string;
  /** Employee full name */
  fullName: string;
  /** Employee position */
  position?: string;
  /** Whether the employee is active */
  isActive: boolean;
  /** Employee hire date */
  hireDate?: Date;
}

/**
 * Complete team entity data
 */
export interface Team {
  /** Team unique identifier */
  id: number;
  /** Team name */
  name: string;
  /** Team code (e.g., TEAM01, STR, BIM) */
  code: string;
  /** Team description */
  description?: string;
  /** Whether the team is active */
  isActive: boolean;
  /** When the team was created */
  createdAt: Date;
  /** Number of members in the team */
  memberCount: number;
  /** Number of active members in the team */
  activeMemberCount: number;
  /** Team manager ID (user with Manager role assigned to this team) */
  managerId?: number;
  /** Team manager name (full name of the manager) */
  managerName?: string;
  /** List of team members (when included) */
  members?: TeamMember[];
}

/**
 * Interface for creating a new team
 */
export interface CreateTeam {
  /** Team name */
  name: string;
  /** Team code (e.g., TEAM01, STR, BIM) */
  code: string;
  /** Team description */
  description?: string;
}

/**
 * Interface for updating an existing team
 */
export interface UpdateTeam {
  /** Team unique identifier */
  id: number;
  /** Team name */
  name: string;
  /** Team code (e.g., TEAM01, STR, BIM) */
  code: string;
  /** Team description */
  description?: string;
  /** Whether the team is active */
  isActive: boolean;
}

/**
 * Response interface for paginated team lists
 */
export interface TeamListResponse {
  /** List of teams */
  teams: Team[];
  /** Total number of teams */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching teams
 */
export interface TeamQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering teams */
  searchTerm?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Include member count in response */
  includeMemberCount?: boolean;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// SKILL INTERFACES
// ============================================================================

/**
 * Complete skill entity data
 */
export interface Skill {
  /** Skill unique identifier */
  id: number;
  /** Skill name */
  name: string;
  /** Skill description */
  description?: string;
  /** Skill category */
  category?: SkillCategory;
  /** Whether the skill is active */
  isActive: boolean;
  /** When the skill was created */
  createdAt: Date;
  /** Number of employees with this skill */
  employeesCount: number;
  /** Number of task types that require this skill */
  taskTypesCount: number;
}

/**
 * Skill category enumeration
 */
export enum SkillCategory {
  Technical = 'Technical',
  Software = 'Software',
  Management = 'Management',
  Communication = 'Communication',
  Design = 'Design',
  Other = 'Other'
}

/**
 * Labels for skill categories
 */
export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  [SkillCategory.Technical]: 'Technical',
  [SkillCategory.Software]: 'Software',
  [SkillCategory.Management]: 'Management',
  [SkillCategory.Communication]: 'Communication',
  [SkillCategory.Design]: 'Design',
  [SkillCategory.Other]: 'Other'
};

/**
 * Colors for skill categories
 */
export const SKILL_CATEGORY_COLORS: Record<SkillCategory, string> = {
  [SkillCategory.Technical]: '#2563eb',
  [SkillCategory.Software]: '#059669',
  [SkillCategory.Management]: '#dc2626',
  [SkillCategory.Communication]: '#7c3aed',
  [SkillCategory.Design]: '#ea580c',
  [SkillCategory.Other]: '#6b7280'
};

/**
 * Interface for creating a new skill
 */
export interface CreateSkill {
  /** Skill name */
  name: string;
  /** Skill description */
  description?: string;
  /** Skill category */
  category?: string;
}

/**
 * Interface for updating an existing skill
 */
export interface UpdateSkill {
  /** Skill unique identifier */
  id: number;
  /** Skill name */
  name: string;
  /** Skill description */
  description?: string;
  /** Skill category */
  category?: string;
  /** Whether the skill is active */
  isActive: boolean;
}

/**
 * Response interface for paginated skill lists
 */
export interface SkillListResponse {
  /** List of skills */
  skills: Skill[];
  /** Total number of skills */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching skills
 */
export interface SkillQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering skills */
  searchTerm?: string;
  /** Filter by category */
  category?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// TASK TYPE INTERFACES
// ============================================================================

/**
 * Required skill for a task type
 */
export interface RequiredSkill {
  /** Skill unique identifier */
  id: number;
  /** Skill name */
  name: string;
  /** Whether this skill is required or optional */
  isRequired: boolean;
}

/**
 * Complete task type entity data
 */
export interface TaskType {
  /** Task type unique identifier */
  id: number;
  /** Task type name */
  name: string;
  /** Task type description */
  description?: string;
  /** Task type color (hex code) */
  color: string;
  /** Whether the task type is active */
  isActive: boolean;
  /** When the task type was created */
  createdAt: Date;
  /** Required skills for this task type (skill IDs) */
  skills: number[];
  /** Required skills details */
  requiredSkills: RequiredSkill[];
  /** Number of tasks of this type */
  taskCount: number;
}

/**
 * Interface for creating a new task type
 */
export interface CreateTaskType {
  /** Task type name */
  name: string;
  /** Task type description */
  description?: string;
  /** List of skill IDs for this task type */
  skills: number[];
}

/**
 * Interface for updating an existing task type
 */
export interface UpdateTaskType {
  /** Task type unique identifier */
  id: number;
  /** Task type name */
  name: string;
  /** Task type description */
  description?: string;
  /** List of skill IDs for this task type */
  skills: number[];
}

/**
 * Response interface for paginated task type lists
 */
export interface TaskTypeListResponse {
  /** List of task types */
  taskTypes: TaskType[];
  /** Total number of task types */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching task types
 */
export interface TaskTypeQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering task types */
  searchTerm?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by required skill */
  skillId?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// CATEGORY INTERFACES
// ============================================================================

/**
 * Complete category entity data
 */
export interface Category {
  /** Category unique identifier */
  id: number;
  /** Category name */
  name: string;
  /** Category description */
  description?: string;
  /** Category color (hex code) */
  color: string;
  /** Whether the category is active */
  isActive: boolean;
  /** When the category was created */
  createdAt: Date;
  /** Number of projects using this category */
  projectCount: number;
}

/**
 * Interface for creating a new category
 */
export interface CreateCategory {
  /** Category name */
  name: string;
  /** Category description */
  description?: string;
  /** Category color (hex code) */
  color: string;
}

/**
 * Interface for updating an existing category
 */
export interface UpdateCategory {
  /** Category unique identifier */
  id: number;
  /** Category name */
  name: string;
  /** Category description */
  description?: string;
  /** Category color (hex code) */
  color: string;
  /** Whether the category is active */
  isActive: boolean;
}

/**
 * Response interface for paginated category lists
 */
export interface CategoryListResponse {
  /** List of categories */
  categories: Category[];
  /** Total number of categories */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching categories
 */
export interface CategoryQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering categories */
  searchTerm?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// HOLIDAY INTERFACES
// ============================================================================

/**
 * Complete holiday entity data
 */
export interface Holiday {
  /** Holiday unique identifier */
  id: number;
  /** Holiday name */
  name: string;
  /** Holiday date */
  date: Date;
  /** Holiday type */
  type: HolidayType;
  /** Holiday type display name */
  typeName: string;
  /** Holiday description */
  description?: string;
  /** Whether this is a recurring holiday (annual) */
  isRecurring: boolean;
  /** Whether the holiday is active */
  isActive: boolean;
  /** When the holiday was created */
  createdAt: Date;
  /** When the holiday was last updated */
  updatedAt?: Date;
  /** Day of the week for the holiday */
  dayOfWeek: string;
  /** Number of days until the holiday (negative if past) */
  daysUntil: number;
  /** Holiday status based on date */
  status: HolidayStatus;
}

/**
 * Interface for creating a new holiday
 */
export interface CreateHoliday {
  /** Holiday name */
  name: string;
  /** Holiday date */
  date: Date;
  /** Holiday type */
  type: HolidayType;
  /** Holiday description */
  description?: string;
  /** Whether this is a recurring holiday (annual) */
  isRecurring?: boolean;
}

/**
 * Interface for updating an existing holiday
 */
export interface UpdateHoliday {
  /** Holiday unique identifier */
  id: number;
  /** Holiday name */
  name: string;
  /** Holiday date */
  date: Date;
  /** Holiday type */
  type: HolidayType;
  /** Holiday description */
  description?: string;
  /** Whether this is a recurring holiday (annual) */
  isRecurring: boolean;
  /** Whether the holiday is active */
  isActive: boolean;
}

/**
 * Response interface for paginated holiday lists
 */
export interface HolidayListResponse {
  /** List of holidays */
  holidays: Holiday[];
  /** Total number of holidays */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching holidays
 */
export interface HolidayQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering holidays */
  searchTerm?: string;
  /** Filter by holiday type */
  type?: HolidayType;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by recurring status */
  isRecurring?: boolean;
  /** Filter by year */
  year?: number;
  /** Filter by month (1-12) */
  month?: number;
  /** Filter by date range start */
  dateFrom?: Date;
  /** Filter by date range end */
  dateTo?: Date;
  /** Include only upcoming holidays */
  onlyUpcoming?: boolean;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Holiday calendar response for month/year view
 */
export interface HolidayCalendarResponse {
  /** Year of the calendar */
  year: number;
  /** Month of the calendar (1-12, or null for full year) */
  month?: number;
  /** List of holidays in the specified period */
  holidays: Holiday[];
  /** Total number of holidays in the period */
  totalCount: number;
  /** Number of bank holidays */
  bankHolidayCount: number;
  /** Number of company holidays */
  companyHolidayCount: number;
}

/**
 * Interface for bulk holiday creation
 */
export interface BulkCreateHolidays {
  /** List of holidays to create */
  holidays: CreateHoliday[];
  /** Whether to skip holidays that already exist (by name and date) */
  skipExisting?: boolean;
}

// ============================================================================
// PAGINATION & COMMON INTERFACES
// ============================================================================

/**
 * Generic pagination parameters
 */
export interface PaginationParams {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  /** Response data */
  data: T;
  /** Success indicator */
  success: boolean;
  /** Error message if any */
  message?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Total number of items */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a previous page */
  hasPreviousPage: boolean;
  /** Whether there is a next page */
  hasNextPage: boolean;
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Field name that has the error */
  field: string;
  /** Error message */
  message: string;
  /** Error code if applicable */
  code?: string;
}

/**
 * Form validation errors
 */
export interface ValidationErrors {
  /** Array of validation errors */
  errors: ValidationError[];
  /** General error message */
  message?: string;
}

// ============================================================================
// DATABASE MANAGEMENT INTERFACES
// ============================================================================

/**
 * Database management modal props
 */
export interface DatabaseManagementModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Initial tab to show */
  initialTab?: EntityType;
}

/**
 * Database management modal state
 */
export interface DatabaseManagementState {
  /** Whether any modal is open */
  isOpen: boolean;
  /** Currently active tab */
  activeTab: DatabaseTab;
  /** Selected item for editing */
  selectedItem: any;
  /** Whether we're in create mode */
  isCreating: boolean;
  /** Whether we're in edit mode */
  isEditing: boolean;
  /** Whether we're in view mode */
  isViewing: boolean;
}

/**
 * Database management tabs
 */
export enum DatabaseTab {
  Clients = 'clients',
  Projects = 'projects',
  Teams = 'teams',
  Skills = 'skills',
  TaskTypes = 'taskTypes',
  Holidays = 'holidays'
}

// ============================================================================
// CONSTANTS & LABELS
// ============================================================================

/**
 * Holiday status labels
 */
export const HOLIDAY_STATUS_LABELS: Record<HolidayStatus, string> = {
  [HolidayStatus.Past]: 'Past',
  [HolidayStatus.Today]: 'Today',
  [HolidayStatus.Upcoming]: 'Upcoming',
  [HolidayStatus.Future]: 'Future'
};


/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  pageNumber: 1,
  pageSize: 10,
  sortBy: 'name',
  sortDirection: 'asc' as const
};

/**
 * Color validation regex for hex colors
 */
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

/**
 * Default colors for task types
 */
export const DEFAULT_TASK_TYPE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#f97316', // Orange
  '#6366f1'  // Indigo
];

// ============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// ============================================================================

/** @deprecated Use CreateClient instead */
export type CreateClientDto = CreateClient;
/** @deprecated Use UpdateClient instead */
export type UpdateClientDto = UpdateClient;
/** @deprecated Use CreateProject instead */
export type CreateProjectDto = CreateProject;
/** @deprecated Use UpdateProject instead */
export type UpdateProjectDto = UpdateProject;
/** @deprecated Use CreateTeam instead */
export type CreateTeamDto = CreateTeam;
/** @deprecated Use UpdateTeam instead */
export type UpdateTeamDto = UpdateTeam;
/** @deprecated Use CreateSkill instead */
export type CreateSkillDto = CreateSkill;
/** @deprecated Use UpdateSkill instead */
export type UpdateSkillDto = UpdateSkill;
/** @deprecated Use CreateTaskType instead */
export type CreateTaskTypeDto = CreateTaskType;
/** @deprecated Use UpdateTaskType instead */
export type UpdateTaskTypeDto = UpdateTaskType;
/** @deprecated Use CreateHoliday instead */
export type CreateHolidayDto = CreateHoliday;
/** @deprecated Use UpdateHoliday instead */
export type UpdateHolidayDto = UpdateHoliday;

/**
 * Generic bulk action result interface
 */
export interface BulkActionResult {
  /** Number of items successfully processed */
  successCount: number;
  /** Number of items that failed */
  errorCount: number;
  /** Total number of items attempted */
  totalCount: number;
  /** List of error messages if any */
  errors?: string[];
  /** Whether the operation was completely successful */
  success: boolean;
}

// ============================================================================
// FORM INTERFACES
// ============================================================================

/**
 * Generic props interface for entity forms
 */
export interface EntityFormProps<TEntity, TCreateDto, TUpdateDto> {
  /** Whether the form modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Save handler for create/update */
  onSave: (data: TCreateDto | TUpdateDto) => Promise<void>;
  /** Current entity being edited (undefined for create mode) */
  entity?: TEntity;
  /** Whether creating a new entity (vs editing) */
  isCreating: boolean;
  /** Whether the form is in loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
}

// ============================================================================
// DATA TABLE INTERFACES
// ============================================================================

/**
 * Bulk action type enumeration
 */
export enum BulkActionType {
  Delete = 'delete',
  Activate = 'activate',
  Deactivate = 'deactivate',
  Export = 'export'
}

/**
 * Table column definition
 */
export interface TableColumn<T = any> {
  /** Column key */
  key: string;
  /** Display label */
  label: string;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Render function for custom cell content */
  render?: (value: any, row: T) => React.ReactNode;
}

/**
 * Table filtering options
 */
export interface TableFilters {
  /** Search query */
  search?: string;
  /** Status filter */
  status?: string;
  /** Category filter */
  category?: string;
  /** Custom filters */
  [key: string]: any;
}

/**
 * Table sorting configuration
 */
export interface TableSort {
  /** Field to sort by */
  field: string;
  /** Sort direction */
  direction: 'asc' | 'desc';
}

// ============================================================================
// USER INTERFACES
// ============================================================================

/**
 * User skill information
 */
export interface UserSkill {
  /** Skill unique identifier */
  id: number;
  /** Skill name */
  name: string;
  /** Skill category */
  category?: string;
}

/**
 * User team information
 */
export interface UserTeam {
  /** Team unique identifier */
  id: number;
  /** Team name */
  name: string;
  /** Team code */
  code: string;
}

/**
 * User employee information
 */
export interface UserEmployee {
  /** Employee unique identifier */
  id: number;
  /** Employee ID string */
  employeeId: string;
  /** Employee position */
  position?: string;
  /** Employee phone number */
  phoneNumber?: string;
  /** Team information */
  team?: UserTeam;
  /** List of employee skills */
  skills: UserSkill[];
}

/**
 * Complete user entity data
 */
export interface User {
  /** User unique identifier */
  id: number;
  /** User's username */
  username: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's full name */
  fullName: string;
  /** User's role in the system */
  role: UserRole;
  /** Whether the user is active */
  isActive: boolean;
  /** When the user was created */
  createdAt: Date;
  /** Last login timestamp */
  lastLoginAt?: Date;
  /** Employee information */
  employee?: UserEmployee;
}

/**
 * Interface for creating a new user
 */
export interface CreateUserDto {
  /** User's username (must be unique) */
  username: string;
  /** User's password */
  password: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's role in the system */
  role: UserRole;
  /** Team ID for employee assignment (required) */
  teamId: number;
  /** Management team ID (for managers only) */
  managedTeamId?: number;
  /** Employee position (optional) */
  position?: string;
  /** List of skill IDs for this user (optional) */
  skillIds: number[];
}

/**
 * Interface for updating an existing user
 */
export interface UpdateUserDto {
  /** User ID */
  id: number;
  /** User's username (must be unique) */
  username: string;
  /** User's first name */
  firstName: string;
  /** User's last name */
  lastName: string;
  /** User's role in the system */
  role: UserRole;
  /** Team ID for employee assignment (required) */
  teamId: number;
  /** Management team ID (for managers only) */
  managedTeamId?: number;
  /** Employee position (optional) */
  position?: string;
  /** List of skill IDs for this user (optional) */
  skillIds: number[];
  /** Whether the user is active */
  isActive: boolean;
}

/**
 * Response interface for paginated user lists
 */
export interface UserListResponse {
  /** List of users */
  users: User[];
  /** Total number of users */
  totalCount: number;
  /** Current page number */
  pageNumber: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * Query parameters for filtering and searching users
 */
export interface UserQuery {
  /** Page number for pagination */
  pageNumber?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Search term for filtering users */
  searchTerm?: string;
  /** Filter by active status */
  isActive?: boolean;
  /** Filter by user role */
  role?: UserRole;
  /** Filter by team ID */
  teamId?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction (asc or desc) */
  sortDirection?: 'asc' | 'desc';
}

// ============================================================================
// TABLE INTERFACES
// ============================================================================

/**
 * Table state management
 */
export interface TableState<T = any> {
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Selected rows */
  selectedRows: (string | number)[];
  /** Current filters */
  filters: TableFilters;
  /** Current sorting */
  sort: TableSort;
  /** Current pagination */
  pagination: PaginationParams;
  /** Table data */
  data?: T[];
}