import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule
  ],
  template: `
    <div class="confirmation-container">
      <div class="confirmation-content">
        <mat-card class="confirmation-card">
          <mat-card-content>
            @if (loading) {
              <div class="loading-section">
                <mat-spinner diameter="60"></mat-spinner>
                <h2>Confirming your email...</h2>
                <p>Please wait while we verify your email address.</p>
              </div>
            } @else if (confirmed) {
              <div class="success-section">
                <mat-icon class="success-icon">check_circle</mat-icon>
                <h1>Email Confirmed Successfully!</h1>
                <p>Your email address has been verified. You can now log in to your account.</p>
                <div class="actions">
                  <button mat-raised-button color="primary" (click)="navigateToLogin()">
                    <mat-icon>login</mat-icon>
                    Go to Login
                  </button>
                </div>
              </div>
            } @else if (alreadyConfirmed) {
              <div class="info-section">
                <mat-icon class="info-icon">info</mat-icon>
                <h1>Email Already Confirmed</h1>
                <p>Your email address was already verified. You can log in to your account.</p>
                <div class="actions">
                  <button mat-raised-button color="primary" (click)="navigateToLogin()">
                    <mat-icon>login</mat-icon>
                    Go to Login
                  </button>
                </div>
              </div>
            } @else {
              <div class="error-section">
                <mat-icon class="error-icon">error</mat-icon>
                <h1>Email Confirmation Failed</h1>
                <p>{{ errorMessage }}</p>
                @if (invalidToken) {
                  <p class="help-text">
                    The confirmation link may have expired or is invalid. 
                    Please try registering again or contact support.
                  </p>
                }
                <div class="actions">
                  <button mat-raised-button color="primary" (click)="navigateToSignup()">
                    <mat-icon>person_add</mat-icon>
                    Back to Signup
                  </button>
                  <button mat-button (click)="retryConfirmation()" [disabled]="loading">
                    <mat-icon>refresh</mat-icon>
                    Try Again
                  </button>
                </div>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .confirmation-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .confirmation-content {
      width: 100%;
      max-width: 600px;
    }

    .confirmation-card {
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      overflow: hidden;
    }

    .loading-section,
    .success-section,
    .info-section,
    .error-section {
      text-align: center;
      padding: 3rem;
    }

    .success-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #4caf50;
      margin-bottom: 1rem;
    }

    .info-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #2196f3;
      margin-bottom: 1rem;
    }

    .error-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #f44336;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 600;
      margin-bottom: 1rem;
      color: #333;
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 500;
      margin-bottom: 1rem;
      color: #333;
    }

    p {
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .help-text {
      font-size: 0.9rem;
      color: #888;
      font-style: italic;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .actions button {
      min-width: 140px;
      height: 48px;
      border-radius: 24px;
      font-weight: 600;
    }

    mat-spinner {
      margin-bottom: 1rem;
    }

    @media (max-width: 600px) {
      .confirmation-container {
        padding: 1rem;
      }

      .loading-section,
      .success-section,
      .info-section,
      .error-section {
        padding: 2rem 1rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      p {
        font-size: 1rem;
      }

      .actions {
        flex-direction: column;
        align-items: stretch;
      }

      .actions button {
        width: 100%;
      }
    }
  `]
})
export class EmailConfirmationComponent implements OnInit {
  loading = true;
  confirmed = false;
  alreadyConfirmed = false;
  invalidToken = false;
  errorMessage = '';

  private username = '';
  private token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Get parameters from URL
    this.route.queryParams.subscribe(params => {
      this.username = params['username'];
      this.token = params['token'];

      console.log('📧 Email confirmation params:', { 
        username: this.username, 
        tokenPresent: !!this.token 
      });

      if (this.username && this.token) {
        this.confirmEmail();
      } else {
        this.loading = false;
        this.errorMessage = 'Invalid confirmation link. Missing username or token.';
      }
    });
  }

  confirmEmail() {
    if (!this.username || !this.token) {
      this.loading = false;
      this.errorMessage = 'Invalid confirmation parameters';
      return;
    }

    console.log(`🔄 Confirming email for user: ${this.username}`);

    this.authService.confirmEmail(this.username, this.token)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('✅ Email confirmation response:', response);
          
          if (response?.alreadyConfirmed) {
            this.alreadyConfirmed = true;
          } else {
            this.confirmed = true;
          }
        },
        error: (error) => {
          console.error('❌ Email confirmation failed:', error);
          
          if (error.error?.invalidToken) {
            this.invalidToken = true;
            this.errorMessage = 'The confirmation link is invalid or has expired.';
          } else {
            this.errorMessage = error.error?.error || error.error?.details?.join(', ') || 
                              'Failed to confirm email. Please try again.';
          }
        }
      });
  }

  retryConfirmation() {
    this.loading = true;
    this.confirmed = false;
    this.alreadyConfirmed = false;
    this.invalidToken = false;
    this.errorMessage = '';
    
    setTimeout(() => {
      this.confirmEmail();
    }, 1000);
  }

  navigateToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { 
        emailConfirmed: 'true',
        username: this.username 
      }
    });
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }
}