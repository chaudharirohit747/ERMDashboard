import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService, DashboardStats, ChartData, Activity } from '../../services/dashboard.service';
import { Subject, takeUntil, finalize } from 'rxjs';

interface DashboardCard {
  title: string;
  value: number;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private refreshInterval: any;

  // Loading states
  isCardsLoading = true;
  isEmployeeChartLoading = true;
  isDepartmentChartLoading = true;
  isActivitiesLoading = true;

  // Error states
  cardsError: string | null = null;
  employeeChartError: string | null = null;
  departmentChartError: string | null = null;
  activitiesError: string | null = null;

  cards: DashboardCard[] = [
    { title: 'Total Employees', value: 0, icon: 'people', color: '#1976d2' },
    { title: 'Departments', value: 0, icon: 'business', color: '#388e3c' },
    { title: 'New Hires', value: 0, icon: 'person_add', color: '#f57c00' },
    { title: 'Leave Requests', value: 0, icon: 'event_busy', color: '#d32f2f' }
  ];

  employeeChart: ChartData = {
    labels: [],
    data: []
  };

  departmentChart: ChartData = {
    labels: [],
    data: []
  };

  recentActivities: Activity[] = [];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startAutoRefresh(): void {
    // Refresh every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.loadDashboardData();
    }, 5 * 60 * 1000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private loadDashboardData(): void {
    // Reset error states
    this.cardsError = null;
    this.employeeChartError = null;
    this.departmentChartError = null;
    this.activitiesError = null;

    // Load dashboard stats
    this.isCardsLoading = true;
    this.dashboardService.getDashboardStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCardsLoading = false)
      )
      .subscribe({
        next: stats => this.updateCards(stats),
        error: error => this.cardsError = 'Failed to load dashboard stats'
      });

    // Load employee growth chart
    this.isEmployeeChartLoading = true;
    this.dashboardService.getEmployeeGrowth()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isEmployeeChartLoading = false)
      )
      .subscribe({
        next: data => this.employeeChart = data,
        error: error => this.employeeChartError = 'Failed to load employee growth data'
      });

    // Load department distribution
    this.isDepartmentChartLoading = true;
    this.dashboardService.getDepartmentDistribution()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDepartmentChartLoading = false)
      )
      .subscribe({
        next: data => this.departmentChart = data,
        error: error => this.departmentChartError = 'Failed to load department distribution'
      });

    // Load recent activities
    this.isActivitiesLoading = true;
    this.dashboardService.getRecentActivities()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isActivitiesLoading = false)
      )
      .subscribe({
        next: activities => this.recentActivities = activities,
        error: error => this.activitiesError = 'Failed to load recent activities'
      });
  }

  private updateCards(stats: DashboardStats): void {
    this.cards = [
      { title: 'Total Employees', value: stats.totalEmployees, icon: 'people', color: '#1976d2' },
      { title: 'Departments', value: stats.totalDepartments, icon: 'business', color: '#388e3c' },
      { title: 'New Hires', value: stats.newHires, icon: 'person_add', color: '#f57c00' },
      { title: 'Leave Requests', value: stats.pendingLeaves, icon: 'event_busy', color: '#d32f2f' }
    ];
  }

  getActivityIcon(type: string): string {
    const icons: { [key: string]: string } = {
      new_hire: 'person_add',
      leave: 'event_busy',
      department: 'business',
      performance: 'assessment'
    };
    return icons[type] || 'info';
  }

  formatActivityTime(time: string): string {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
    if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }
    if (minutes > 0) {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    return 'Just now';
  }

  retryLoad(section: 'cards' | 'employeeChart' | 'departmentChart' | 'activities'): void {
    switch (section) {
      case 'cards':
        this.cardsError = null;
        this.loadCards();
        break;
      case 'employeeChart':
        this.employeeChartError = null;
        this.loadEmployeeGrowth();
        break;
      case 'departmentChart':
        this.departmentChartError = null;
        this.loadDepartmentDistribution();
        break;
      case 'activities':
        this.activitiesError = null;
        this.loadRecentActivities();
        break;
    }
  }

  private loadCards(): void {
    this.isCardsLoading = true;
    this.dashboardService.getDashboardStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCardsLoading = false)
      )
      .subscribe({
        next: stats => this.updateCards(stats),
        error: error => this.cardsError = 'Failed to load dashboard stats'
      });
  }

  private loadEmployeeGrowth(): void {
    this.isEmployeeChartLoading = true;
    this.dashboardService.getEmployeeGrowth()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isEmployeeChartLoading = false)
      )
      .subscribe({
        next: data => this.employeeChart = data,
        error: error => this.employeeChartError = 'Failed to load employee growth data'
      });
  }

  private loadDepartmentDistribution(): void {
    this.isDepartmentChartLoading = true;
    this.dashboardService.getDepartmentDistribution()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDepartmentChartLoading = false)
      )
      .subscribe({
        next: data => this.departmentChart = data,
        error: error => this.departmentChartError = 'Failed to load department distribution'
      });
  }

  private loadRecentActivities(): void {
    this.isActivitiesLoading = true;
    this.dashboardService.getRecentActivities()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isActivitiesLoading = false)
      )
      .subscribe({
        next: activities => this.recentActivities = activities,
        error: error => this.activitiesError = 'Failed to load recent activities'
      });
  }
}
