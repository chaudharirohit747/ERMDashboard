import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceService } from '@app/core/services/attendance.service';
import { AuthService } from '@app/core/services/auth.service';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface AttendanceFormData {
  isAdmin: boolean;
  id?: string;
  date?: Date;
  checkIn?: string;
  checkOut?: string;
  status?: string;
  notes?: string;
}

@Component({
  selector: 'app-attendance-form',
  templateUrl: './attendance-form.component.html',
  styleUrls: ['./attendance-form.component.scss']
})
export class AttendanceFormComponent implements OnInit {
  attendanceForm!: FormGroup;
  isLoading = false;
  isAdmin = false;
  employees: Employee[] = [];

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<AttendanceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AttendanceFormData
  ) {
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'admin';

    // Close dialog if user is not admin
    if (!this.isAdmin) {
      this.snackBar.open('Only administrators can access this form', 'Close', { duration: 3000 });
      this.dialogRef.close();
      return;
    }

    this.initForm();
  }

  ngOnInit(): void {
    if (this.isAdmin) {
      // Load employees from the auth service
      this.loadEmployees();
    }
  }

  private loadEmployees(): void {
    const employeesJson = localStorage.getItem('employees');
    if (employeesJson) {
      try {
        this.employees = JSON.parse(employeesJson);
      } catch (error) {
        console.error('Error parsing employees from localStorage:', error);
        this.employees = [];
      }
    } else {
      this.employees = [];
    }

    // Sort employees by firstName
    this.employees.sort((a, b) => a.firstName.localeCompare(b.firstName));
  }

  private initForm(): void {
    this.attendanceForm = this.fb.group({
      employeeId: ['', Validators.required],
      date: [new Date(), Validators.required],
      checkInTime: ['09:00', Validators.required],
      checkOutTime: ['18:00', Validators.required],
      status: ['present', Validators.required],
      notes: ['']
    });

    // If editing existing record, patch the form
    if (this.data.id) {
      this.attendanceForm.patchValue({
        date: this.data.date,
        checkInTime: this.data.checkIn,
        checkOutTime: this.data.checkOut,
        status: this.data.status,
        notes: this.data.notes
      });
    }
  }

  onSubmit(): void {
    if (this.attendanceForm.valid && !this.isLoading) {
      this.isLoading = true;
      const formValue = this.attendanceForm.value;

      const selectedEmployee = this.employees.find(emp => emp.id === formValue.employeeId);
      if (!selectedEmployee) {
        this.snackBar.open('Employee not found', 'Close', { duration: 3000 });
        this.isLoading = false;
        return;
      }

      const attendance = {
        id: Date.now().toString(),
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        date: formValue.date,
        checkIn: formValue.checkInTime,
        checkOut: formValue.checkOutTime,
        status: formValue.status,
        notes: formValue.notes || ''
      };

      this.attendanceService.createAttendance(attendance).subscribe({
        next: () => {
          this.snackBar.open('Attendance record created successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          console.error('Error creating attendance:', error);
          this.snackBar.open('Failed to create attendance record', 'Close', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private calculateWorkHours(checkIn: string, checkOut: string): number | undefined {
    if (!checkIn || !checkOut) return undefined;
    
    const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
    const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
    
    const totalMinutes = (checkOutHour * 60 + checkOutMinute) - (checkInHour * 60 + checkInMinute);
    return Math.round(totalMinutes / 60 * 10) / 10; // Round to 1 decimal place
  }
}
