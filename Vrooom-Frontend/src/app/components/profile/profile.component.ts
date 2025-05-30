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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../services/auth.service';
import { TokenService } from '../../services/token.service';
import { DocumentService } from '../../services/document.service';
import { ApiService } from '../../services/api.service';
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
    MatProgressSpinnerModule,
    MatDialogModule,
    MatProgressBarModule,
    MatChipsModule
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
  uploadingDocument = false;
  uploadProgress: { [key: string]: number } = {};

  // Document upload states
  documentStates = {
    permis: {
      uploaded: false,
      uploading: false,
      verified: false,
      url: '',
      uploadDate: null
    },
    carteIdentitate: {
      uploaded: false,
      uploading: false,
      verified: false,
      url: '',
      uploadDate: null
    }
  };

  // Profile picture upload
  profilePictureFile: File | null = null;
  profilePicturePreview: string | null = null;
  uploadingProfilePicture = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private documentService: DocumentService,
    private apiService: ApiService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
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
      this.showError('User not authenticated');
      return;
    }

    // Load both profile details and user details for email
    this.authService.getUserDetails(username)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (details) => {
          this.userProfile = details;
          this.populateForm();
          this.updateDocumentStates();
          console.log('📋 User profile loaded:', details);
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.showError('Failed to load profile');
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

  updateDocumentStates() {
    if (this.userProfile) {
      // Update document states based on user profile
      this.documentStates.permis.uploaded = this.userProfile.permis;
      this.documentStates.permis.verified = this.userProfile.permis;
      this.documentStates.carteIdentitate.uploaded = this.userProfile.carteIdentitate;
      this.documentStates.carteIdentitate.verified = this.userProfile.carteIdentitate;
    }
  }

  updateProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.updating = true;
    const formData = this.profileForm.value;
    const username = this.tokenService.getUsername();

    if (!username) {
      this.showError('User not authenticated');
      this.updating = false;
      return;
    }

    // Call backend API to update profile
    this.apiService.put(`User/updateProfile/${username}`, formData)
      .pipe(finalize(() => this.updating = false))
      .subscribe({
        next: () => {
          this.showSuccess('Profile updated successfully!');
          this.loadUserProfile(); // Reload to get updated data
        },
        error: (error) => {
          console.error('Error updating profile:', error);
          this.showError('Failed to update profile');
        }
      });
  }

  changePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.changingPassword = true;
    const username = this.tokenService.getUsername();
    
    if (!username) {
      this.showError('User not authenticated');
      this.changingPassword = false;
      return;
    }

    const passwordData = {
      username: username,
      parolaVeche: this.passwordForm.get('currentPassword')?.value,
      parolaNoua: this.passwordForm.get('newPassword')?.value
    };

    this.apiService.post('User/changePassword', passwordData)
      .pipe(finalize(() => this.changingPassword = false))
      .subscribe({
        next: () => {
          this.passwordForm.reset();
          this.showSuccess('Password changed successfully!');
        },
        error: (error) => {
          console.error('Error changing password:', error);
          this.showError('Failed to change password');
        }
      });
  }

  // Profile Picture Upload
  onProfilePictureSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = this.documentService.validateFile(file, 'image');
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid image file');
      return;
    }

    this.profilePictureFile = file;

    // Create preview
    this.documentService.createImagePreview(file).then(preview => {
      this.profilePicturePreview = preview;
    }).catch(error => {
      console.error('Error creating preview:', error);
    });
  }

  uploadProfilePicture() {
    if (!this.profilePictureFile) {
      this.showError('Please select a profile picture');
      return;
    }

    const username = this.tokenService.getUsername();
    if (!username) {
      this.showError('User not authenticated');
      return;
    }

    this.uploadingProfilePicture = true;

    // Upload to backend
    const formData = new FormData();
    formData.append('profilePicture', this.profilePictureFile);

    this.apiService.postFormData(`User/updateProfilePicture/${username}`, formData)
      .pipe(finalize(() => this.uploadingProfilePicture = false))
      .subscribe({
        next: (response) => {
          this.showSuccess('Profile picture updated successfully!');
          this.loadUserProfile(); // Reload to get updated profile picture URL
          this.profilePictureFile = null;
          this.profilePicturePreview = null;
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.showError('Failed to upload profile picture');
        }
      });
  }

  // Document Upload
  uploadDocument(documentType: 'permis' | 'carteIdentitate', event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    const validation = this.documentService.validateFile(file, 'document');
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid document file');
      return;
    }

    const username = this.tokenService.getUsername();
    if (!username) {
      this.showError('User not authenticated');
      return;
    }

    // Update state
    this.documentStates[documentType].uploading = true;
    this.uploadProgress[documentType] = 0;

    // Simulate progress for UX
    const progressInterval = setInterval(() => {
      if (this.uploadProgress[documentType] < 90) {
        this.uploadProgress[documentType] += 10;
      }
    }, 200);

    // Upload document using API service directly
    const formData = new FormData();
    formData.append('file', file);
    
    this.apiService.postFormData(`User/uploadDocument?username=${username}&document=${documentType}`, formData)
      .pipe(
        finalize(() => {
          clearInterval(progressInterval);
          this.documentStates[documentType].uploading = false;
          this.uploadProgress[documentType] = 100;
          setTimeout(() => {
            this.uploadProgress[documentType] = 0;
          }, 2000);
        })
      )
      .subscribe({
        next: (response) => {
          this.documentStates[documentType].uploaded = true;
          this.documentStates[documentType].verified = false; // Will be verified later
          this.documentStates[documentType].uploadDate = new Date();
          
          this.showSuccess(`${this.getDocumentDisplayName(documentType)} uploaded successfully!`);
          this.loadUserProfile(); // Reload to get updated status
        },
        error: (error) => {
          console.error(`Error uploading ${documentType}:`, error);
          this.showError(`Failed to upload ${this.getDocumentDisplayName(documentType)}`);
        }
      });

    // Clear file input
    event.target.value = '';
  }

  getDocumentDisplayName(documentType: string): string {
    switch (documentType) {
      case 'permis':
        return "Driver's License";
      case 'carteIdentitate':
        return 'ID Card';
      default:
        return 'Document';
    }
  }

  getDocumentIcon(documentType: string): string {
    switch (documentType) {
      case 'permis':
        return 'drive_eta';
      case 'carteIdentitate':
        return 'badge';
      default:
        return 'description';
    }
  }

  getDocumentStatus(documentType: 'permis' | 'carteIdentitate'): string {
    const state = this.documentStates[documentType];
    
    if (state.uploading) return 'Uploading...';
    if (state.verified) return 'Verified';
    if (state.uploaded) return 'Pending Verification';
    return 'Not Uploaded';
  }

  getDocumentStatusColor(documentType: 'permis' | 'carteIdentitate'): string {
    const state = this.documentStates[documentType];
    
    if (state.uploading) return 'accent';
    if (state.verified) return 'primary';
    if (state.uploaded) return 'warn';
    return '';
  }

  // View uploaded document
  viewDocument(documentType: 'permis' | 'carteIdentitate') {
    // This would open the document in a new tab or modal
    // Implementation depends on how documents are stored/served
    const username = this.tokenService.getUsername();
    const documentUrl = `https://vrooom1224.s3.eu-central-1.amazonaws.com/${username}_${documentType}.png`;
    window.open(documentUrl, '_blank');
  }

  // Delete document
  deleteDocument(documentType: 'permis' | 'carteIdentitate') {
    if (confirm(`Are you sure you want to delete your ${this.getDocumentDisplayName(documentType)}?`)) {
      // Implement delete functionality
      this.documentStates[documentType].uploaded = false;
      this.documentStates[documentType].verified = false;
      this.showSuccess(`${this.getDocumentDisplayName(documentType)} deleted successfully`);
    }
  }

  get profileFormControls() {
    return this.profileForm.controls;
  }

  get passwordFormControls() {
    return this.passwordForm.controls;
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}