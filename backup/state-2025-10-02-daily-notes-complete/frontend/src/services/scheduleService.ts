import apiService from './api';
import {
  CalendarViewDto,
  ScheduleRequestDto,
  CreateAssignmentDto,
  UpdateAssignmentDto,
  BulkAssignmentDto,
  BulkUpdateAssignmentDto,
  AssignmentTaskDto,
  CapacityCheckDto,
  CapacityResponseDto,
  DateRangeDto,
  CalendarViewType,
  Slot
} from '../types/schedule';

class ScheduleService {
  private readonly baseUrl = '/schedule';

  // Calendar view operations
  async getCalendarView(request: ScheduleRequestDto): Promise<CalendarViewDto> {
    const params = new URLSearchParams({
      startDate: typeof request.startDate === 'string' ? request.startDate : this.formatDateForApi(new Date(request.startDate)),
      viewType: request.viewType.toString(),
      ...(request.employeeId && { employeeId: request.employeeId.toString() }),
      ...(request.includeInactive !== undefined && { includeInactive: request.includeInactive.toString() })
    });

    return apiService.get<CalendarViewDto>(`${this.baseUrl}/calendar?${params}`);
  }

  async getEmployeeSchedule(
    employeeId: number,
    startDate: string,
    viewType: CalendarViewType = CalendarViewType.Week
  ): Promise<CalendarViewDto> {
    const params = new URLSearchParams({
      startDate: typeof startDate === 'string' ? startDate : this.formatDateForApi(new Date(startDate)),
      viewType: viewType.toString()
    });

    return apiService.get<CalendarViewDto>(`${this.baseUrl}/employee/${employeeId}?${params}`);
  }


  // Assignment operations
  async createAssignment(assignment: CreateAssignmentDto): Promise<AssignmentTaskDto> {
    return apiService.post<AssignmentTaskDto>(`${this.baseUrl}/assignments`, assignment);
  }

  async updateAssignment(assignment: UpdateAssignmentDto): Promise<AssignmentTaskDto> {
    console.log(`🚨🚨🚨 SCHEDULE SERVICE: Making PUT request to ${this.baseUrl}/assignments`);
    console.log(`🚨🚨🚨 SCHEDULE SERVICE: Request data:`, assignment);

    const result = await apiService.put<AssignmentTaskDto>(`${this.baseUrl}/assignments`, assignment);

    console.log(`🚨🚨🚨 SCHEDULE SERVICE: Response received:`, result);
    return result;
  }

  // Move task to different slot/employee/date
  async moveAssignment(
    assignmentId: number,
    targetEmployeeId: number,
    targetDate: string,
    targetSlot: Slot
  ): Promise<AssignmentTaskDto> {
    const updateData: UpdateAssignmentDto = {
      assignmentId,
      employeeId: targetEmployeeId,
      assignedDate: targetDate,
      slot: targetSlot
    };
    return this.updateAssignment(updateData);
  }

  async deleteAssignment(assignmentId: number): Promise<void> {
    return apiService.delete<void>(`${this.baseUrl}/assignments/${assignmentId}`);
  }

  async createBulkAssignments(bulkAssignment: BulkAssignmentDto): Promise<AssignmentTaskDto[]> {
    return apiService.post<AssignmentTaskDto[]>(`${this.baseUrl}/assignments/bulk`, bulkAssignment);
  }

  async bulkUpdateAssignments(bulkUpdate: BulkUpdateAssignmentDto): Promise<AssignmentTaskDto[]> {
    return apiService.put<AssignmentTaskDto[]>(`${this.baseUrl}/assignments/bulk`, bulkUpdate);
  }

  // Assignment queries
  async getAssignmentsByDateRange(dateRange: DateRangeDto): Promise<AssignmentTaskDto[]> {
    const params = new URLSearchParams({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      ...(dateRange.employeeId && { employeeId: dateRange.employeeId.toString() })
    });

    return apiService.get<AssignmentTaskDto[]>(`${this.baseUrl}/assignments?${params}`);
  }

  async getAssignmentById(assignmentId: number): Promise<AssignmentTaskDto> {
    return apiService.get<AssignmentTaskDto>(`${this.baseUrl}/assignments/${assignmentId}`);
  }

  // Capacity and availability
  async checkCapacity(capacityCheck: CapacityCheckDto): Promise<CapacityResponseDto> {
    const params = new URLSearchParams({
      employeeId: capacityCheck.employeeId.toString(),
      date: capacityCheck.date,
      slot: capacityCheck.slot.toString()
    });

    return apiService.get<CapacityResponseDto>(`${this.baseUrl}/capacity/check?${params}`);
  }

  async getEmployeeCapacity(
    employeeId: number, 
    startDate: string, 
    endDate: string
  ): Promise<CapacityResponseDto[]> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    return apiService.get<CapacityResponseDto[]>(`${this.baseUrl}/capacity/employee/${employeeId}?${params}`);
  }

  async getAvailabilityMatrix(
    employeeId: number, 
    startDate: string, 
    endDate: string
  ): Promise<Record<string, Record<Slot, boolean>>> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    return apiService.get<Record<string, Record<Slot, boolean>>>(
      `${this.baseUrl}/availability/${employeeId}?${params}`
    );
  }

  // Validation
  async validateAssignment(assignment: CreateAssignmentDto): Promise<{
    isValid: boolean;
    conflicts: string[];
  }> {
    return apiService.post<{
      isValid: boolean;
      conflicts: string[];
    }>(`${this.baseUrl}/validate`, assignment);
  }

  // Statistics and reporting
  async getEmployeeWorkload(startDate: string, endDate: string): Promise<Record<number, number>> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    return apiService.get<Record<number, number>>(`${this.baseUrl}/workload?${params}`);
  }

  async getDailyCapacityUtilization(startDate: string, endDate: string): Promise<Record<string, number>> {
    const params = new URLSearchParams({
      startDate,
      endDate
    });

    return apiService.get<Record<string, number>>(`${this.baseUrl}/utilization?${params}`);
  }

  async getOverdueAssignments(): Promise<AssignmentTaskDto[]> {
    return apiService.get<AssignmentTaskDto[]>(`${this.baseUrl}/overdue`);
  }

  async getUpcomingDeadlines(days: number = 7): Promise<AssignmentTaskDto[]> {
    const params = new URLSearchParams({
      days: days.toString()
    });

    return apiService.get<AssignmentTaskDto[]>(`${this.baseUrl}/deadlines?${params}`);
  }

  // Utility methods
  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  }

  parseDateFromApi(dateString: string): Date {
    return new Date(dateString);
  }

  getViewStartDate(date: Date, viewType: CalendarViewType): Date {
    const baseDate = new Date(date);
    
    switch (viewType) {
      case CalendarViewType.Day:
        return baseDate;
      case CalendarViewType.Week:
        return this.getWeekStart(baseDate);
      case CalendarViewType.BiWeek:
        return this.getBiWeekStart(baseDate);
      case CalendarViewType.Month:
        return new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      default:
        return baseDate;
    }
  }

  getViewEndDate(startDate: Date, viewType: CalendarViewType): Date {
    const start = new Date(startDate);
    
    switch (viewType) {
      case CalendarViewType.Day:
        return start;
      case CalendarViewType.Week:
        return this.getWeekdayEndDate(start, 5); // 5 weekdays
      case CalendarViewType.BiWeek:
        return this.getWeekdayEndDate(start, 10); // 10 weekdays
      case CalendarViewType.Month:
        return this.getMonthWeekdayEndDate(start);
      default:
        return start;
    }
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    d.setDate(diff);
    return d;
  }

  private getBiWeekStart(date: Date): Date {
    const weekStart = this.getWeekStart(date);
    const weekNumber = this.getWeekOfYear(weekStart);
    const isOddWeek = weekNumber % 2 === 1;
    
    if (isOddWeek) {
      return weekStart;
    } else {
      return new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private getWeekOfYear(date: Date): number {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
  }

  private getWeekdayEndDate(startDate: Date, weekdayCount: number): Date {
    let currentDate = new Date(startDate);
    let weekdaysFound = 0;
    
    while (weekdaysFound < weekdayCount) {
      if (this.isBusinessDay(currentDate)) {
        weekdaysFound++;
        if (weekdaysFound === weekdayCount) {
          return new Date(currentDate);
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return new Date(currentDate);
  }

  private getMonthWeekdayEndDate(startDate: Date): Date {
    const endOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
    return endOfMonth;
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  isBusinessDay(date: Date): boolean {
    return !this.isWeekend(date);
  }

  // Navigation helpers for weekdays-only calendar
  getNextWeekday(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (this.isWeekend(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  getPreviousWeekday(date: Date): Date {
    const prevDay = new Date(date);
    prevDay.setDate(prevDay.getDate() - 1);
    
    while (this.isWeekend(prevDay)) {
      prevDay.setDate(prevDay.getDate() - 1);
    }
    
    return prevDay;
  }

  getWeekdaysInRange(startDate: Date, endDate: Date): Date[] {
    const weekdays: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      if (this.isBusinessDay(currentDate)) {
        weekdays.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return weekdays;
  }

  getPriorityColor(priority: number): string {
    switch (priority) {
      case 1: return '#28a745'; // Low - Green
      case 2: return '#ffc107'; // Medium - Yellow
      case 3: return '#fd7e14'; // High - Orange
      case 4: return '#dc3545'; // Critical - Red
      default: return '#6c757d'; // Default - Gray
    }
  }

  getStatusColor(status: number): string {
    switch (status) {
      case 1: return '#6c757d'; // NotStarted - Gray
      case 2: return '#0066cc'; // InProgress - Blue
      case 3: return '#28a745'; // Done - Green
      case 4: return '#ffc107'; // OnHold - Yellow
      case 5: return '#dc3545'; // Blocked - Red
      default: return '#6c757d'; // Default - Gray
    }
  }

  // Quick access methods for common operations
  async getTodaySchedule(employeeId?: number): Promise<CalendarViewDto> {
    const request: ScheduleRequestDto = {
      startDate: this.formatDateForApi(new Date()),
      viewType: CalendarViewType.Day,
      employeeId
    };
    return this.getCalendarView(request);
  }

  async getWeekSchedule(startDate: Date, employeeId?: number): Promise<CalendarViewDto> {
    const request: ScheduleRequestDto = {
      startDate: this.formatDateForApi(this.getViewStartDate(startDate, CalendarViewType.Week)),
      viewType: CalendarViewType.Week,
      employeeId
    };
    return this.getCalendarView(request);
  }

  async getMonthSchedule(startDate: Date, employeeId?: number): Promise<CalendarViewDto> {
    const request: ScheduleRequestDto = {
      startDate: this.formatDateForApi(this.getViewStartDate(startDate, CalendarViewType.Month)),
      viewType: CalendarViewType.Month,
      employeeId
    };
    return this.getCalendarView(request);
  }
}

export const scheduleService = new ScheduleService();
export default scheduleService;