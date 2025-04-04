import { Component, OnInit } from '@angular/core';
import { LeaveService } from '@app/core/services/leave.service';
import { AuthService } from '@app/core/services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { LeaveRequestFormComponent } from '../leave-request-form/leave-request-form.component';

@Component({
  selector: 'app-leave-management',
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.scss']
})
export class LeaveManagementComponent implements OnInit {
  isAdmin = false;

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
  }

  onRequestLeave(): void {
    const dialogRef = this.dialog.open(LeaveRequestFormComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the leave list or balance if needed
        // this.loadLeaveData();
      }
    });
  }
}
