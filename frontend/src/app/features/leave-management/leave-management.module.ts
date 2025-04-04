import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatNativeDateModule } from '@angular/material/core';

import { LeaveManagementComponent } from './components/leave-management/leave-management.component';
import { LeaveBalanceComponent } from './components/leave-balance/leave-balance.component';
import { LeaveCalendarComponent } from './components/leave-calendar/leave-calendar.component';
import { LeaveListComponent } from './components/leave-list/leave-list.component';
import { LeaveRequestFormComponent } from './components/leave-request-form/leave-request-form.component';
import { AuthGuard } from '@app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    component: LeaveManagementComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'request',
    component: LeaveRequestFormComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  declarations: [
    LeaveManagementComponent,
    LeaveBalanceComponent,
    LeaveCalendarComponent,
    LeaveListComponent,
    LeaveRequestFormComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    NgChartsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatDatepickerModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatNativeDateModule
  ],
  exports: [
    RouterModule,
    LeaveManagementComponent,
    LeaveBalanceComponent,
    LeaveCalendarComponent,
    LeaveListComponent,
    LeaveRequestFormComponent
  ]
})
export class LeaveManagementModule { }
