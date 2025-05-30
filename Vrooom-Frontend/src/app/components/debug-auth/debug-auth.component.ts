import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-debug-auth',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="debug-container">
      <mat-card class="debug-card">
        <mat-card-header>
          <mat-card-title>🛠️ Email Confirmation Debug Tools</mat-card-title>
          <mat-card-subtitle>Development Only - Remove in Production</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <!-- Check User Status -->
          <div class="debug-section">
            <h3>Check User Status</h3>
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="debugUsername" placeholder="Enter username">
            </mat-form-field>
            <button mat-raised-button color="primary" 
                    (click)="checkUserStatus()" 
                    [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              Check Status
            </button>
          </div>

          <!-- Force Confirm Email -->
          <div class="debug-section">
            <h3>Force Confirm Email</h3>
            <mat-form-field appearance="outline">
              <mat-label>Username</mat-label>
              <input matInput [(ngModel)]="forceConfirmUsername" placeholder="Enter username">
            </mat-form-field>
            <button mat-raised-button color="warn" 
                    (click)="forceConfirmEmail()" 
                    [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              Force Confirm
            </button>
          </div>

          <!-- Test Email Sending -->
          <div class="debug-section">
            <h3>Test Email Service</h3>
            <mat-form-field appearance="outline">
              <mat-label>Email Address</mat-label>
              <input matInput [(ngModel)]="testEmail" placeholder="Enter email address">
            </mat-form-field>
            <button mat-raised-button color="accent" 
                    (click)="sendTestEmail()" 
                    [disabled]="loading">
              @if (loading) {
                <mat-spinner diameter="20"></mat-spinner>
              }
              Send Test Email
            </button>
          </div>

          <!-- Results Display -->
          @if (results) {
            <div class="results-section">
              <h3>Results:</h3>
              <pre>{{ results | json }}</pre>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .debug-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .debug-card {
      margin-bottom: 2rem;
    }

    .debug-section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .debug-section h3 {
      margin-top: 0;
      color: #333;
    }

    mat-form-field {
      width: 100%;
      margin-bottom: 1rem;
    }

    button {
      width: 100%;
      margin-bottom: 1rem;
    }

    .results-section {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
    }

    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 0.8rem;
      line-height: 1.4;
    }

    mat-spinner {
      margin-right: 8px;
    }
  `]
})
export class DebugAuthComponent {
  debugUsername = '';
  forceConfirmUsername = '';
  testEmail = '';
  loading = false;
  results: any = null;

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  checkUserStatus() {
    if (!this.debugUsername.trim()) {
      this.showMessage('Please enter a username');
      return;
    }

    this.loading = true;
    this.results = null;

    this.authService.debugUserStatus(this.debugUsername).subscribe({
      next: (response) => {
        this.results = {
          action: 'Check User Status',
          success: true,
          data: response
        };
        this.loading = false;
        this.showMessage('User status retrieved successfully');
      },
      error: (error) => {
        this.results = {
          action: 'Check User Status',
          success: false,
          error: error
        };
        this.loading = false;
        this.showMessage('Error retrieving user status');
      }
    });
  }

  forceConfirmEmail() {
    if (!this.forceConfirmUsername.trim()) {
      this.showMessage('Please enter a username');
      return;
    }

    this.loading = true;
    this.results = null;

    this.authService.forceConfirmEmail(this.forceConfirmUsername).subscribe({
      next: (response) => {
        this.results = {
          action: 'Force Confirm Email',
          success: true,
          data: response
        };
        this.loading = false;
        this.showMessage('Email force confirmed successfully');
      },
      error: (error) => {
        this.results = {
          action: 'Force Confirm Email',
          success: false,
          error: error
        };
        this.loading = false;
        this.showMessage('Error force confirming email');
      }
    });
  }

  sendTestEmail() {
    if (!this.testEmail.trim()) {
      this.showMessage('Please enter an email address');
      return;
    }

    this.loading = true;
    this.results = null;

    this.apiService.post('User/test-send-email', this.testEmail).subscribe({
      next: (response) => {
        this.results = {
          action: 'Send Test Email',
          success: true,
          data: response
        };
        this.loading = false;
        this.showMessage('Test email sent successfully');
      },
      error: (error) => {
        this.results = {
          action: 'Send Test Email',
          success: false,
          error: error
        };
        this.loading = false;
        this.showMessage('Error sending test email');
      }
    });
  }

  private showMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000
    });
  }
}