import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  imports: [
    CommonModule, 
    RouterModule, 
    MatButtonModule, 
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  styleUrls: ['./login.component.scss'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('600ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('slideOut', [
      state('in', style({ opacity: 1, transform: 'translateX(0)' })),
      state('out', style({ opacity: 0, transform: 'translateX(-100%)' })),
      transition('in => out', animate('500ms ease-in'))
    ]),
    trigger('successAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)', 
          style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class LoginComponent {
  loginForm: FormGroup;
  loading = false;
  errorMessage = '';
  hidePassword = true;
  loginSuccess = false;
  animationState = 'in';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    const credentials = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(credentials)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          // Save remember me preference
          if (this.loginForm.get('remember')?.value) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedUsername', credentials.username);
          } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedUsername');
          }
          
          // Show success animation and then navigate
          this.showSuccessAndNavigate();
        },
        error: (error) => {
          console.error('Login error:', error);
          this.handleLoginError(error);
          this.shakeForm();
        }
      });
  }

  private showSuccessAndNavigate(): void {
    this.loginSuccess = true;
    
    // Wait for success animation to complete, then slide out and navigate
    setTimeout(() => {
      this.animationState = 'out';
      
      // Navigate after slide out animation
      setTimeout(() => {
        this.router.navigate(['/landing']);
      }, 500);
    }, 1000);
  }

  private shakeForm(): void {
    const formElement = document.querySelector('.login-card');
    if (formElement) {
      formElement.classList.add('shake');
      setTimeout(() => {
        formElement.classList.remove('shake');
      }, 600);
    }
  }

  private handleLoginError(error: any): void {
    if (error.status === 400) {
      this.errorMessage = 'Invalid username or password. Please check your credentials and try again.';
    } else if (error.status === 404) {
      this.errorMessage = 'User not found. Please check your username or sign up for a new account.';
    } else if (error.status === 401) {
      this.errorMessage = 'Access denied. Please verify your credentials.';
    } else if (error.status === 423) {
      this.errorMessage = 'Account is locked. Please contact support or try again later.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else {
      this.errorMessage = 'Login failed. Please try again or contact support if the problem persists.';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Load remembered username on component init
  ngOnInit(): void {
    const rememberMe = localStorage.getItem('rememberMe');
    const rememberedUsername = localStorage.getItem('rememberedUsername');
    
    if (rememberMe === 'true' && rememberedUsername) {
      this.loginForm.patchValue({
        username: rememberedUsername,
        remember: true
      });
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  // Clear error message when user starts typing
  onInputChange(): void {
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  // Handle forgot password
  onForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  // Handle social login (placeholder for future implementation)
  onSocialLogin(provider: string): void {
    console.log(`Social login with ${provider} - Feature coming soon!`);
  }
}