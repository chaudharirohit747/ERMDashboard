import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceService, Attendance } from '@app/core/services/attendance.service';
import { AuthService } from '@app/core/services/auth.service';
import { AttendanceFormComponent } from '../attendance-form/attendance-form.component';
import { interval, Subscription } from 'rxjs';

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
    this.attendanceService.getUserAttendanceRecords(
      this.authService.getCurrentUser()?.id!, 
      this.showAllRecords
    ).subscribe({
      next: (records) => {
        this.attendanceRecords = records.map(record => ({
          ...record,
          date: new Date(record.date)
        }));
        console.log('Loaded records:', this.attendanceRecords);
        this.calculateStats(records);
        this.findTodayRecord();
        this.isLoading = false;
      },
      error: (error: Error) => {
        console.error('Error loading attendance records:', error);
        this.snackBar.open('Error loading attendance records', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private findTodayRecord(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.todayRecord = this.attendanceRecords.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    }) || null;

    // If today's record exists and has checkout, set todayRecord to null
    if (this.todayRecord?.checkOut) {
      this.todayRecord = null;
    }
  }

  private calculateStats(records: Attendance[]): void {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate last week's stats
    const lastWeekRecords = records.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= lastWeek && recordDate < today;
    });

    const lastWeekHours = lastWeekRecords.reduce((total, record) => {
      return total + (record.workHours || 0);
    }, 0);

    // Calculate current stats
    const myHours = records.reduce((total, record) => {
      return total + (record.workHours || 0);
    }, 0);

    // Mock team stats for now
    const teamHours = myHours * 1.2; // Just an example

    this.stats = {
      lastWeekHours: Number(lastWeekHours.toFixed(1)),
      lastWeekPercentage: Math.min(100, (lastWeekHours / 40) * 100), // Assuming 40 hour week
      myHours: Number(myHours.toFixed(1)),
      myPercentage: Math.min(100, (myHours / 160) * 100), // Assuming 160 hour month
      teamHours: Number(teamHours.toFixed(1)),
      teamPercentage: Math.min(100, (teamHours / 160) * 100)
    };
  }

  checkIn(): void {
    this.isLoading = true;
    this.attendanceService.checkIn().subscribe({
      next: (record) => {
        this.snackBar.open('Successfully checked in', 'Close', { duration: 3000 });
        this.todayRecord = {
          ...record,
          date: new Date(record.date)
        };
        this.loadAttendanceRecords();
      },
      error: (error: Error) => {
        console.error('Error checking in:', error);
        this.snackBar.open(error.message || 'Error checking in', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  checkOut(id: string): void {
    if (!id) {
      this.snackBar.open('Invalid attendance record', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;
    this.attendanceService.checkOut(id).subscribe({
      next: () => {
        this.snackBar.open('Successfully checked out', 'Close', { duration: 3000 });
        this.loadAttendanceRecords();
      },
      error: (error: Error) => {
        console.error('Error checking out:', error);
        this.snackBar.open('Error checking out', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onViewChange(view: string): void {
    this.selectedView = view;
    // Implement view change logic here
  }

  openAttendanceForm(): void {
    if (!this.isAdmin) {
      this.snackBar.open('Only administrators can add manual entries', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(AttendanceFormComponent, {
      width: '500px',
      data: { isAdmin: this.isAdmin }
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
    const now = new Date();
    const diffHours = (now.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
    return diffHours.toFixed(1);
  }

  getAttendanceBarWidth(record: Attendance): number {
    if (!record.workHours) return 0;
    return Math.min(100, (record.workHours / 9) * 100); // Assuming 9 hour workday
  }
}
