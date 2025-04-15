import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeaveService, Leave } from '@app/core/services/leave.service';
import { AuthService } from '@app/core/services/auth.service';
import { LeaveRequestFormComponent } from '../leave-request-form/leave-request-form.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-leave-list',
  templateUrl: './leave-list.component.html',
  styleUrls: ['./leave-list.component.scss']
})
export class LeaveListComponent implements OnInit, OnDestroy {
  leaves: Leave[] = [];
  displayedColumns: string[] = ['employeeName', 'type', 'startDate', 'endDate', 'duration', 'reason', 'status', 'actions'];
  isLoading = false;
  isAdmin = false;
  private destroy$ = new Subject<void>();

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.isAdmin = this.authService.isAdmin();
    if (!this.isAdmin) {
      this.displayedColumns = this.displayedColumns.filter(col => col !== 'employeeName');
    }
  }

  ngOnInit(): void {
    this.loadLeaveRequests();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeaveRequests(): void {
    this.isLoading = true;
    this.leaveService.getLeaves()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (leaves: Leave[]) => {
          console.log('Received leaves:', leaves);
          this.leaves = leaves.sort((a, b) => {
            // Sort by status (pending first) and then by date
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading leaves:', error);
          this.isLoading = false;
          this.snackBar.open('Error loading leave requests', 'Close', { duration: 3000 });
        }
      });
  }

  openLeaveRequestDialog(): void {
    const dialogRef = this.dialog.open(LeaveRequestFormComponent, {
      width: '500px',
      disableClose: true,
      data: { isAdmin: this.isAdmin }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          console.log('Dialog closed with result:', result);
          // The list will update automatically through the BehaviorSubject
        }
      });
  }

  updateStatus(leaveId: string, status: 'approved' | 'rejected'): void {
    if (!this.isAdmin) {
      this.snackBar.open('Only admins can update leave request status', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.leaveService.updateLeave(leaveId, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open(`Leave request ${status}`, 'Close', { duration: 3000 });
          this.loadLeaveRequests();
        },
        error: (error: Error) => {
          console.error('Error updating leave request:', error);
          this.snackBar.open('Error updating leave request', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'primary';
      case 'rejected':
        return 'warn';
      case 'pending':
        return 'accent';
      default:
        return '';
    }
  }
}
