import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DocumentService } from '../../services/document.service';
import { finalize } from 'rxjs/operators';
import { 
  validatorParola, 
  validatorVarsta, 
  validatorPoza, 
  validatorEmail 
} from '../../validator/user.validator';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  signupForm: FormGroup;
  loading = false;
  errorMessage = '';
  selectedFile: File | null = null;
  
  // File validation constants
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private documentService: DocumentService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.signupForm = this.createForm();
  }

  ngOnInit(): void {
    // Component initialization if needed
    this.setupFormValidation();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      username: ['', [
        Validators.required, 
        Validators.minLength(4), 
        Validators.maxLength(30),
        Validators.pattern(/^[a-zA-Z0-9_]+$/) // Only alphanumeric and underscore
      ]],
      email: ['', [Validators.required, validatorEmail]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, validatorParola]],
      confirmPassword: ['', [Validators.required]],
      birthDate: ['', [Validators.required, validatorVarsta]],
      profilePicture: [null, [Validators.required, validatorPoza]]
    }, {
      validators: [this.passwordMatchValidator.bind(this)]
    });
  }

  private setupFormValidation(): void {
    // Watch for changes in password field to revalidate confirm password
    this.signupForm.get('password')?.valueChanges.subscribe(() => {
      this.signupForm.get('confirmPassword')?.updateValueAndValidity();
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password === confirmPassword ? null : { mismatch: true };
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    
    // Validate file
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      this.showError(validation.errorMessage || 'Invalid file selected');
      this.clearFileSelection();
      return;
    }

    // Set the selected file
    this.selectedFile = file;
    this.signupForm.patchValue({
      profilePicture: file
    });
    this.signupForm.get('profilePicture')?.updateValueAndValidity();

    this.showSuccess(`Profile picture selected: ${file.name}`);
  }

  private validateFile(file: File): { isValid: boolean; errorMessage?: string } {
    // Check file type
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      return {
        isValid: false,
        errorMessage: 'Only JPEG, JPG, and PNG files are allowed'
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: `File size must be less than ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // Check if file is not empty
    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: 'File cannot be empty'
      };
    }

    return { isValid: true };
  }

  private clearFileSelection(): void {
    this.selectedFile = null;
    this.signupForm.patchValue({
      profilePicture: null
    });
    
    // Clear the file input
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.markAllFieldsAsTouched();
      this.showError('Please fill in all required fields correctly');
      return;
    }

    if (!this.selectedFile) {
      this.showError('Please select a profile picture');
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Prepare user data
    const userData = this.prepareUserData();

    console.log('🚀 Starting user registration process...');
    console.log('📋 User data:', {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone,
      birthDate: userData.birthDate,
      profilePictureSize: this.selectedFile?.size,
      profilePictureName: this.selectedFile?.name
    });

    // Register user
    this.authService.register(userData)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          console.log('✅ Registration successful:', response);
          this.handleRegistrationSuccess();
        },
        error: (error) => {
          console.error('❌ Registration failed:', error);
          this.handleRegistrationError(error);
        }
      });
  }

  private prepareUserData(): any {
    const formData = this.signupForm.value;
    
    return {
      username: formData.username?.trim(),
      password: formData.password,
      firstName: formData.firstName?.trim(),
      lastName: formData.lastName?.trim(),
      email: formData.email?.trim().toLowerCase(),
      phone: formData.phone?.trim() || '',
      birthDate: formData.birthDate,
      profilePicture: this.selectedFile
    };
  }

  private handleRegistrationSuccess(): void {
    this.showSuccess(
      '🎉 Account created successfully! Please check your email to verify your account.',
      10000
    );

    // Clear form
    this.signupForm.reset();
    this.clearFileSelection();

    // Navigate to login after a short delay
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { 
          message: 'Please check your email to verify your account before logging in'
        }
      });
    }, 2000);
  }

  private handleRegistrationError(error: any): void {
    let errorMessage = 'Registration failed. Please try again.';

    if (error.status === 400) {
      if (error.error && typeof error.error === 'object') {
        if (Array.isArray(error.error)) {
          errorMessage = error.error.join(', ');
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else {
          // Handle object with error details
          const errors = Object.values(error.error).flat();
          errorMessage = errors.join(', ');
        }
      }
    } else if (error.status === 409) {
      errorMessage = 'Username or email already exists. Please choose different credentials.';
    } else if (error.status === 413) {
      errorMessage = 'Profile picture is too large. Please choose a smaller image.';
    } else if (error.status === 422) {
      errorMessage = 'Invalid data provided. Please check all fields.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    this.errorMessage = errorMessage;
    this.showError(errorMessage);
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }

  // Utility methods for file handling
  getFileSize(bytes: number): string {
    return this.documentService.formatFileSize(bytes);
  }

  isImageFile(file: File): boolean {
    return this.documentService.isImageFile(file);
  }

  // Notification methods
  private showSuccess(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showError(message: string, duration: number = 8000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  private showInfo(message: string, duration: number = 5000): void {
    this.snackBar.open(message, 'Close', {
      duration,
      panelClass: ['info-snackbar'],
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
  }

  // Getters for template
  get f() {
    return this.signupForm.controls;
  }

  get isFormValid(): boolean {
    return this.signupForm.valid && !!this.selectedFile;
  }

  get selectedFileName(): string {
    return this.selectedFile?.name || '';
  }

  get selectedFileSize(): string {
    return this.selectedFile ? this.getFileSize(this.selectedFile.size) : '';
  }

  // Debug methods (can be removed in production)
  debugFormState(): void {
    console.log('📋 Form State Debug:');
    console.log('Valid:', this.signupForm.valid);
    console.log('Values:', this.signupForm.value);
    console.log('Errors:', this.getFormErrors());
    console.log('Selected File:', this.selectedFile);
  }

  private getFormErrors(): any {
    const errors: any = {};
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control?.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // Methods for clearing specific errors
  clearErrorMessage(): void {
    this.errorMessage = '';
  }

  // File upload utility methods
  triggerFileInput(): void {
    this.fileInput?.nativeElement?.click();
  }

  removeSelectedFile(): void {
    this.clearFileSelection();
    this.showInfo('Profile picture removed');
  }

  // Form reset method
  resetForm(): void {
    this.signupForm.reset();
    this.clearFileSelection();
    this.clearErrorMessage();
    this.loading = false;
  }

  // Validation helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  getFieldError(fieldName: string): string | null {
    const field = this.signupForm.get(fieldName);
    if (!field?.errors || !field?.touched) {
      return null;
    }

    const errors = field.errors;
    
    if (errors['required']) return `${fieldName} is required`;
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `${fieldName} cannot exceed ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return `${fieldName} contains invalid characters`;
    if (errors['parolaInvalida']) return 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character';
    if (errors['minor']) return 'You must be at least 18 years old';
    if (errors['extensieIncorecta']) return 'Only JPG, JPEG, and PNG files are allowed';
    
    return 'Invalid input';
  }

  // Password strength indicator (optional enhancement)
  getPasswordStrength(): string {
    const password = this.signupForm.get('password')?.value || '';
    
    if (password.length === 0) return '';
    if (password.length < 6) return 'weak';
    if (password.length < 10) return 'medium';
    return 'strong';
  }
}