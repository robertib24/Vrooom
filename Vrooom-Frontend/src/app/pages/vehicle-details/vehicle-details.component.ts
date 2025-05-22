// vehicle-details.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { TokenService } from '../../services/token.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-vehicle-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './vehicle-details.component.html',
  styleUrls: ['./vehicle-details.component.scss']
})
export class VehicleDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private vehiclesService = inject(VehiclesService);
  private tokenService = inject(TokenService);
  private googleMapsService = inject(GoogleMapsService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);

  vehicle: Vehicle | null = null;
  loading = true;
  error = false;
  vehicleImages: string[] = [];
  currentImageIndex = 0;
  
  // Map related properties
  staticMapUrl: string | null = null;
  mapEmbedUrl: SafeResourceUrl | null = null;
  rawMapEmbedUrl: string | null = null;

  ngOnInit() {
    const vehicleId = this.route.snapshot.paramMap.get('id');
    if (vehicleId) {
      this.loadVehicleDetails(parseInt(vehicleId));
    } else {
      this.error = true;
      this.loading = false;
    }
  }

  loadVehicleDetails(id: number) {
    this.loading = true;
    this.error = false;

    this.vehiclesService.getVehicleById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (vehicle) => {
          this.vehicle = vehicle;
          this.setupVehicleImages();
          this.setupMapsUrls();
        },
        error: (error) => {
          console.error('Error loading vehicle details:', error);
          this.error = true;
          this.showError('Failed to load vehicle details');
        }
      });
  }

  setupVehicleImages() {
    if (!this.vehicle) return;

    // Generate image URLs based on the vehicle ID
    const imageCount = this.vehicle.nrImagini || 1;
    this.vehicleImages = [];

    for (let i = 1; i <= imageCount; i++) {
      this.vehicleImages.push(this.vehiclesService.getVehicleImageUrl(this.vehicle.id, i));
    }

    // If no images available, use placeholder
    if (this.vehicleImages.length === 0) {
      this.vehicleImages.push('https://via.placeholder.com/600x400?text=No+Image+Available');
    }
  }

  setupMapsUrls() {
    if (!this.vehicle) return;

    try {
      // Setup static map URL
      if (this.vehicle.latitudine && this.vehicle.longitudine) {
        this.staticMapUrl = this.googleMapsService.generateStaticMapUrl(
          this.vehicle.latitudine,
          this.vehicle.longitudine,
          {
            width: 600,
            height: 300,
            zoom: 15,
            mapType: 'roadmap',
            markerColor: 'red',
            markerLabel: 'V'
          }
        );
      }

      // Setup embed map URL with proper sanitization
      const location = this.vehicle.locatie_formala || this.vehicle.locatie;
      if (location) {
        this.rawMapEmbedUrl = this.googleMapsService.generateMapsEmbedUrl(location, 15);
        // Sanitize the URL for security
        this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawMapEmbedUrl);
      }
    } catch (error) {
      console.error('Error setting up maps URLs:', error);
    }
  }

  // Image gallery methods
  nextImage() {
    if (this.vehicleImages.length > 1) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.vehicleImages.length;
    }
  }

  previousImage() {
    if (this.vehicleImages.length > 1) {
      this.currentImageIndex = this.currentImageIndex === 0 
        ? this.vehicleImages.length - 1 
        : this.currentImageIndex - 1;
    }
  }

  goToImage(index: number) {
    if (index >= 0 && index < this.vehicleImages.length) {
      this.currentImageIndex = index;
    }
  }

  // Navigation methods
  goBack() {
    this.router.navigate(['/vehicles']);
  }

  // Booking methods
  canUserBook(): boolean {
    if (!this.vehicle) return false;
    
    const currentUserId = this.tokenService.getUserId();
    return !!(currentUserId && parseInt(currentUserId) !== this.vehicle.userId);
  }

  openBookingDialog() {
    if (!this.vehicle || !this.canUserBook()) return;

    const dialogRef = this.dialog.open(RentDialogComponent, {
      width: '500px',
      data: { vehicle: this.vehicle }
    });

    dialogRef.componentInstance.onBookEvent.subscribe((slot: any) => {
      this.bookVehicle(slot);
    });
  }

  bookVehicle(slot: any) {
    if (!this.vehicle) return;

    this.vehiclesService.bookVehicle(this.vehicle.id, slot)
      .subscribe({
        next: (response) => {
          this.showSuccess('Vehicle booked successfully!');
          
          // Send booking confirmation email
          const booking = {
            userId: parseInt(this.tokenService.getUserId() || '0'),
            postareId: this.vehicle!.id,
            dataStart: slot.start,
            dataStop: slot.end
          };
          
          this.vehiclesService.sendBookingConfirmation(booking).subscribe({
            next: () => {
              console.log('Confirmation email sent');
            },
            error: (error) => {
              console.error('Failed to send confirmation email:', error);
            }
          });
        },
        error: (err) => {
          console.error('Error booking vehicle:', err);
          this.showError('Failed to book vehicle. Please try again.');
        }
      });
  }

  // Map methods
  openGoogleMaps() {
    if (!this.vehicle) return;

    const location = this.vehicle.locatie_formala || this.vehicle.locatie;
    if (location) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
      window.open(url, '_blank');
    }
  }

  openStreetView() {
    if (!this.vehicle || !this.vehicle.latitudine || !this.vehicle.longitudine) return;

    const streetViewUrl = this.googleMapsService.generateStreetViewUrl(
      { latitude: this.vehicle.latitudine, longitude: this.vehicle.longitudine },
      { size: '640x640', fov: 120 }
    );
    
    window.open(streetViewUrl, '_blank');
  }

  debugMapsSetup() {
    console.log('=== Maps Debug Information ===');
    console.log('Vehicle:', this.vehicle);
    console.log('Raw Map Embed URL:', this.rawMapEmbedUrl);
    console.log('Sanitized Map Embed URL:', this.mapEmbedUrl);
    console.log('Static Map URL:', this.staticMapUrl);
    console.log('============================');
    
    this.showSuccess('Check console for debug information');
  }

  // Contact and actions
  contactOwner() {
    this.showSuccess('Contact feature coming soon!');
  }

  shareVehicle() {
    if (!this.vehicle) return;

    if (navigator.share) {
      navigator.share({
        title: `${this.vehicle.firma} ${this.vehicle.model}`,
        text: `Check out this ${this.vehicle.firma} ${this.vehicle.model} for rent!`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showSuccess('Link copied to clipboard!');
      });
    }
  }

  reportVehicle() {
    this.showSuccess('Report feature coming soon!');
  }

  // Error handling methods
  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Available';
  }

  onMapImageError(event: any) {
    console.error('Static map image failed to load:', event);
    event.target.style.display = 'none';
  }

  onMapImageLoad() {
    console.log('Static map image loaded successfully');
  }

  onMapEmbedLoad() {
    console.log('Map embed loaded successfully');
  }

  onMapEmbedError() {
    console.error('Map embed failed to load');
  }

  // Utility methods
  formatPrice(price: number): string {
    return `€${price}/day`;
  }

  formatMileage(mileage: number): string {
    return `${mileage.toLocaleString()} km`;
  }

  trackByIndex(index: number): number {
    return index;
  }

  // Notification methods
  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
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