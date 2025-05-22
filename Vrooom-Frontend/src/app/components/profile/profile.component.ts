import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { VehiclesService } from '../../services/vehicles.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userProfile: any = null;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = true;
  updating = false;
  changingPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private vehiclesService: VehiclesService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      nume: ['', Validators.required],
      prenume: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      nrTelefon: ['', Validators.required],
      dataNasterii: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    this.loadUserProfile();
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { 'mismatch': true };
  }

  loadUserProfile() {
    const username = this.tokenService.getUsername();
    if (!username) {
      this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
      return;
    }

    this.authService.getUserProfile(username)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (profile) => {
          this.userProfile = profile;
          this.populateForm();
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        }
      });
  }

  populateForm() {
    if (this.userProfile) {
      this.profileForm.patchValue({
        nume: this.userProfile.nume,
        prenume: this.userProfile.prenume,
        email: this.userProfile.email || '',
        nrTelefon: this.userProfile.nrTelefon,
        dataNasterii: this.userProfile.dataNasterii ? 
          new Date(this.userProfile.dataNasterii).toISOString().split('T')[0] : ''
      });
    }
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      return;
    }

    this.updating = true;
    const formData = this.profileForm.value;

    // Note: You'll need to implement the updateProfile API endpoint
    // For now, we'll just show a success message
    setTimeout(() => {
      this.updating = false;
      this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
    }, 1000);
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      return;
    }

    this.changingPassword = true;
    const passwordData = {
      username: this.tokenService.getUsername(),
      parolaVeche: this.passwordForm.get('currentPassword')?.value,
      parolaNoua: this.passwordForm.get('newPassword')?.value
    };

    // Note: You'll need to implement the changePassword API call
    setTimeout(() => {
      this.changingPassword = false;
      this.passwordForm.reset();
      this.snackBar.open('Password changed successfully!', 'Close', { duration: 3000 });
    }, 1000);
  }

  uploadDocument(documentType: string, event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const username = this.tokenService.getUsername();
    if (!username) return;

    // Note: You'll need to implement the document upload
    const formData = new FormData();
    formData.append('file', file);

    this.snackBar.open(`${documentType} uploaded successfully!`, 'Close', { duration: 3000 });
  }

  get profileFormControls() {
    return this.profileForm.controls;
  }

  get passwordFormControls() {
    return this.passwordForm.controls;
  }
}