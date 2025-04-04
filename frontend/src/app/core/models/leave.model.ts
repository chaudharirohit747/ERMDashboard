export interface LeaveRequest {
  id?: string;
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
