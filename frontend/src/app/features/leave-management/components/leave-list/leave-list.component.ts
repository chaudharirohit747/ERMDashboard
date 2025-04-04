import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LeaveService, LeaveRequest } from '@app/core/services/leave.service';
import { AuthService } from '@app/core/services/auth.service';
import { LeaveRequestFormComponent } from '../leave-request-form/leave-request-form.component';

@Component({
  selector: 'app-leave-list',
  templateUrl: './leave-list.component.html',
  styleUrls: ['./leave-list.component.scss']
})
export class LeaveListComponent implements OnInit {
  leaveRequests: LeaveRequest[] = [];
  displayedColumns: string[] = ['employeeName', 'type', 'startDate', 'endDate', 'duration', 'reason', 'status', 'actions'];
  isLoading = false;
  isAdmin = false;

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

  loadLeaveRequests(): void {
    this.isLoading = true;
    this.leaveService.getLeaveRequests().subscribe({
      next: (requests: LeaveRequest[]) => {
        this.leaveRequests = requests;
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading leave requests:', error);
        this.snackBar.open('Error loading leave requests', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  openLeaveRequestDialog(): void {
    const dialogRef = this.dialog.open(LeaveRequestFormComponent, {
      width: '500px',
      disableClose: true,
      data: { isAdmin: this.isAdmin }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Add the new leave request to the list immediately
        this.leaveRequests = [...this.leaveRequests, result];
      }
    });
  }

  updateStatus(leaveId: string, status: 'approved' | 'rejected'): void {
    if (!this.isAdmin) {
      this.snackBar.open('Only admins can update leave request status', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.leaveService.updateLeaveRequestStatus(leaveId, status).subscribe({
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
