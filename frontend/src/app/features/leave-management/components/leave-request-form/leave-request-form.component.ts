import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { LeaveService } from '@app/core/services/leave.service';
import { AuthService } from '@app/core/services/auth.service';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-leave-request-form',
  templateUrl: './leave-request-form.component.html',
  styleUrls: ['./leave-request-form.component.scss']
})
export class LeaveRequestFormComponent implements OnInit {
  leaveForm: FormGroup;
  isSubmitting = false;
  minDate = new Date();
  leaveTypes = [
    { value: 'Annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'Personal Leave', label: 'Personal Leave' }
  ];

  constructor(
    private fb: FormBuilder,
    private leaveService: LeaveService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialogRef: MatDialogRef<LeaveRequestFormComponent>
  ) {
    this.leaveForm = this.fb.group({
      type: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    });

    // Update end date min value when start date changes
    this.leaveForm.get('startDate')?.valueChanges.subscribe(date => {
      const endDateControl = this.leaveForm.get('endDate');
      if (date && endDateControl?.value && new Date(endDateControl.value) < new Date(date)) {
        endDateControl.setValue(date);
      }
    });
  }

  ngOnInit(): void {
  }

  getDuration(): number {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  onSubmit(): void {
    if (this.leaveForm.valid) {
      this.isSubmitting = true;
      const formValue = this.leaveForm.value;
      const duration = this.getDuration();

      const leaveRequest = {
        ...formValue,
        duration,
        employeeId: this.authService.getCurrentUser()?._id,
        employeeName: this.authService.getCurrentUser()?.name,
        status: 'pending'
      };

      this.leaveService.createLeave(leaveRequest).subscribe({
        next: (response) => {
          this.snackBar.open('Leave request submitted successfully', 'Close', { duration: 3000 });
          this.isSubmitting = false;
          this.dialogRef.close(response);
        },
        error: (error) => {
          console.error('Error submitting leave request:', error);
          this.snackBar.open('Error submitting leave request', 'Close', { duration: 3000 });
          this.isSubmitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
