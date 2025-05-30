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

interface DocumentState {
  uploaded: boolean;
  uploading: boolean;
  verified: boolean;
  url: string;
  uploadDate: Date | null;
}

interface DocumentStates {
  permis: DocumentState;
  carteIdentitate: DocumentState;
}

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

  documentStates: DocumentStates = {
    permis: {
      uploaded: false,
      uploading: false,
      verified: false,
      url: '',
      uploadDate: null  // Inițializat cu null
    },
    carteIdentitate: {
      uploaded: false,
      uploading: false,
      verified: false,
      url: '',
      uploadDate: null  // Inițializat cu null
    }
  };

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
    this.loading = false;
    return;
  }

  console.log('🔄 Loading profile for user:', username);

  // Încearcă mai întâi getUserDetails pentru informații complete
  this.authService.getUserDetails(username)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (details) => {
        console.log('✅ User details loaded successfully:', details);
        this.userProfile = {
          ...details,
          // Asigură-te că toate câmpurile necesare sunt prezente
          email: details.email || details.Email || '',
          linkPozaProfil: details.linkPozaProfil || details.pozaProfil || '',
          nrTelefon: details.nrTelefon || details.phoneNumber || '',
          puncteFidelitate: details.puncteFidelitate || 0,
          nrPostari: details.nrPostari || 0
        };
        
        this.populateForm();
        this.updateDocumentStates();
        
        console.log('📊 Final profile data:', this.userProfile);
      },
      error: (error) => {
        console.warn('⚠️ getUserDetails failed, trying getUserProfile:', error);
        
        // Fallback la getUserProfile
        this.authService.getUserProfile(username).subscribe({
          next: (profile) => {
            console.log('✅ Basic profile loaded:', profile);
            this.userProfile = {
              ...profile,
              email: profile.email || profile.Email || '',
              linkPozaProfil: profile.linkPozaProfil || profile.pozaProfil || '',
              nrTelefon: profile.nrTelefon || profile.phoneNumber || '',
              // Câmpuri care s-ar putea să lipsească din basic profile
              permis: false,
              carteIdentitate: false,
              puncteFidelitate: profile.puncteFidelitate || 0,
              nrPostari: profile.nrPostari || 0
            };
            
            this.populateForm();
            this.updateDocumentStates();
            
            console.log('📊 Final fallback profile data:', this.userProfile);
          },
          error: (profileError) => {
            console.error('❌ Both profile loading methods failed:', profileError);
            this.showError('Failed to load profile. Please refresh the page.');
          }
        });
      }
    });
}

loadDocumentStatus() {
  const username = this.tokenService.getUsername();
  if (!username) return;

  // Load document status from backend
  this.apiService.get(`User/getDocumentStatus/${username}`)
    .subscribe({
      next: (status: any) => {
        console.log('📄 Document status loaded:', status);
        this.documentStates.permis = {
          ...this.documentStates.permis,
          uploaded: status.permis?.uploaded || false,
          verified: status.permis?.verified || false,
          url: status.permis?.url || ''
        };
        this.documentStates.carteIdentitate = {
          ...this.documentStates.carteIdentitate,
          uploaded: status.carteIdentitate?.uploaded || false,
          verified: status.carteIdentitate?.verified || false,
          url: status.carteIdentitate?.url || ''
        };
      },
      error: (error) => {
        console.warn('⚠️ Could not load document status:', error);
        // Fallback to profile data
        this.updateDocumentStates();
      }
    });
}

  populateForm() {
  if (!this.userProfile) {
    console.warn('⚠️ No profile data to populate form');
    return;
  }

  // Format date for HTML date input
  let formattedDate = '';
  if (this.userProfile.dataNasterii) {
    try {
      const date = new Date(this.userProfile.dataNasterii);
      if (!isNaN(date.getTime())) {
        formattedDate = date.toISOString().split('T')[0];
      }
    } catch (error) {
      console.warn('⚠️ Error formatting birth date:', error);
    }
  }
  const formData = {
    nume: this.userProfile.nume || this.userProfile.lastName || '',
    prenume: this.userProfile.prenume || this.userProfile.firstName || '',
    email: this.userProfile.email || this.userProfile.Email || '',
    nrTelefon: this.userProfile.nrTelefon || this.userProfile.phoneNumber || this.userProfile.PhoneNumber || '',
    dataNasterii: formattedDate
  };

  console.log('📝 Populating form with data:', formData);
  
  this.profileForm.patchValue(formData);
  
  if (!formData.email) {
    console.warn('⚠️ Email field is empty after form population');
    console.log('🔍 Available profile properties:', Object.keys(this.userProfile));
  }
}

  updateDocumentStates() {
  if (this.userProfile) {
    this.documentStates.permis = {
      ...this.documentStates.permis,
      uploaded: this.userProfile.permis || false,
      verified: this.userProfile.permis || false
    };
    
    this.documentStates.carteIdentitate = {
      ...this.documentStates.carteIdentitate,
      uploaded: this.userProfile.carteIdentitate || false,
      verified: this.userProfile.carteIdentitate || false
    };
    
    console.log('📄 Document states updated:', this.documentStates);
  }
}

  updateProfile() {
  if (this.profileForm.invalid) {
    this.profileForm.markAllAsTouched();
    this.showError('Please fix the form errors before submitting');
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

  // Clean the form data - remove empty values
  const updateData: any = {};
  
  if (formData.nume && formData.nume.trim()) {
    updateData.nume = formData.nume.trim();
  }
  
  if (formData.prenume && formData.prenume.trim()) {
    updateData.prenume = formData.prenume.trim();
  }
  
  if (formData.nrTelefon && formData.nrTelefon.trim()) {
    updateData.nrTelefon = formData.nrTelefon.trim();
  }
  
  if (formData.dataNasterii) {
    updateData.dataNasterii = formData.dataNasterii;
  }

  console.log('🔄 Updating profile with data:', updateData);

  this.apiService.put(`User/updateProfile/${username}`, updateData)
    .pipe(finalize(() => this.updating = false))
    .subscribe({
      next: (response: any) => {
        console.log('✅ Profile update response:', response);
        this.showSuccess('Profile updated successfully!');
        
        // Update local profile data with response if available
        if (response.user) {
          this.userProfile = { ...this.userProfile, ...response.user };
        } else {
          // Reload profile to get updated data
          this.loadUserProfile();
        }
      },
      error: (error) => {
        console.error('❌ Error updating profile:', error);
        
        let errorMessage = 'Failed to update profile';
        
        if (error.error?.errors) {
          // Handle validation errors
          const errorKeys = Object.keys(error.error.errors);
          const errorMessages = errorKeys.map(key => 
            `${key}: ${error.error.errors[key].join(', ')}`
          ).join('; ');
          errorMessage = `Validation errors: ${errorMessages}`;
        } else if (error.error?.error) {
          errorMessage = error.error.error;
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showError(errorMessage);
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

  onProfilePictureSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const validation = this.documentService.validateFile(file, 'image');
    if (!validation.valid) {
      this.showError(validation.error || 'Invalid image file');
      return;
    }

    this.profilePictureFile = file;

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

    const formData = new FormData();
    formData.append('profilePicture', this.profilePictureFile);

    this.apiService.postFormData(`User/updateProfilePicture/${username}`, formData)
      .pipe(finalize(() => this.uploadingProfilePicture = false))
      .subscribe({
        next: (response) => {
          this.showSuccess('Profile picture updated successfully!');
          this.loadUserProfile();
          this.profilePictureFile = null;
          this.profilePicturePreview = null;
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.showError('Failed to upload profile picture');
        }
      });
  }

  uploadDocument(documentType: 'permis' | 'carteIdentitate', event: any) {
  const file = event.target.files[0];
  if (!file) return;

  const username = this.tokenService.getUsername();
  if (!username) {
    this.showError('User not authenticated');
    return;
  }

  console.log(`📁 Uploading ${documentType} for user:`, username);

  // Validare fișier
  const validation = this.documentService.validateFile(file, 'document');
  if (!validation.valid) {
    this.showError(validation.error || 'Invalid document file');
    return;
  }

  // Upload document
  this.documentService.uploadUserDocument(documentType, file)
    .subscribe({
      next: (response) => {
        console.log(`✅ ${documentType} uploaded successfully:`, response);
        this.showSuccess(`${this.getDocumentDisplayName(documentType)} uploaded successfully!`);
        
        // Actualizează starea locală
        this.documentStates[documentType].uploaded = true;
        this.documentStates[documentType].verified = false;
        
        // Reîncarcă profilul pentru date actualizate
        this.loadUserProfile();
      },
      error: (error) => {
        console.error(`❌ Error uploading ${documentType}:`, error);
        this.showError(`Failed to upload ${this.getDocumentDisplayName(documentType)}`);
      }
    });

  event.target.value = '';
}

  getDocumentDisplayName(documentType: string): string {
  const names: { [key: string]: string } = {
    'permis': "Driver's License",
    'carteIdentitate': 'ID Card'
  };
  return names[documentType] || 'Document';
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

  viewDocument(documentType: 'permis' | 'carteIdentitate') {
  const username = this.tokenService.getUsername();
  if (!username) {
    this.showError('User not authenticated');
    return;
  }

  const documentUrl = `https://vrooom1224.s3.eu-central-1.amazonaws.com/${username}_${documentType}.png`;
  console.log(`👁️ Opening document: ${documentUrl}`);
  window.open(documentUrl, '_blank');
}

  deleteDocument(documentType: 'permis' | 'carteIdentitate') {
    if (confirm(`Are you sure you want to delete your ${this.getDocumentDisplayName(documentType)}?`)) {
      this.documentStates[documentType].uploaded = false;
      this.documentStates[documentType].verified = false;
      this.documentStates[documentType].uploadDate = null;
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