import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceService, Attendance } from '@app/core/services/attendance.service';
import { AuthService } from '@app/core/services/auth.service';
import { AttendanceFormComponent } from '../attendance-form/attendance-form.component';
import { interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

interface AttendanceStats {
  lastWeekHours: number;
  lastWeekPercentage: number;
  myHours: number;
  myPercentage: number;
  teamHours: number;
  teamPercentage: number;
}

@Component({
  selector: 'app-attendance-list',
  templateUrl: './attendance-list.component.html',
  styleUrls: ['./attendance-list.component.scss']
})
export class AttendanceListComponent implements OnInit, OnDestroy {
  attendanceRecords: Attendance[] = [];
  isLoading = false;
  isAdmin = false;
  todayRecord: Attendance | null = null;
  currentTime = new Date();
  stats: AttendanceStats = {
    lastWeekHours: 0,
    lastWeekPercentage: 0,
    myHours: 0,
    myPercentage: 0,
    teamHours: 0,
    teamPercentage: 0
  };

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadAttendanceRecords();
    this.startTimeUpdate();
  }

  ngOnDestroy(): void {
    if (this.timeSubscription) {
      this.timeSubscription.unsubscribe();
    }
  }

  private timeSubscription: Subscription | undefined;

  private startTimeUpdate(): void {
    // Update time every second
    this.timeSubscription = interval(1000).subscribe(() => {
      this.currentTime = new Date();
    });
  }

  private checkUserRole(): void {
    const currentUser = this.authService.getCurrentUser();
    this.isAdmin = currentUser?.role === 'admin';
  }

  displayedColumns = ['date', 'employee', 'checkIn', 'checkOut', 'progress', 'status'];

  formatTime(time: string | undefined): string {
    return time || '-';
  }
  
  selectedView = '30days';
  showAllRecords = false;

  toggleView(): void {
    this.showAllRecords = !this.showAllRecords;
    this.loadAttendanceRecords();
  }

  private loadAttendanceRecords(): void {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser?._id) {
      this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
      return;
    }

    // If admin and showing all records, get all attendance
    if (this.isAdmin && this.showAllRecords) {
      this.attendanceService.getAllAttendance().subscribe({
        next: this.handleAttendanceRecords.bind(this),
        error: this.handleError.bind(this)
      });
    } else {
      // Filter records for the current user on the frontend
      this.attendanceService.getAllAttendance().pipe(
        map(records => records.filter(record => record.employeeId === currentUser._id))
      ).subscribe({
        next: this.handleAttendanceRecords.bind(this),
        error: this.handleError.bind(this)
      });
    }
  }

  private handleAttendanceRecords(records: Attendance[]): void {
    this.attendanceRecords = records.map(record => ({
      ...record,
      date: new Date(record.date)
    }));
    console.log('Loaded records:', this.attendanceRecords);
    this.calculateStats(records);
    this.findTodayRecord();
    this.isLoading = false;
  }

  private handleError(error: Error): void {
    console.error('Error loading attendance records:', error);
    this.snackBar.open('Error loading attendance records', 'Close', { duration: 3000 });
    this.isLoading = false;
  }

  private calculateStats(records: Attendance[]): void {
    // Implementation of stats calculation
    // This can be enhanced based on your specific requirements
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const lastWeekRecords = records.filter(r => new Date(r.date) >= lastWeek);
    const myRecords = records.filter(r => r.employeeId === this.authService.getCurrentUser()?._id);
    const teamRecords = this.isAdmin ? records : [];

    this.stats = {
      lastWeekHours: this.calculateTotalHours(lastWeekRecords),
      lastWeekPercentage: Number(((lastWeekRecords.length / 7) * 100).toFixed(2)),
      myHours: this.calculateTotalHours(myRecords),
      myPercentage: Number(((myRecords.length / 30) * 100).toFixed(2)),
      teamHours: this.calculateTotalHours(teamRecords),
      teamPercentage: this.isAdmin ? Number(((teamRecords.length / (30 * 5)) * 100).toFixed(2)) : 0
    };
  }

  private calculateTotalHours(records: Attendance[]): number {
    return records.reduce((total, record) => {
      if (record.workHours) {
        return total + record.workHours;
      }
      return total;
    }, 0);
  }

  private findTodayRecord(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.todayRecord = this.attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime() && 
             record.employeeId === this.authService.getCurrentUser()?._id;
    }) || null;
  }

  checkIn(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser?._id) {
      this.snackBar.open('Please log in first', 'Close', { duration: 3000 });
      return;
    }

    this.attendanceService.checkIn().subscribe({
      next: (record) => {
        this.snackBar.open('Successfully checked in', 'Close', { duration: 3000 });
        this.loadAttendanceRecords();
      },
      error: (error) => {
        console.error('Check-in error:', error);
        this.snackBar.open(error.message || 'Error checking in', 'Close', { duration: 3000 });
      }
    });
  }

  checkOut(): void {
    if (!this.todayRecord?._id) {
      this.snackBar.open('No active check-in found', 'Close', { duration: 3000 });
      return;
    }

    this.attendanceService.checkOut(this.todayRecord._id).subscribe({
      next: () => {
        this.snackBar.open('Successfully checked out', 'Close', { duration: 3000 });
        this.loadAttendanceRecords();
      },
      error: (error) => {
        console.error('Check-out error:', error);
        this.snackBar.open(error.message || 'Error checking out', 'Close', { duration: 3000 });
      }
    });
  }

  openAttendanceForm(): void {
    const dialogRef = this.dialog.open(AttendanceFormComponent, {
      width: '500px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAttendanceRecords();
      }
    });
  }

  calculateDuration(checkInTime: string | undefined): string {
    if (!checkInTime) return '0';
  
    const checkIn = new Date(checkInTime);
    if (isNaN(checkIn.getTime())) {
      return '0';
    }
  
    const now = new Date();
    const diffHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return diffHours.toFixed(1);
  }
  
  getAttendanceBarWidth(record: Attendance): number {
    if (!record.workHours) return 0;
    // Assuming 9 hour workday
    return Math.min(100, (record.workHours / 9) * 100);
  }

  onViewChange(view: string): void {
    this.selectedView = view;
    this.loadAttendanceRecords();
  }
}
