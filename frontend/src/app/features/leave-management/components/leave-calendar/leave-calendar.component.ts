import { Component, OnInit } from '@angular/core';
import { LeaveService, Leave } from '@app/core/services/leave.service';
import { AuthService } from '@app/core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-leave-calendar',
  templateUrl: './leave-calendar.component.html',
  styleUrls: ['./leave-calendar.component.scss']
})
export class LeaveCalendarComponent implements OnInit {
  leaves: Leave[] = [];
  isLoading = false;
  isAdmin = false;

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = this.authService.getCurrentUser()?.role === 'admin';
  }

  ngOnInit(): void {
    this.loadLeaveRequests();
  }

  loadLeaveRequests(): void {
    this.isLoading = true;
    this.leaveService.getLeaves().subscribe({
      next: (leaves: Leave[]) => {
        this.leaves = leaves;
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading leave requests:', error);
        this.snackBar.open('Error loading leave requests', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  getLeavesByDate(date: Date): Leave[] {
    return this.leaves.filter(leave => {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
      const targetDate = new Date(date);
      
      // Reset time components for accurate date comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      targetDate.setHours(0, 0, 0, 0);
      
      return targetDate >= startDate && targetDate <= endDate;
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'primary';
      case 'rejected':
        return 'warn';
      default:
        return 'accent';
    }
  }
}
