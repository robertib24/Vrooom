import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { BookingService, Booking } from '../../services/booking.service';
import { VehiclesService } from '../../services/vehicles.service';
import { finalize } from 'rxjs/operators';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatDialogModule
  ],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss'
})
export class BookingsComponent implements OnInit {
  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  loading = true;
  error = false;
  cancellingBookingId: number | null = null;

  // Tab counts
  upcomingCount = 0;
  activeCount = 0;
  completedCount = 0;
  
  // Current filter
  currentFilter: 'all' | 'upcoming' | 'active' | 'completed' = 'all';

  constructor(
    private bookingService: BookingService,
    private vehiclesService: VehiclesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserBookings();
  }

  loadUserBookings() {
    this.loading = true;
    this.error = false;

    this.bookingService.getUserBookings()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (bookings) => {
          // Process bookings to add status
          this.bookings = this.bookingService.processBookings(bookings);
          
          // Load vehicle details for each booking
          this.loadVehicleDetails();
          
          // Apply initial filter
          this.filterBookings('all');
          
          // Count bookings by status
          this.updateStatusCounts();
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.error = true;
          this.showError('Failed to load your bookings');
        }
      });
  }

  loadVehicleDetails() {
    this.bookings.forEach((booking, index) => {
      this.vehiclesService.getVehicleById(booking.postareId)
        .subscribe({
          next: (vehicle) => {
            this.bookings[index].vehicle = vehicle;
            this.applyCurrentFilter();
          },
          error: (error) => {
            console.error(`Error loading vehicle details for booking ${booking.chirieId}:`, error);
          }
        });
    });
  }

  filterBookings(filter: 'all' | 'upcoming' | 'active' | 'completed') {
    this.currentFilter = filter;
    this.applyCurrentFilter();
  }

  applyCurrentFilter() {
    if (this.currentFilter === 'all') {
      this.filteredBookings = [...this.bookings];
    } else {
      this.filteredBookings = this.bookings.filter(booking => booking.status === this.currentFilter);
    }
  }

  updateStatusCounts() {
    this.upcomingCount = this.bookings.filter(booking => booking.status === 'upcoming').length;
    this.activeCount = this.bookings.filter(booking => booking.status === 'active').length;
    this.completedCount = this.bookings.filter(booking => booking.status === 'completed').length;
  }

  confirmCancelBooking(booking: Booking) {
    if (booking.status === 'completed') {
      this.showInfo('Cannot cancel completed bookings');
      return;
    }

    const dialogRef = this.dialog.open(CancelBookingDialog, {
      width: '400px',
      data: {
        bookingId: booking.chirieId,
        vehicleName: booking.vehicle ? `${booking.vehicle.firma} ${booking.vehicle.model}` : 'Vehicle',
        startDate: new Date(booking.dataStart).toLocaleDateString(),
        endDate: new Date(booking.dataStop).toLocaleDateString()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.cancelBooking(booking.chirieId);
      }
    });
  }

  cancelBooking(bookingId: number) {
    this.cancellingBookingId = bookingId;

    this.bookingService.cancelBooking(bookingId)
      .pipe(finalize(() => this.cancellingBookingId = null))
      .subscribe({
        next: () => {
          this.showSuccess('Booking cancelled successfully!');
          // Remove cancelled booking from list
          this.bookings = this.bookings.filter(b => b.chirieId !== bookingId);
          this.applyCurrentFilter();
          this.updateStatusCounts();
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.showError('Failed to cancel booking. Please try again.');
        }
      });
  }

  viewVehicleDetails(vehicleId: number) {
    this.router.navigate(['/vehicle', vehicleId]);
  }

  getBookingDuration(booking: Booking): number {
    const startDate = new Date(booking.dataStart);
    const endDate = new Date(booking.dataStop);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getBookingTotal(booking: Booking): number {
    if (!booking.vehicle) return 0;
    const duration = this.getBookingDuration(booking);
    return duration * booking.vehicle.pret;
  }

  getVehicleImageUrl(vehicleId: number): string {
    return this.vehiclesService.getVehicleImageUrl(vehicleId);
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
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

  private showInfo(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000
    });
  }
}

// Dialog component for confirming booking cancellation
@Component({
  selector: 'app-cancel-booking-dialog',
  template: `
    <h2 mat-dialog-title>Cancel Booking</h2>
    <mat-dialog-content>
      <p>Are you sure you want to cancel this booking?</p>
      <div class="booking-info">
        <p><strong>Vehicle:</strong> {{ data.vehicleName }}</p>
        <p><strong>Rental Period:</strong> {{ data.startDate }} to {{ data.endDate }}</p>
      </div>
      <p class="warning-text">
        <mat-icon color="warn">warning</mat-icon>
        Cancellation policy: You may be subject to cancellation fees depending on how close the booking start date is.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Keep Booking</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        <mat-icon>cancel</mat-icon>
        Cancel Booking
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .booking-info {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
    .warning-text {
      color: #f44336;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      font-size: 0.9rem;
    }
  `],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule]
})
export class CancelBookingDialog {
  constructor(
    public dialogRef: MatDialogRef<CancelBookingDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}