import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AttendanceService } from '@app/core/services/attendance.service';
import { AuthService } from '@app/core/services/auth.service';
import { firstValueFrom } from 'rxjs';
import type { AttendanceRecord as BaseAttendanceRecord } from '@app/core/services/attendance.service';

interface AttendanceRecord extends BaseAttendanceRecord {
  employeeName: string;
  hours?: number;
}

@Component({
  selector: 'app-attendance-report',
  templateUrl: './attendance-report.component.html',
  styleUrls: ['./attendance-report.component.scss']
})
export class AttendanceReportComponent implements OnInit {
  filterForm: FormGroup;
  dataSource: MatTableDataSource<AttendanceRecord>;
  displayedColumns: string[] = ['date', 'employeeName', 'checkIn', 'checkOut', 'status', 'hours'];
  isLoading = false;
  totalWorkingHours = 0;
  presentDays = 0;
  lateDays = 0;
  absentDays = 0;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private fb: FormBuilder,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });

    this.dataSource = new MatTableDataSource<AttendanceRecord>([]);
  }

  ngOnInit(): void {
    this.loadAttendanceRecords();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async loadAttendanceRecords(): Promise<void> {
    this.isLoading = true;
    try {
      const currentUser = this.authService.getCurrentUser();
      const isAdmin = currentUser?.role === 'admin';
      
      const observable = isAdmin 
        ? this.attendanceService.getAllAttendanceRecords()
        : this.attendanceService.getUserAttendanceRecords(currentUser?.id || '');

      const records = await firstValueFrom(observable);
      const users = await firstValueFrom(this.authService.getUsers());

      // Filter records based on date range if provided
      const { startDate, endDate } = this.filterForm.value;
      const filteredRecords = records.filter((record: BaseAttendanceRecord) => {
        const recordDate = new Date(record.date);
        if (startDate && recordDate < new Date(startDate)) return false;
        if (endDate && recordDate > new Date(endDate)) return false;
        return true;
      });

      // Map employee names and calculate statistics
      this.dataSource.data = filteredRecords.map(record => {
        const user = users.find(u => u.id === record.employeeId);
        return {
          ...record,
          employeeName: user?.name || 'Unknown',
          date: new Date(record.date),
          hours: record.checkOut ? this.calculateHours(record.checkIn, record.checkOut) : undefined
        };
      });

      this.calculateStatistics();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.snackBar.open(`Error loading attendance records: ${errorMessage}`, 'Close', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  private calculateStatistics(): void {
    this.presentDays = this.dataSource.data.filter(r => r.status === 'present').length;
    this.lateDays = this.dataSource.data.filter(r => r.status === 'late').length;
    this.absentDays = this.dataSource.data.filter(r => r.status === 'absent').length;
    this.totalWorkingHours = this.dataSource.data.reduce((sum, record) => 
      sum + (record.hours || 0), 0);
  }

  private calculateHours(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 0;
    
    const [checkInHour, checkInMinute] = checkIn.split(':').map(Number);
    const [checkOutHour, checkOutMinute] = checkOut.split(':').map(Number);
    
    const totalMinutes = (checkOutHour * 60 + checkOutMinute) - (checkInHour * 60 + checkInMinute);
    return Math.round((totalMinutes / 60) * 100) / 100;
  }

  getStatusChipColor(status: string): string {
    switch (status) {
      case 'present': return 'primary';
      case 'late': return 'warn';
      case 'absent': return 'accent';
      default: return '';
    }
  }

  onFilterChange(): void {
    this.loadAttendanceRecords();
  }
}
