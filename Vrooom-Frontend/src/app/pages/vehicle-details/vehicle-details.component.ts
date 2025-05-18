import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MapComponent } from '../../components/map/map.component';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';
import { VehicleService } from '../../services/vehicle.service';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { Vehicle } from '../../models/other.models';
import { SafeUser } from '../../models/user.models';
import { animate, style, transition, trigger } from '@angular/animations';
import { forkJoin, of, switchMap, catchError } from 'rxjs';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MapComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './vehicle-details.component.html',
  styleUrl: './vehicle-details.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-30px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class VehicleDetailsComponent implements OnInit {
  @ViewChild('galleryMain') galleryMain: ElementRef;
  @ViewChild('galleryThumbs') galleryThumbs: ElementRef;
  
  vehicle: Vehicle;
  owner: SafeUser;
  loading = true;
  isFavorite = false;
  reviewForm: FormGroup;
  userRole: string;
  userId: number;
  userCanReview = false;
  currentImageIndex = 0;
  showImagePopup = false;
  reviews = [];
  relatedVehicles = [];
  similarVehicleIds: number[];
  
  isOwner = false;
  selectedTab = 0;
  
  private vehicleService = inject(VehicleService);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private formBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  
  ngOnInit(): void {
    this.initReviewForm();
    this.userRole = this.tokenService.getRole();
    this.userId = Number(this.tokenService.getUserId());
    
    // Get vehicle ID from route parameters
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = Number(params.get('id'));
        if (!id) {
          return of(null);
        }
        
        return forkJoin({
          vehicle: this.vehicleService.getVehicleById(id).pipe(
            catchError(() => {
              this.router.navigate(['/vehicles']);
              return of(null);
            })
          ),
          // We'll load related vehicles and reviews after getting the vehicle data
        });
      })
    ).subscribe(result => {
      if (!result || !result.vehicle) {
        this.loading = false;
        return;
      }
      
      this.vehicle = result.vehicle;
      this.isFavorite = this.vehicleService.isFavorite(this.vehicle.id);
      this.isOwner = this.vehicle.userId === this.userId;
      
      // Load owner info and related vehicles
      this.loadAdditionalData();
    });
  }
  
  private initReviewForm(): void {
    this.reviewForm = this.formBuilder.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      title: ['', [Validators.required, Validators.maxLength(100)]],
      comment: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }
  
  private loadAdditionalData(): void {
    forkJoin({
      owner: this.userService.getUserById(this.vehicle.userId).pipe(
        catchError(() => of(null))
      ),
      // Mock reviews for now
      reviews: of(this.getMockReviews()),
      // Get similar vehicles
      relatedVehicles: this.vehicleService.searchVehicles({
        make: this.vehicle.firma,
        model: this.vehicle.model
      }).pipe(
        catchError(() => of([]))
      )
    }).subscribe(result => {
      this.owner = result.owner;
      this.reviews = result.reviews;
      
      // Filter out the current vehicle and limit to 4 related vehicles
      this.relatedVehicles = result.relatedVehicles
        .filter(v => v.id !== this.vehicle.id)
        .slice(0, 4);
      
      // Generate random similar vehicle IDs for demo
      this.similarVehicleIds = this.getSimilarVehicleIds();
      
      // Check if user can review this vehicle
      this.userCanReview = this.canUserReview();
      
      this.loading = false;
    });
  }
  
  toggleFavorite(): void {
    this.vehicleService.toggleFavorite(this.vehicle.id);
    this.isFavorite = !this.isFavorite;
  }
  
  openBookingDialog(): void {
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    const dialogRef = this.dialog.open(RentDialogComponent);
    
    dialogRef.componentInstance.onBookEvent.subscribe((slot: any) => {
      this.bookVehicle(slot);
    });
  }
  
  bookVehicle(slot: any): void {
    this.vehicleService.bookVehicle(this.vehicle.id, this.userId, slot)
      .subscribe({
        next: () => {
          // Send booking confirmation email
          const bookingData = {
            userId: this.userId,
            postareId: this.vehicle.id,
            dataStart: slot.start,
            dataStop: slot.end
          };
          
          this.vehicleService.sendBookingConfirmation(bookingData)
            .subscribe({
              next: () => {
                this.vehicleService.showBookingSuccess();
              },
              error: (error) => {
                console.error('Error sending booking confirmation:', error);
                // Still show success message even if email fails
                this.vehicleService.showBookingSuccess();
              }
            });
        },
        error: (error) => {
          console.error('Error booking vehicle:', error);
          // Show error message
          this.snackBar.open('Error booking vehicle. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
  
  submitReview(): void {
    if (this.reviewForm.invalid) {
      return;
    }
    
    const review = {
      ...this.reviewForm.value,
      dataReview: new Date()
    };
    
    this.vehicleService.addReview(review, this.vehicle.id, this.userId)
      .subscribe({
        next: () => {
          this.snackBar.open('Review submitted successfully!', 'Close', {
            duration: 3000
          });
          
          // Add the new review to the list
          this.reviews.unshift({
            user: {
              name: this.tokenService.getFullName() || 'You',
              avatar: 'assets/images/default-profile.jpg'
            },
            rating: review.rating,
            title: review.title,
            comment: review.comment,
            date: new Date()
          });
          
          // Reset form
          this.reviewForm.reset({
            rating: 5
          });
          
          // Update canReview flag
          this.userCanReview = false;
        },
        error: (error) => {
          console.error('Error submitting review:', error);
          this.snackBar.open('Error submitting review. Please try again.', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }
  
  getVehicleImages(): string[] {
    // Create an array of image URLs for the vehicle
    const images = [];
    for (let i = 1; i <= (this.vehicle?.nrImagini || 1); i++) {
      images.push(`https://vrooom1224.s3.amazonaws.com/post${this.vehicle.id}/${i}.jpg`);
    }
    
    // Add a placeholder if no images are available
    if (images.length === 0) {
      images.push('assets/images/car-placeholder.jpg');
    }
    
    return images;
  }
  
  changeImage(index: number): void {
    this.currentImageIndex = index;
  }
  
  openImagePopup(): void {
    this.showImagePopup = true;
  }
  
  closeImagePopup(): void {
    this.showImagePopup = false;
  }
  
  nextImage(): void {
    const images = this.getVehicleImages();
    this.currentImageIndex = (this.currentImageIndex + 1) % images.length;
  }
  
  prevImage(): void {
    const images = this.getVehicleImages();
    this.currentImageIndex = (this.currentImageIndex - 1 + images.length) % images.length;
  }
  
  viewOwnerProfile(): void {
    this.router.navigate(['/users', this.vehicle.userId]);
  }
  
  viewRelatedVehicle(vehicleId: number): void {
    this.router.navigate(['/vehicles', vehicleId]);
  }
  
  // Helper method to check if user can review this vehicle
  private canUserReview(): boolean {
    if (!this.userId || this.isOwner) {
      return false;
    }
    
    // Check if user has already reviewed this vehicle
    const hasReviewed = this.reviews.some(review => review.userId === this.userId);
    
    return !hasReviewed;
  }
  
  // Generate mock reviews for demo
  private getMockReviews(): any[] {
    return [
      {
        userId: 101,
        user: {
          name: 'John Smith',
          avatar: 'assets/images/avatar-1.jpg'
        },
        rating: 5,
        title: 'Great vehicle, perfect condition!',
        comment: 'I rented this car for a weekend trip and it was absolutely perfect. The vehicle was in pristine condition, very well maintained and super clean. The owner was very helpful and provided all the necessary information. Would definitely rent again!',
        date: new Date(2024, 3, 15)
      },
      {
        userId: 102,
        user: {
          name: 'Maria Garcia',
          avatar: 'assets/images/avatar-2.jpg'
        },
        rating: 4,
        title: 'Very good experience',
        comment: 'The car was great and performed well during my trip. The pickup and return process was smooth. Would recommend!',
        date: new Date(2024, 2, 28)
      },
      {
        userId: 103,
        user: {
          name: 'David Chen',
          avatar: 'assets/images/avatar-3.jpg'
        },
        rating: 5,
        title: 'Excellent service and car',
        comment: 'This was my first time using this platform and I was very impressed. The car was exactly as described and the owner was very professional. The car drove smoothly and was very fuel-efficient.',
        date: new Date(2024, 2, 10)
      }
    ];
  }
  
  // Generate random similar vehicle IDs for the mock data
  private getSimilarVehicleIds(): number[] {
    // In a real application, you would get this from the backend
    const ids = [];
    const baseId = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < 4; i++) {
      ids.push(baseId + i);
    }
    
    return ids;
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