import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Department } from '../../services/department.service';

@Component({
  selector: 'app-department-form',
  templateUrl: './department-form.component.html',
  styleUrls: ['./department-form.component.scss']
})
export class DepartmentFormComponent {
  form: FormGroup;
  isEdit: boolean;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DepartmentFormComponent>,
    @Inject(MAT_DIALOG_DATA) private data?: Department
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      name: [data?.name || '', [Validators.required]],
      description: [data?.description || '', [Validators.required]],
      employeeCount: [data?.employeeCount || 0, [Validators.required, Validators.min(0)]],
      budget: [data?.budget || 0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        id: this.data?.id
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
