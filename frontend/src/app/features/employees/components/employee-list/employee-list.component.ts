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
  displayedColumns: string[] = ['name', 'email', 'department', 'position', 'salary', 'actions'];
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

  onAddEmployee(): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeeService.addEmployee(result).subscribe(
          () => {
            this.loadEmployees();
            this.snackBar.open('Employee added successfully', 'Close', { duration: 3000 });
          },
          error => {
            console.error('Error adding employee:', error);
            this.snackBar.open('Error adding employee', 'Close', { duration: 3000 });
          }
        );
      }
    });
  }

  onEditEmployee(employee: Employee): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      data: employee
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeeService.updateEmployee(employee.id, result).subscribe(
          () => {
            this.loadEmployees();
            this.snackBar.open('Employee updated successfully', 'Close', { duration: 3000 });
          },
          error => {
            console.error('Error updating employee:', error);
            this.snackBar.open('Error updating employee', 'Close', { duration: 3000 });
          }
        );
      }
    });
  }

  onDeleteEmployee(employee: Employee): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(employee.id).subscribe(
        () => {
          this.loadEmployees();
          this.snackBar.open('Employee deleted successfully', 'Close', { duration: 3000 });
        },
        error => {
          console.error('Error deleting employee:', error);
          this.snackBar.open('Error deleting employee', 'Close', { duration: 3000 });
        }
      );
    }
  }
}
