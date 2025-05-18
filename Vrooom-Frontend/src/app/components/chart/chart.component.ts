import { Component, Input, OnInit, AfterViewInit, ElementRef, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

declare const Chart: any;

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('chartCanvas') chartCanvas: ElementRef;
  
  @Input() data: any[] = [];
  @Input() labels: string[] = [];
  @Input() type: 'bar' | 'line' | 'pie' | 'doughnut' = 'bar';
  @Input() title: string = '';
  @Input() height: number = 250;
  @Input() showLegend: boolean = true;
  @Input() colors: string[] = [];
  
  private chart: any;
  private defaultColors = [
    '#3c82bd', '#ff7096', '#ffb74d', '#4caf50', '#9c27b0', 
    '#5c6bc0', '#ec407a', '#26a69a', '#ab47bc', '#7e57c2'
  ];
  
  constructor() {}
  
  ngOnInit(): void {
    this.loadChartJsScript();
  }
  
  ngAfterViewInit(): void {
    if (window.hasOwnProperty('Chart')) {
      this.renderChart();
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.chart && (changes['data'] || changes['type'])) {
      this.updateChart();
    }
  }
  
  private loadChartJsScript(): void {
    // Check if Chart.js is already loaded
    if (window.hasOwnProperty('Chart')) {
      return;
    }
    
    // Load Chart.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => this.renderChart();
    document.head.appendChild(script);
  }
  
  private renderChart(): void {
    if (!this.chartCanvas || !this.data || this.data.length === 0) {
      return;
    }
    
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    
    // Prepare labels and values based on data format
    let chartLabels: string[] = [];
    let chartValues: number[] = [];
    
    if (this.labels && this.labels.length > 0) {
      // If labels are provided directly
      chartLabels = this.labels;
      chartValues = this.data as number[];
    } else if (this.data[0] && (this.data[0].hasOwnProperty('name') || this.data[0].hasOwnProperty('label'))) {
      // If data is in {name/label, value} format
      chartLabels = this.data.map(item => item.name || item.label);
      chartValues = this.data.map(item => item.value);
    } else if (Array.isArray(this.data[0])) {
      // If data is in [label, value] format
      chartLabels = this.data.map(item => item[0]);
      chartValues = this.data.map(item => item[1]);
    } else {
      // Use the data as is
      chartLabels = Object.keys(this.data);
      chartValues = Object.values(this.data);
    }
    
    // Get colors based on chart type
    const chartColors = this.getChartColors();
    
    // Configuration for different chart types
    let chartConfig: any = {
      type: this.type,
      data: {
        labels: chartLabels,
        datasets: [{
          label: this.title,
          data: chartValues,
          backgroundColor: this.type === 'line' ? 'rgba(60, 130, 189, 0.2)' : chartColors,
          borderColor: this.type === 'line' ? '#3c82bd' : chartColors,
          borderWidth: 2,
          tension: 0.3,
          pointBackgroundColor: '#3c82bd',
          pointRadius: 4,
          hoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: this.showLegend && ['pie', 'doughnut'].includes(this.type),
            position: 'bottom',
            labels: {
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              },
              padding: 16
            }
          },
          title: {
            display: !!this.title,
            text: this.title,
            font: {
              family: "'Poppins', sans-serif",
              size: 16,
              weight: 'bold'
            },
            padding: {
              bottom: 16
            }
          },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              family: "'Poppins', sans-serif",
              size: 14
            },
            bodyFont: {
              family: "'Poppins', sans-serif",
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            callbacks: {}
          }
        },
        scales: {
          x: {
            display: this.type !== 'pie' && this.type !== 'doughnut',
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              }
            }
          },
          y: {
            display: this.type !== 'pie' && this.type !== 'doughnut',
            beginAtZero: true,
            grid: {
              drawBorder: false
            },
            ticks: {
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              }
            }
          }
        },
        layout: {
          padding: 16
        },
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      }
    };
    
    // Specific configurations for different chart types
    if (this.type === 'pie' || this.type === 'doughnut') {
      chartConfig.options.plugins.tooltip.callbacks.label = (context) => {
        const label = context.label || '';
        const value = context.raw || 0;
        const total = context.dataset.data.reduce((a, b) => a + b, 0);
        const percentage = Math.round((value / total) * 100);
        return `${label}: ${value} (${percentage}%)`;
      };
    }
    
    if (this.type === 'line') {
      chartConfig.options.elements = {
        line: {
          tension: 0.4
        }
      };
    }
    
    // Create chart
    this.chart = new Chart(ctx, chartConfig);
  }
  
  private updateChart(): void {
    if (!this.chart) {
      this.renderChart();
      return;
    }
    
    // Update the data
    let chartLabels: string[] = [];
    let chartValues: number[] = [];
    
    if (this.labels && this.labels.length > 0) {
      chartLabels = this.labels;
      chartValues = this.data as number[];
    } else if (this.data[0] && (this.data[0].hasOwnProperty('name') || this.data[0].hasOwnProperty('label'))) {
      chartLabels = this.data.map(item => item.name || item.label);
      chartValues = this.data.map(item => item.value);
    } else if (Array.isArray(this.data[0])) {
      chartLabels = this.data.map(item => item[0]);
      chartValues = this.data.map(item => item[1]);
    } else {
      chartLabels = Object.keys(this.data);
      chartValues = Object.values(this.data);
    }
    
    // Get colors based on chart type
    const chartColors = this.getChartColors();
    
    // Update chart data
    this.chart.data.labels = chartLabels;
    this.chart.data.datasets[0].data = chartValues;
    
    // Update chart type if needed
    if (this.chart.config.type !== this.type) {
      this.chart.destroy();
      this.renderChart();
      return;
    }
    
    // Update chart colors
    if (this.type === 'line') {
      this.chart.data.datasets[0].backgroundColor = 'rgba(60, 130, 189, 0.2)';
      this.chart.data.datasets[0].borderColor = '#3c82bd';
    } else {
      this.chart.data.datasets[0].backgroundColor = chartColors;
      this.chart.data.datasets[0].borderColor = chartColors;
    }
    
    // Update title
    this.chart.options.plugins.title.text = this.title;
    
    // Update legend visibility
    this.chart.options.plugins.legend.display = this.showLegend && ['pie', 'doughnut'].includes(this.type);
    
    // Update chart
    this.chart.update();
  }
  
  private getChartColors(): string[] {
    if (this.colors && this.colors.length > 0) {
      return this.colors;
    }
    
    const count = this.data.length || 1;
    
    if (this.type === 'pie' || this.type === 'doughnut') {
      return Array(count).fill(0).map((_, i) => this.defaultColors[i % this.defaultColors.length]);
    }
    
    if (this.type === 'bar') {
      return Array(count).fill(0).map((_, i) => this.defaultColors[i % this.defaultColors.length]);
    }
    
    return this.defaultColors[0];
  }
}