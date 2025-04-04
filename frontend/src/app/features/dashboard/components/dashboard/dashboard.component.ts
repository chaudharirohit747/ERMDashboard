import { Component, OnInit } from '@angular/core';

interface DashboardCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

interface ChartData {
  labels: string[];
  data: number[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  cards: DashboardCard[] = [
    { title: 'Total Employees', value: 150, icon: 'people', color: '#1976d2' },
    { title: 'Departments', value: 8, icon: 'business', color: '#388e3c' },
    { title: 'New Hires', value: 12, icon: 'person_add', color: '#f57c00' },
    { title: 'Leave Requests', value: 5, icon: 'event_busy', color: '#d32f2f' }
  ];

  employeeChart: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    data: [120, 125, 130, 135, 145, 150]
  };

  departmentChart: ChartData = {
    labels: ['IT', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations', 'R&D', 'Support'],
    data: [30, 15, 25, 20, 15, 20, 10, 15]
  };

  recentActivities = [
    { type: 'promotion', message: 'Rohit Chaudhari is promoted to Software Engineer', time: '2 hours ago' },
    { type: 'leave', message: 'Sarah approved Mark\'s leave request', time: '4 hours ago' },
    { type: 'department', message: 'New project team created in IT Department', time: '1 day ago' },
    { type: 'performance', message: 'Quarterly performance reviews completed', time: '2 days ago' }
  ];

  constructor() {}

  ngOnInit(): void {}

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      new_hire: 'person_add',
      leave: 'event_busy',
      department: 'business',
      performance: 'assessment'
    };
    return icons[type] || 'info';
  }
}
