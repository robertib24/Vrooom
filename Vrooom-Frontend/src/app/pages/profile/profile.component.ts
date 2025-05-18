import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { validatorEmail, validatorPoza } from '../../validator/user.validator';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { VehicleService } from '../../services/vehicle.service';
import { User } from '../../models/user.models';
import { Vehicle } from '../../models/other.models';
import { animate, style, transition, trigger } from '@angular/animations';
import { VehicleCardComponent } from '../../components/vehicle-card/vehicle-card.component';
import { Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule,
    VehicleCardComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class ProfileComponent implements OnInit {
  user: User;
  loading = true;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userVehicles: Vehicle[] = [];
  userBookings = [];
  selectedTab = 0;
  
  // Upload states
  profileImageFile: File | null = null;
  idCardFile: File | null = null;
  drivingLicenseFile: File | null = null;
  uploadingProfile = false;
  uploadingIdCard = false;
  uploadingLicense = false;
  
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private vehicleService = inject(VehicleService);
  private formBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  
  ngOnInit(): void {
    this.initForms();
    this.loadUserData();
  }
  
  private initForms(): void {
    this.profileForm = this.formBuilder.group({
      username: [{ value: '', disabled: true }],
      email: ['', [Validators.required, validatorEmail]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      phone: ['', [Validators.pattern(/^\d{10}$/)]],
      birthDate: [null, [Validators.required]]
    });
    
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.checkPasswords });
  }
  
  private checkPasswords(group: FormGroup): { [key: string]: boolean } | null {
    const pass = group.get('newPassword').value;
    const confirmPass = group.get('confirmPassword').value;
    return pass === confirmPass ? null : { notMatching: true };
  }
  
  private loadUserData(): void {
    const username = this.tokenService.getUsername();
    const userId = Number(this.tokenService.getUserId());
    
    if (!username || !userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    forkJoin({
      userDetails: this.userService.getUserDetails(username).pipe(
        catchError(() => of(null))
      ),
      userVehicles: this.vehicleService.getVehiclesByUserId(userId).pipe(
        catchError(() => of([]))
      )
    }).subscribe(result => {
      if (result.userDetails) {
        this.user = result.userDetails;
        this.userVehicles = result.userVehicles;
        
        // Populate form with user data
        this.profileForm.patchValue({
          username: this.user.username,
          email: this.user.email,
          firstName: this.user.prenume,
          lastName: this.user.nume,
          phone: this.user.nrTelefon,
          birthDate: new Date(this.user.dataNasterii)
        });
        
        // Fetch bookings (mock for now)
        this.userBookings = this.getMockBookings();
      }
      
      this.loading = false;
    });
  }
  
  onProfileImageSelected(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.profileImageFile = event.target.files[0];
    }
  }
  
  onIdCardSelected(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.idCardFile = event.target.files[0];
    }
  }
  
  onLicenseSelected(event: any): void {
    if (event.target.files && event.target.files.length) {
      this.drivingLicenseFile = event.target.files[0];
    }
  }
  
  uploadProfileImage(): void {
    if (!this.profileImageFile) return;
    
    this.uploadingProfile = true;
    
    this.userService.uploadProfilePicture(this.user.username, this.profileImageFile)
      .subscribe({
        next: (success) => {
          this.uploadingProfile = false;
          
          if (success) {
            this.snackBar.open('Profile picture updated successfully!', 'Close', {
              duration: 3000
            });
            
            // Reload user data to get new image URL
            this.loadUserData();
          } else {
            this.snackBar.open('Error uploading profile picture. Please try again.', 'Close', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          this.uploadingProfile = false;
          this.snackBar.open('Error uploading profile picture. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
  
  uploadIdCard(): void {
    if (!this.idCardFile) return;
    
    this.uploadingIdCard = true;
    
    this.userService.uploadDocument(this.user.username, 'carteIdentitate', this.idCardFile)
      .subscribe({
        next: () => {
          this.uploadingIdCard = false;
          this.snackBar.open('ID Card uploaded successfully!', 'Close', {
            duration: 3000
          });
          
          // Reload user data to update verification status
          this.loadUserData();
        },
        error: (error) => {
          console.error('Error uploading ID Card:', error);
          this.uploadingIdCard = false;
          this.snackBar.open('Error uploading ID Card. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
  
  uploadDrivingLicense(): void {
    if (!this.drivingLicenseFile) return;
    
    this.uploadingLicense = true;
    
    this.userService.uploadDocument(this.user.username, 'permis', this.drivingLicenseFile)
      .subscribe({
        next: () => {
          this.uploadingLicense = false;
          this.snackBar.open('Driving License uploaded successfully!', 'Close', {
            duration: 3000
          });
          
          // Reload user data to update verification status
          this.loadUserData();
        },
        error: (error) => {
          console.error('Error uploading Driving License:', error);
          this.uploadingLicense = false;
          this.snackBar.open('Error uploading Driving License. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
  
  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }
    
    const formValue = this.profileForm.value;
    
    // In a real application, you would call an API endpoint to update the user profile
    this.snackBar.open('Profile updated successfully!', 'Close', {
      duration: 3000
    });
  }
  
  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    
    const formValue = this.passwordForm.value;
    
    this.userService.changePassword(
      this.user.username,
      formValue.currentPassword,
      formValue.newPassword
    ).subscribe({
      next: () => {
        this.snackBar.open('Password changed successfully!', 'Close', {
          duration: 3000
        });
        
        // Reset form
        this.passwordForm.reset();
      },
      error: (error) => {
        console.error('Error changing password:', error);
        this.snackBar.open('Error changing password. Please check your current password.', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  navigateToVehicle(vehicleId: number): void {
    this.router.navigate(['/vehicles', vehicleId]);
  }
  
  addVehicle(): void {
    this.router.navigate(['/add-vehicle']);
  }
  
  // Mock bookings data for demo
  private getMockBookings(): any[] {
    return [
      {
        id: 1,
        vehicle: {
          id: 2,
          make: 'Mercedes-Benz',
          model: 'S-Class',
          year: 2023,
          image: 'https://vrooom1224.s3.amazonaws.com/post2/1.jpg'
        },
        startDate: new Date(2024, 4, 25),
        endDate: new Date(2024, 4, 28),
        totalPrice: 450,
        status: 'Upcoming'
      },
      {
        id: 2,
        vehicle: {
          id: 5,
          make: 'Tesla',
          model: 'Model 3',
          year: 2022,
          image: 'https://vrooom1224.s3.amazonaws.com/post5/1.jpg'
        },
        startDate: new Date(2024, 3, 10),
        endDate: new Date(2024, 3, 15),
        totalPrice: 500,
        status: 'Completed'
      },
      {
        id: 3,
        vehicle: {
          id: 1,
          make: 'Dacia',
          model: 'Logan',
          year: 2022,
          image: 'https://vrooom1224.s3.amazonaws.com/post1/1.jpg'
        },
        startDate: new Date(2024, 2, 5),
        endDate: new Date(2024, 2, 8),
        totalPrice: 90,
        status: 'Completed'
      }
    ];
  }
  
  // Format date for display
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}