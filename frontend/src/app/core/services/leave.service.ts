import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: Date;
  endDate: Date;
  duration: number;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export interface LeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'sick' | 'casual' | 'vacation';
  startDate: Date;
  endDate: Date;
  duration: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  private readonly REQUESTS_KEY = 'leave_requests';
  private readonly BALANCES_KEY = 'leave_balances';
  private readonly LEAVES_KEY = 'leaves';

  private leaveRequestsSubject = new BehaviorSubject<LeaveRequest[]>([]);
  private leaveBalancesSubject = new BehaviorSubject<LeaveBalance[]>([]);
  private leavesSubject = new BehaviorSubject<Leave[]>([]);

  readonly leaveRequests$ = this.leaveRequestsSubject.asObservable();
  readonly leaveBalances$ = this.leaveBalancesSubject.asObservable();
  readonly leaves$ = this.leavesSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadFromStorage();
    this.initializeMockData();
  }

  private loadFromStorage(): void {
    const storedRequests = localStorage.getItem(this.REQUESTS_KEY);
    if (storedRequests) {
      const requests = JSON.parse(storedRequests).map((request: any) => ({
        ...request,
        startDate: new Date(request.startDate),
        endDate: new Date(request.endDate),
        createdAt: new Date(request.createdAt),
        updatedAt: request.updatedAt ? new Date(request.updatedAt) : undefined
      }));
      this.leaveRequestsSubject.next(requests);
    }

    const storedBalances = localStorage.getItem(this.BALANCES_KEY);
    if (storedBalances) {
      const balances = JSON.parse(storedBalances);
      this.leaveBalancesSubject.next(balances);
    } else {
      // Initialize default balances
      const defaultBalances = [
        { leaveType: 'Annual Leave', total: 20, used: 0, remaining: 20 },
        { leaveType: 'Sick Leave', total: 10, used: 0, remaining: 10 },
        { leaveType: 'Personal Leave', total: 5, used: 0, remaining: 5 }
      ];
      this.leaveBalancesSubject.next(defaultBalances);
      this.saveBalancesToStorage();
    }

    const storedLeaves = localStorage.getItem(this.LEAVES_KEY);
    if (storedLeaves) {
      const leaves = JSON.parse(storedLeaves).map((leave: any) => ({
        ...leave,
        startDate: new Date(leave.startDate),
        endDate: new Date(leave.endDate)
      }));
      this.leavesSubject.next(leaves);
    }
  }

  private initializeMockData(): void {
    // Mock leave requests
    if (this.leaveRequestsSubject.value.length === 0) {
      const mockRequests: LeaveRequest[] = [
        {
          id: '1',
          employeeId: '1',
          employeeName: 'John Doe',
          type: 'sick' as const,
          startDate: new Date('2025-04-05'),
          endDate: new Date('2025-04-07'),
          reason: 'Illness',
          status: 'pending',
          duration: 3,
          createdAt: new Date()
        }
      ];
      this.leaveRequestsSubject.next(mockRequests);
      this.saveToStorage();
    }

    // Mock leave balances
    if (this.leaveBalancesSubject.value.length === 0) {
      const mockBalances = [
        { leaveType: 'Annual Leave', total: 20, used: 5, remaining: 15 },
        { leaveType: 'Sick Leave', total: 10, used: 2, remaining: 8 },
        { leaveType: 'Personal Leave', total: 5, used: 1, remaining: 4 }
      ];
      this.leaveBalancesSubject.next(mockBalances);
      this.saveBalancesToStorage();
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(this.leaveRequestsSubject.value));
  }

  private saveBalancesToStorage(): void {
    localStorage.setItem(this.BALANCES_KEY, JSON.stringify(this.leaveBalancesSubject.value));
  }

  private saveLeavesToStorage(): void {
    localStorage.setItem(this.LEAVES_KEY, JSON.stringify(this.leavesSubject.value));
  }

  getLeaves(): Observable<Leave[]> {
    return this.leaves$.pipe(
      map(leaves => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return [];

        if (currentUser.role === 'admin') {
          return leaves;
        }
        return leaves.filter(leave => leave.employeeId === currentUser.id);
      })
    );
  }

  getLeaveRequests(): Observable<LeaveRequest[]> {
    return this.leaveRequests$.pipe(
      map(requests => {
        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) return [];

        const userRequests = currentUser.role === 'admin'
          ? requests
          : requests.filter(request => request.employeeId === currentUser.id);

        return userRequests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      })
    );
  }

  getLeaveBalances(): Observable<LeaveBalance[]> {
    return this.leaveBalances$.pipe(
      map(balances => {
        if (this.authService.isAdmin()) {
          return balances; // Admin can see all balances
        } else {
          const currentUserId = this.authService.getCurrentUserId();
          return balances.filter(balance => balance.leaveType === 'Annual Leave' || balance.leaveType === 'Sick Leave' || balance.leaveType === 'Personal Leave');
        }
      })
    );
  }

  createLeaveRequest(request: Omit<LeaveRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Observable<LeaveRequest> {
    const newRequest: LeaveRequest = {
      ...request,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date()
    };

    const currentRequests = this.leaveRequestsSubject.value;
    const updatedRequests = [...currentRequests, newRequest];
    this.leaveRequestsSubject.next(updatedRequests);
    this.saveToStorage();
    return of(newRequest);
  }

  updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Observable<LeaveRequest> {
    const currentRequests = this.leaveRequestsSubject.value;
    const index = currentRequests.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Leave request not found');

    const updatedRequest: LeaveRequest = {
      ...currentRequests[index],
      ...updates,
      updatedAt: new Date()
    };

    const updatedRequests = [...currentRequests];
    updatedRequests[index] = updatedRequest;
    this.leaveRequestsSubject.next(updatedRequests);
    this.saveToStorage();
    return of(updatedRequest);
  }

  updateLeaveRequestStatus(requestId: string, status: 'approved' | 'rejected'): Observable<LeaveRequest> {
    if (!this.authService.isAdmin()) {
      throw new Error('Only admins can update leave request status');
    }

    const currentRequests = this.leaveRequestsSubject.value;
    const request = currentRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error('Leave request not found');
    }

    const updatedRequest = {
      ...request,
      status,
      updatedAt: new Date()
    };

    // Update leave balance if approved
    if (status === 'approved') {
      const currentBalances = this.leaveBalancesSubject.value;
      const balance = currentBalances.find(
        b => b.leaveType === request.type.charAt(0).toUpperCase() + request.type.slice(1) + ' Leave'
      );
      if (balance) {
        const updatedBalance = {
          ...balance,
          used: balance.used + request.duration,
          remaining: balance.total - (balance.used + request.duration)
        };
        const updatedBalances = currentBalances.map(b => 
          b.leaveType === updatedBalance.leaveType ? updatedBalance : b
        );
        this.leaveBalancesSubject.next(updatedBalances);
        this.saveBalancesToStorage();
      }
    }

    const updatedRequests = currentRequests.map(r => 
      r.id === requestId ? updatedRequest : r
    );
    this.leaveRequestsSubject.next(updatedRequests);
    this.saveToStorage();
    return of(updatedRequest);
  }

  getLeaveRequestById(requestId: string): Observable<LeaveRequest | undefined> {
    return this.leaveRequests$.pipe(
      map(requests => requests.find(r => r.id === requestId))
    );
  }

  getLeaveBalanceByType(employeeId: string, leaveType: string): Observable<LeaveBalance | undefined> {
    return this.leaveBalances$.pipe(
      map(balances => balances.find(b => b.leaveType === leaveType))
    );
  }

  applyLeave(leave: Omit<Leave, 'id'>): Observable<Leave> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User not found');
    }

    const currentLeaves = this.leavesSubject.value;
    const newLeave: Leave = {
      id: (currentLeaves.length + 1).toString(),
      employeeId: currentUser.id,
      employeeName: currentUser.name,
      startDate: new Date(leave.startDate),
      endDate: new Date(leave.endDate),
      type: leave.type,
      reason: leave.reason,
      status: 'pending',
      duration: leave.duration
    };

    const updatedLeaves = [...currentLeaves, newLeave];
    this.leavesSubject.next(updatedLeaves);
    this.saveLeavesToStorage();
    return of(newLeave);
  }

  private calculateDuration(startDate: Date, endDate: Date): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }
}
