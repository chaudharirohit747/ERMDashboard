import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-report-list',
  templateUrl: './report-list.component.html',
  styleUrls: ['./report-list.component.scss']
})
export class ReportListComponent {
  isGenerating = false;
  currentReport = '';

  constructor(private snackBar: MatSnackBar) {}

  generateReport(type: string): void {
    this.isGenerating = true;
    this.currentReport = type;

    // Simulate report generation
    setTimeout(() => {
      this.isGenerating = false;
      this.currentReport = '';
      
      // Show success message
      this.snackBar.open(`${type} report generated successfully!`, 'Close', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });

      // TODO: Implement actual report generation and download
      const link = document.createElement('a');
      link.href = 'data:text/csv;charset=utf-8,Report Data'; // Replace with actual report data
      link.download = `${type}-report.csv`;
      link.click();
    }, 2000);
  }
}
