import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
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
  private leavesSubject = new BehaviorSubject<Leave[]>([]);
  leaves$ = this.leavesSubject.asObservable();
  private leaveBalancesSubject = new BehaviorSubject<LeaveBalance[]>([
    { leaveType: 'Annual Leave', total: 20, used: 0, remaining: 20 },
    { leaveType: 'Sick Leave', total: 10, used: 0, remaining: 10 },
    { leaveType: 'Personal Leave', total: 5, used: 0, remaining: 5 }
  ]);

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Subscribe to user changes to refresh leaves when user changes
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.refreshLeaves();
      }
    });
  }

  refreshLeaves(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return;

    this.http.get<Leave[]>(`${this.apiUrl}/employee/${currentUser._id}`).subscribe(leaves => {
      console.log('Refreshed leaves:', leaves);
      const processedLeaves = leaves.map(leave => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate),
        createdAt: leave.createdAt ? new Date(leave.createdAt) : undefined,
        updatedAt: leave.updatedAt ? new Date(leave.updatedAt) : undefined,
        approvalDate: leave.approvalDate ? new Date(leave.approvalDate) : undefined
      }));
      
      this.leavesSubject.next(processedLeaves);
      
      // Calculate leave balances
      const approvedLeaves = processedLeaves.filter(leave => leave.status === 'approved');
      console.log('Approved leaves:', approvedLeaves);
      
      const balances = [
        { leaveType: 'Annual Leave', total: 20, used: 0, remaining: 20 },
        { leaveType: 'Sick Leave', total: 10, used: 0, remaining: 10 },
        { leaveType: 'Personal Leave', total: 5, used: 0, remaining: 5 }
      ];

      approvedLeaves.forEach(leave => {
        // Normalize leave type for comparison
        const normalizedType = leave.type === 'Annual' ? 'Annual Leave' :
                             leave.type.toLowerCase() === 'sick' ? 'Sick Leave' :
                             'Personal Leave';
                             
        const balance = balances.find(b => b.leaveType === normalizedType);
        if (balance) {
          balance.used += leave.duration;
          balance.remaining = balance.total - balance.used;
        }
        console.log(`Updated balance for ${normalizedType}:`, balance);
      });

      console.log('Final balances:', balances);
      this.leaveBalancesSubject.next(balances);
    });
  }

  getLeaves(): Observable<Leave[]> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return this.leaves$;

    // If user is admin, get all leaves, otherwise get only their leaves
    if (this.authService.isAdmin()) {
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
    } else {
      return this.leaves$;
    }
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

  createLeave(leave: Partial<Leave>): Observable<Leave> {
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
      tap(newLeave => {
        const currentLeaves = this.leavesSubject.value;
        this.leavesSubject.next([...currentLeaves, {
          ...newLeave,
          startDate: new Date(newLeave.startDate),
          endDate: new Date(newLeave.endDate)
        }]);
      })
    );
  }

  updateLeave(id: string, update: Partial<Leave>): Observable<Leave> {
    return this.http.put<Leave>(`${this.apiUrl}/${id}`, update).pipe(
      tap(updatedLeave => {
        const currentLeaves = this.leavesSubject.value;
        const index = currentLeaves.findIndex(leave => leave._id === id);
        if (index !== -1) {
          currentLeaves[index] = {
            ...updatedLeave,
            startDate: new Date(updatedLeave.startDate),
            endDate: new Date(updatedLeave.endDate),
            approvalDate: updatedLeave.approvalDate ? new Date(updatedLeave.approvalDate) : undefined
          };
          this.leavesSubject.next([...currentLeaves]);
          
          // Refresh leave balances when a leave is approved
          if (updatedLeave.status === 'approved') {
            this.refreshLeaves();
          }
        }
      })
    );
  }

  deleteLeave(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentLeaves = this.leavesSubject.value;
        this.leavesSubject.next(currentLeaves.filter(leave => leave._id !== id));
      })
    );
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
