import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatMenuTrigger } from '@angular/material/menu';
import { Employee, EmployeeService } from '../../services/employee.service';
import { EmployeeFormComponent } from '../employee-form/employee-form.component';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {
  displayedColumns: string[] = ['name', 'email', 'department', 'position', 'actions'];  //, 'salary'
  dataSource!: MatTableDataSource<Employee>;
  isLoading = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatMenuTrigger) menuTrigger!: MatMenuTrigger;

  constructor(
    private employeeService: EmployeeService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoading = true;
    this.employeeService.getEmployees().subscribe(
      employees => {
        this.dataSource = new MatTableDataSource(employees);
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      },
      error => {
        console.error('Error loading employees:', error);
        this.snackBar.open('Error loading employees', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    );
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openEmployeeForm(employee?: Employee): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      data: employee
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result._id) {
          this.employeeService.updateEmployee(result._id, result).subscribe({
            next: () => {
              this.loadEmployees();
              this.snackBar.open('Employee updated successfully', 'Close', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error updating employee:', error);
              this.snackBar.open(error.message || 'Error updating employee', 'Close', { duration: 3000 });
            }
          });
        } else {
          this.employeeService.addEmployee(result).subscribe({
            next: () => {
              this.loadEmployees();
              this.snackBar.open('Employee added successfully', 'Close', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error adding employee:', error);
              this.snackBar.open(error.message || 'Error adding employee', 'Close', { duration: 3000 });
            }
          });
        }
      }
    });
  }

  deleteEmployee(employee: Employee): void {
    if (!employee._id) {
      this.snackBar.open('Cannot delete employee: Missing ID', 'Close', { duration: 3000 });
      return;
    }

    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(employee._id).subscribe({
        next: () => {
          this.loadEmployees();
          this.snackBar.open('Employee deleted successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error deleting employee:', error);
          this.snackBar.open(error.message || 'Error deleting employee', 'Close', { duration: 3000 });
        }
      });
    }
  }
}
