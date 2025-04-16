import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Employee } from '../../services/employee.service';
import { DepartmentService, Department } from '@app/features/departments/services/department.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-employee-form',
  templateUrl: './employee-form.component.html',
  styleUrls: ['./employee-form.component.scss']
})
export class EmployeeFormComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;
  departments$: Observable<Department[]> = of([]);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EmployeeFormComponent>,
    private departmentService: DepartmentService,
    @Inject(MAT_DIALOG_DATA) private data?: Employee
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      firstName: [data?.firstName || '', [Validators.required]],
      lastName: [data?.lastName || '', [Validators.required]],
      email: [data?.email || '', [Validators.required, Validators.email]],
      phone: [data?.phone || '', [Validators.required]],
      departmentId: [data?.departmentId || '', [Validators.required]],
      position: [data?.position || '', [Validators.required]],
      hireDate: [data?.hireDate || new Date(), [Validators.required]],
      salary: [data?.salary || 0, [Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.departments$ = this.departmentService.getDepartments();
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        _id: this.data?._id
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
