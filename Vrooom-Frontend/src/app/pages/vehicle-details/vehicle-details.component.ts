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
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { TokenService } from '../../services/token.service';
import { GoogleMapsService } from '../../services/google-maps.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';
import { ContactOwnerDialogComponent } from '../../components/contact-owner-dialog/contact-owner-dialog.component';
import { finalize, forkJoin, of, Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

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
    MatDialogModule,
    MatChipsModule,
    MatBadgeModule
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
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);

  vehicle: Vehicle | null = null;
  owner: any = null;
  loading = true;
  loadingOwner = false;
  error = false;
  vehicleImages: string[] = [];
  currentImageIndex = 0;
  views = 0;
  
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

    const vehicleRequest = this.vehiclesService.getVehicleById(id);
    const viewsRequest = this.vehiclesService.getVehicleViews(id);

    forkJoin({
      vehicle: vehicleRequest,
      views: viewsRequest
    }).pipe(
      switchMap(({ vehicle, views }) => {
        this.vehicle = vehicle;
        this.views = views;
        this.setupVehicleImages();
        this.setupMapsUrls();

        this.loadingOwner = true;
        return this.loadOwnerDetailsByUserId(vehicle.userId);
      }),
      finalize(() => {
        this.loading = false;
        this.loadingOwner = false;
      })
    ).subscribe({
      next: (ownerData) => {
        this.owner = ownerData;
        console.log('✅ Owner data loaded:', this.owner);
      },
      error: (error) => {
        console.error('Error loading vehicle/owner details:', error);
        this.error = true;
        this.showError('Failed to load vehicle details');
      }
    });
  }

  private loadOwnerDetailsByUserId(userId: number): Observable<any> {
    this.loadingOwner = true;
    
    return this.apiService.get(`User/getById?id=${userId}`).pipe(
      catchError(error => {
        console.warn('Could not load owner details:', error);
        return of({
          id: userId,
          nume: 'Owner',
          prenume: 'Vehicle',
          username: `user_${userId}`,
          email: 'contact@vrooom.com',
          nrTelefon: 'Contact via platform',
          linkPozaProfil: this.vehiclesService.getPlaceholderImageUrl(),
          puncteFidelitate: 0,
          nrPostari: 1
        });
      }),
      finalize(() => this.loadingOwner = false)
    );
  }

  private apiService = inject(ApiService);

  setupVehicleImages() {
    if (!this.vehicle) return;

    const imageCount = this.vehicle.nrImagini || 1;
    this.vehicleImages = [];

    for (let i = 1; i <= imageCount; i++) {
      this.vehicleImages.push(this.vehiclesService.getVehicleImageUrl(this.vehicle.id, i));
    }

    if (this.vehicleImages.length === 0) {
      this.vehicleImages.push(this.vehiclesService.getPlaceholderImageUrl());
    }
  }

  setupMapsUrls() {
    if (!this.vehicle) return;

    try {
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

      const location = this.vehicle.locatie_formala || this.vehicle.locatie;
      if (location) {
        this.rawMapEmbedUrl = this.googleMapsService.generateMapsEmbedUrl(location, 15);
        this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawMapEmbedUrl);
      }
    } catch (error) {
      console.error('Error setting up maps URLs:', error);
    }
  }

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

  goBack() {
    this.router.navigate(['/vehicles']);
  }

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
          
          const booking = {
            userId: parseInt(this.tokenService.getUserId() || '0'),
            postareId: this.vehicle!.id,
            dataStart: slot.start,
            dataStop: slot.end
          };
          
          this.vehiclesService.sendBookingConfirmation(booking).subscribe({
            next: () => console.log('Confirmation email sent'),
            error: (error) => console.error('Failed to send confirmation email:', error)
          });
        },
        error: (err) => {
          console.error('Error booking vehicle:', err);
          this.showError('Failed to book vehicle. Please try again.');
        }
      });
  }

  contactOwner() {
    if (!this.vehicle || !this.owner) {
      this.showError('Owner information not available');
      return;
    }

    const dialogRef = this.dialog.open(ContactOwnerDialogComponent, {
      width: '600px',
      data: { 
        vehicle: this.vehicle,
        owner: this.owner
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'sent') {
        this.showSuccess('Message sent to owner successfully!');
      }
    });
  }

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
    
    if (streetViewUrl) {
      window.open(streetViewUrl, '_blank');
    }
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
      navigator.clipboard.writeText(window.location.href).then(() => {
        this.showSuccess('Link copied to clipboard!');
      });
    }
  }

  reportVehicle() {
    this.showSuccess('Report feature coming soon!');
  }

  getOwnerInitials(): string {
    if (!this.owner) return '?';
    const firstName = this.owner.prenume || '';
    const lastName = this.owner.nume || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getOwnerFullName(): string {
    if (!this.owner) return 'Vehicle Owner';
    return `${this.owner.prenume || ''} ${this.owner.nume || ''}`.trim() || this.owner.username || 'Vehicle Owner';
  }

  getOwnerRating(): number {
    if (!this.owner) return 0;
    const baseRating = 3.5;
    const bonusRating = Math.min((this.owner.puncteFidelitate || 0) / 100, 1.5);
    return Math.round((baseRating + bonusRating) * 10) / 10;
  }

  getOwnerImageUrl(): string {
    return this.owner?.linkPozaProfil || this.vehiclesService.getPlaceholderImageUrl();
  }

  formatOwnerPhone(): string {
    if (!this.owner?.nrTelefon) return 'Contact via platform';
    
    const phone = this.owner.nrTelefon;
    if (phone.startsWith('07') && phone.length === 10) {
      return `+40 ${phone.substring(1, 4)} ${phone.substring(4, 7)} ${phone.substring(7)}`;
    }
    return phone;
  }

  onImageError(event: any) {
    event.target.src = this.vehiclesService.getPlaceholderImageUrl();
  }

  onOwnerImageError(event: any) {
    event.target.src = this.vehiclesService.getPlaceholderImageUrl();
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

  formatPrice(price: number): string {
    return `€${price}/day`;
  }

  formatMileage(mileage: number): string {
    return `${mileage.toLocaleString()} km`;
  }

  formatViews(views: number): string {
    if (views < 1000) return views.toString();
    if (views < 1000000) return `${(views / 1000).toFixed(1)}k`;
    return `${(views / 1000000).toFixed(1)}M`;
  }

  trackByIndex(index: number): number {
    return index;
  }

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

  getVehicleFeatures(): Array<{icon: string, label: string, value: string}> {
    if (!this.vehicle) return [];

    return [
      { icon: 'palette', label: 'Color', value: this.vehicle.culoare || 'Not specified' },
      { icon: 'speed', label: 'Mileage', value: this.formatMileage(this.vehicle.kilometraj) },
      { icon: 'calendar_today', label: 'Year', value: this.vehicle.anFabricatie?.toString() || 'Not specified' },
      { icon: 'location_on', label: 'Location', value: this.vehicle.locatie || 'Not specified' },
      { icon: 'visibility', label: 'Views', value: this.formatViews(this.views) },
      { icon: 'verified_user', label: 'Insurance', value: 'Included' }
    ];
  }

  getWeeklyPrice(): number {
    return this.vehicle ? Math.round(this.vehicle.pret * 0.9) : 0;
  }

  getMonthlyPrice(): number {
    return this.vehicle ? Math.round(this.vehicle.pret * 0.8) : 0;
  }
}