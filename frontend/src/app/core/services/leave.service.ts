import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface Leave {
  _id?: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'Annual' | 'Personal Leave';
  startDate: Date;
  endDate: Date;
  duration: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalDate?: Date;
  comments?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}



@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private apiUrl = `${environment.apiUrl}/leaves`;
  private leaveBalancesSubject = new BehaviorSubject<LeaveBalance[]>([
    { leaveType: 'Annual Leave', total: 20, used: 0, remaining: 20 },
    { leaveType: 'Sick Leave', total: 10, used: 0, remaining: 10 },
    { leaveType: 'Personal Leave', total: 5, used: 0, remaining: 5 }
  ]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}



  getLeaves(): Observable<Leave[]> {
    return this.http.get<Leave[]>(this.apiUrl).pipe(
      map(leaves => leaves.map(leave => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        createdAt: leave.createdAt ? new Date(leave.createdAt) : undefined,
        updatedAt: leave.updatedAt ? new Date(leave.updatedAt) : undefined,
        approvalDate: leave.approvalDate ? new Date(leave.approvalDate) : undefined
      })))
    );
  }

  getEmployeeLeaves(employeeId: string): Observable<Leave[]> {
    return this.http.get<Leave[]>(`${this.apiUrl}/employee/${employeeId}`).pipe(
      map(leaves => leaves.map(leave => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        createdAt: leave.createdAt ? new Date(leave.createdAt) : undefined,
        updatedAt: leave.updatedAt ? new Date(leave.updatedAt) : undefined,
        approvalDate: leave.approvalDate ? new Date(leave.approvalDate) : undefined
      })))
    );
  }

  getLeaveBalances(): Observable<LeaveBalance[]> {
    return this.leaveBalancesSubject.asObservable();
  }

  createLeave(leave: Omit<Leave, '_id'>): Observable<Leave> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not found');
    }

    const newLeave = {
      ...leave,
      employeeId: currentUser._id,
      employeeName: currentUser.name || 'Unknown',
      status: 'pending' as const
    };

    return this.http.post<Leave>(this.apiUrl, newLeave).pipe(
      map(leave => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate)
      }))
    );
  }

  updateLeave(id: string, updates: Partial<Leave>): Observable<Leave> {
    return this.http.put<Leave>(`${this.apiUrl}/${id}`, updates).pipe(
      map(leave => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        approvalDate: leave.approvalDate ? new Date(leave.approvalDate) : undefined
      }))
    );
  }

  deleteLeave(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }



  getLeaveBalanceByType(leaveType: string): Observable<LeaveBalance | undefined> {
    return this.leaveBalancesSubject.pipe(
      map(balances => balances.find(b => b.leaveType === leaveType))
    );
  }



  calculateDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }
}
