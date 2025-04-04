import { Component, OnInit, ViewChild } from '@angular/core';
import { LeaveService, LeaveBalance } from '@app/core/services/leave.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-leave-balance',
  templateUrl: './leave-balance.component.html',
  styleUrls: ['./leave-balance.component.scss']
})
export class LeaveBalanceComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  leaveBalances: LeaveBalance[] = [];
  isLoading = false;
  displayedColumns = ['type', 'total', 'used', 'remaining'];

  // Chart configuration
  chartType: ChartType = 'bar';
  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  chartData: ChartData = {
    labels: [],
    datasets: [
      {
        label: 'Total',
        data: [],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Used',
        data: [],
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      },
      {
        label: 'Remaining',
        data: [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  constructor(
    private leaveService: LeaveService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadLeaveBalances();
  }

  loadLeaveBalances(): void {
    this.isLoading = true;
    this.leaveService.getLeaveBalances().subscribe({
      next: (balances) => {
        this.leaveBalances = balances;
        this.updateChartData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading leave balances:', error);
        this.snackBar.open('Error loading leave balances', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  private updateChartData(): void {
    this.chartData.labels = this.leaveBalances.map(b => b.leaveType);
    this.chartData.datasets[0].data = this.leaveBalances.map(b => b.total);
    this.chartData.datasets[1].data = this.leaveBalances.map(b => b.used);
    this.chartData.datasets[2].data = this.leaveBalances.map(b => b.remaining);
    this.chart?.update();
  }

  getProgressColor(used: number, total: number): string {
    const percentage = (used / total) * 100;
    if (percentage >= 80) return 'warn';
    if (percentage >= 60) return 'accent';
    return 'primary';
  }

  getProgressValue(used: number, total: number): number {
    return Math.min((used / total) * 100, 100);
  }
}
