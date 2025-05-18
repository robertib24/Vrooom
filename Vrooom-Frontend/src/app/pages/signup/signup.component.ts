import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { validatorParola, validatorVarsta, validatorPoza, validatorEmail } from '../../validator/user.validator';

@Component({
  selector: 'app-signup',
  imports: [CommonModule, MatButtonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
})
export class SignupComponent {
  signupForm: FormGroup;
  loading = false;
  errorMessage = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, validatorEmail]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, validatorParola]],
      confirmPassword: ['', [Validators.required]],
      birthDate: [null, [Validators.required, validatorVarsta]],
      profilePicture: [null, [validatorPoza]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { 'mismatch': true };
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      this.signupForm.patchValue({
        profilePicture: this.selectedFile
      });
      this.signupForm.get('profilePicture')?.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    
    const userData = {
      ...this.signupForm.value,
      profilePicture: this.selectedFile
    };

    this.authService.register(userData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.snackBar.open('Registration successful! Please check your email to confirm your account.', 'Close', {
            duration: 5000,
          });
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Registration error:', error);
          if (error.error && typeof error.error === 'object') {
            if (Array.isArray(error.error)) {
              this.errorMessage = error.error.join(', ');
            } else {
              this.errorMessage = Object.values(error.error).join(', ');
            }
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }
        }
      });
  }

  get f() {
    return this.signupForm.controls;
  }
}