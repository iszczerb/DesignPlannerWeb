import { apiService } from './api';

// Enums to match backend
export enum AbsenceType {
  AnnualLeave = 1,
  SickDay = 2,
  Training = 3,
  BankHoliday = 4
}

// Types to match backend DTOs
export interface AbsenceAllocation {
  id: number;
  employeeId: number;
  employeeName: string;
  employeePosition: string;
  year: number;
  annualLeaveDays: number;
  sickDaysAllowed: number;
  trainingDaysAllowed: number;
  usedAnnualLeaveDays: number;
  usedSickDays: number;
  usedTrainingDays: number;
  remainingAnnualLeaveDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface AbsenceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  absenceType: AbsenceType;
  absenceTypeName: string;
  hours: number;
  notes?: string;
  isApproved: boolean;
  assignmentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AbsenceOverview {
  allocations: AbsenceAllocation[];
  records: AbsenceRecord[];
  totalUsedDaysByType: Record<AbsenceType, number>;
}

export interface CreateAbsenceRecord {
  employeeId: number;
  startDate: string;
  endDate: string;
  absenceType: AbsenceType;
  hours: number;
  slot?: number; // For half-day leaves, specify which slot (1=Morning, 2=Afternoon)
  notes?: string;
  assignmentId?: number;
}

export interface CreateAbsenceAllocation {
  employeeId: number;
  year: number;
  annualLeaveDays: number;
  sickDaysAllowed: number;
  trainingDaysAllowed: number;
}

export interface UpdateAbsenceAllocation {
  id: number;
  annualLeaveDays: number;
  sickDaysAllowed: number;
  trainingDaysAllowed: number;
}

export interface AbsenceStats {
  [key: string]: number; // AbsenceType as key, count as value
}

class AbsenceService {
  private baseUrl = '/absence';

  // Get absence overview for current user or specific employee
  async getAbsenceOverview(): Promise<AbsenceOverview> {
    const response = await apiService.get<AbsenceOverview>(`${this.baseUrl}/overview`);
    return response;
  }

  async getEmployeeAbsenceOverview(employeeId: number): Promise<AbsenceOverview> {
    const response = await apiService.get<AbsenceOverview>(`${this.baseUrl}/overview/${employeeId}`);
    return response;
  }

  // Allocation management
  async getTeamAllocations(teamId?: number): Promise<AbsenceAllocation[]> {
    const params = teamId ? { teamId } : {};
    const response = await apiService.get<AbsenceAllocation[]>(`${this.baseUrl}/allocations`, { params });
    return response;
  }

  async getEmployeeAllocation(employeeId: number, year: number): Promise<AbsenceAllocation | null> {
    try {
      const response = await apiService.get<AbsenceAllocation>(`${this.baseUrl}/allocations/${employeeId}/${year}`);
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async createAllocation(allocation: CreateAbsenceAllocation): Promise<AbsenceAllocation> {
    const response = await apiService.post<AbsenceAllocation>(`${this.baseUrl}/allocations`, allocation);
    return response;
  }

  async updateAllocation(allocation: UpdateAbsenceAllocation): Promise<AbsenceAllocation> {
    const response = await apiService.put<AbsenceAllocation>(`${this.baseUrl}/allocations`, allocation);
    return response;
  }

  async deleteAllocation(allocationId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/allocations/${allocationId}`);
  }

  // Record management
  async getEmployeeAbsenceRecords(employeeId: number, year?: number): Promise<AbsenceRecord[]> {
    const params = year ? { year } : {};
    const response = await apiService.get<AbsenceRecord[]>(`${this.baseUrl}/records/${employeeId}`, { params });
    return response;
  }

  async createAbsenceRecord(record: CreateAbsenceRecord): Promise<AbsenceRecord> {
    const response = await apiService.post<AbsenceRecord>(`${this.baseUrl}/records`, record);
    return response;
  }

  async deleteAbsenceRecord(recordId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/records/${recordId}`);
  }

  // Schedule integration
  async createAbsenceFromSchedule(assignmentId: number, absenceType: AbsenceType): Promise<AbsenceRecord | null> {
    try {
      const response = await apiService.post<AbsenceRecord>(`${this.baseUrl}/schedule/${assignmentId}`, absenceType);
      return response;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async deleteAbsenceFromSchedule(assignmentId: number): Promise<void> {
    await apiService.delete(`${this.baseUrl}/schedule/${assignmentId}`);
  }

  async deleteAbsenceRecordsByDate(date: Date, employeeId?: number): Promise<{ deletedCount: number }> {
    // Fix timezone issue - use local date instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const params: any = {
      date: dateStr
    };
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiService.delete<{ deletedCount: number }>(`${this.baseUrl}/records-by-date`, { params });
    return response;
  }

  async clearAbsenceAssignmentsByDate(date: Date, employeeId?: number): Promise<{ clearedCount: number }> {
    // Fix timezone issue - use local date instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const params: any = {
      date: dateStr
    };
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiService.delete<{ clearedCount: number }>(`${this.baseUrl}/assignments-by-date`, { params });
    return response;
  }

  // Statistics and reporting
  async getTeamAbsenceStats(teamId?: number, year?: number): Promise<Record<AbsenceType, number>> {
    const params: any = {};
    if (teamId) params.teamId = teamId;
    if (year) params.year = year;

    const response = await apiService.get<Record<AbsenceType, number>>(`${this.baseUrl}/stats`, { params });
    return response;
  }

  async getUpcomingAbsences(days: number = 30): Promise<AbsenceRecord[]> {
    const response = await apiService.get<AbsenceRecord[]>(`${this.baseUrl}/upcoming`, { params: { days } });
    return response;
  }

  // Validation
  async validateAllocation(employeeId: number, absenceType: AbsenceType, hours: number, year: number): Promise<boolean> {
    const response = await apiService.get<boolean>(`${this.baseUrl}/validate/${employeeId}/${absenceType}/${hours}/${year}`);
    return response;
  }

  // Helper methods
  getAbsenceTypeLabel(type: AbsenceType): string {
    switch (type) {
      case AbsenceType.AnnualLeave:
        return 'Annual Leave';
      case AbsenceType.SickDay:
        return 'Sick Day';
      case AbsenceType.Training:
        return 'Training';
      case AbsenceType.BankHoliday:
        return 'Bank Holiday';
      default:
        return 'Unknown';
    }
  }

  getAbsenceTypeColor(type: AbsenceType): 'primary' | 'warning' | 'info' | 'secondary' {
    switch (type) {
      case AbsenceType.AnnualLeave:
        return 'primary';
      case AbsenceType.SickDay:
        return 'warning';
      case AbsenceType.Training:
        return 'info';
      case AbsenceType.BankHoliday:
        return 'secondary';
      default:
        return 'primary';
    }
  }

  // Convert days to hours (assuming 8 hours per day)
  daysToHours(days: number): number {
    return days * 8;
  }

  // Convert hours to days (rounded up) - for display purposes only
  hoursToDays(hours: number): number {
    return Math.ceil(hours / 8);
  }

  async deleteLeaveTasksByDate(date: Date, employeeId?: number): Promise<{ deletedCount: number }> {
    // Fix timezone issue - use local date instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const params: any = {
      date: dateStr
    };
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiService.delete<{ deletedCount: number }>(`${this.baseUrl}/leave-tasks-by-date`, { params });
    return response;
  }

  async deleteAllAssignmentsByDate(date: Date, employeeId?: number): Promise<{ deletedCount: number }> {
    // Fix timezone issue - use local date instead of UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const params: any = {
      date: dateStr
    };
    if (employeeId) {
      params.employeeId = employeeId;
    }
    const response = await apiService.delete<{ deletedCount: number }>(`${this.baseUrl}/assignments-all-by-date`, { params });
    return response;
  }

  // Convert hours to exact fractional days (for half-day support)
  hoursToExactDays(hours: number): number {
    return hours / 8;
  }

  // Format days for display (handles half days properly)
  formatDaysForDisplay(hours: number): string {
    const days = this.hoursToExactDays(hours);
    if (days === 0.5) {
      return '0.5 day';
    } else if (days === 1) {
      return '1 day';
    } else {
      return `${days} day${days !== 1 ? 's' : ''}`;
    }
  }
}

export const absenceService = new AbsenceService();
export default absenceService;