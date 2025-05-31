import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { TokenService } from '../../services/token.service';
import { finalize, forkJoin } from 'rxjs';

interface VehicleStats {
  totalViews: number;
  totalBookings: number;
  activeBookings: number;
  totalRevenue: number;
}

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './my-vehicles.component.html',
  styleUrls: ['./my-vehicles.component.scss']
})
export class MyVehiclesComponent implements OnInit {
  myVehicles: Vehicle[] = [];
  loading = true;
  error = false;
  deletingVehicleId: number | null = null;

  // Stats
  stats: VehicleStats = {
    totalViews: 0,
    totalBookings: 0,
    activeBookings: 0,
    totalRevenue: 0
  };

  // Bookings for all vehicles
  allBookings: any[] = [];

  constructor(
    private vehiclesService: VehiclesService,
    private tokenService: TokenService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadMyVehicles();
  }

  loadMyVehicles() {
    this.loading = true;
    this.error = false;

    // Load vehicles and stats in parallel
    forkJoin({
      vehicles: this.vehiclesService.getUserVehicles(),
      bookings: this.vehiclesService.getOwnerBookings(),
      views: this.vehiclesService.getAllVehicleViews()
    })
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: (data) => {
        console.log('📊 Loaded data:', data);
        
        this.myVehicles = data.vehicles;
        this.allBookings = data.bookings;
        
        // Calculate stats
        this.calculateStats(data.bookings, data.views);
      },
      error: (error) => {
        console.error('Error loading my vehicles:', error);
        this.error = true;
        
        // Fallback: load just vehicles
        this.vehiclesService.getUserVehicles()
          .pipe(finalize(() => this.loading = false))
          .subscribe({
            next: (vehicles) => {
              this.myVehicles = vehicles;
              console.log('📊 Loaded vehicles (fallback):', vehicles);
            },
            error: (err) => {
              console.error('Error loading vehicles (fallback):', err);
              this.showError('Failed to load your vehicles');
            }
          });
      }
    });
  }

  calculateStats(bookings: any[], vehicleViews: { [vehicleId: number]: number }) {
    console.log('📊 Calculating stats with:', { bookings, vehicleViews });
    
    // Calculate views
    this.stats.totalViews = Object.values(vehicleViews).reduce((sum, views) => sum + views, 0);
    
    // Calculate bookings
    this.stats.totalBookings = bookings.length;
    
    // Calculate active bookings (current or future)
    const now = new Date();
    this.stats.activeBookings = bookings.filter(booking => {
      const endDate = new Date(booking.dataStop);
      return endDate >= now;
    }).length;
    
    // Calculate total revenue
    this.stats.totalRevenue = bookings.reduce((sum, booking) => {
      return sum + (booking.totalAmount || 0);
    }, 0);

    console.log('📊 Calculated stats:', this.stats);
  }

  getVehicleImageUrl(vehicleId: number): string {
    return this.vehiclesService.getVehicleImageUrl(vehicleId);
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
  }

  viewVehicleDetails(vehicle: Vehicle) {
    this.router.navigate(['/vehicle', vehicle.id]);
  }

  editVehicle(vehicle: Vehicle) {
    this.showInfo('Edit functionality coming soon!');
  }

  confirmDelete(vehicle: Vehicle) {
    const dialogRef = this.dialog.open(DeleteConfirmationDialog, {
      width: '400px',
      data: {
        vehicleName: `${vehicle.firma} ${vehicle.model}`,
        vehicleYear: vehicle.anFabricatie
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.deleteVehicle(vehicle.id);
      }
    });
  }

  deleteVehicle(vehicleId: number) {
    this.deletingVehicleId = vehicleId;

    this.vehiclesService.deleteVehicle(vehicleId)
      .pipe(finalize(() => this.deletingVehicleId = null))
      .subscribe({
        next: () => {
          this.showSuccess('Vehicle deleted successfully!');
          this.myVehicles = this.myVehicles.filter(v => v.id !== vehicleId);
          // Recalculate stats
          this.loadMyVehicles();
        },
        error: (error) => {
          console.error('Error deleting vehicle:', error);
          this.showError('Failed to delete vehicle. Please try again.');
        }
      });
  }

  addNewVehicle() {
    this.router.navigate(['/add-vehicle']);
  }

  // Get bookings for a specific vehicle
  getVehicleBookings(vehicleId: number): any[] {
    return this.allBookings.filter(booking => booking.postareId === vehicleId);
  }

  // Get active bookings count for a vehicle
  getActiveBookingsCount(vehicleId: number): number {
    const now = new Date();
    return this.getVehicleBookings(vehicleId).filter(booking => {
      const endDate = new Date(booking.dataStop);
      return endDate >= now;
    }).length;
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
      duration: 3000,
      panelClass: ['info-snackbar']
    });
  }
}

@Component({
  selector: 'app-delete-confirmation-dialog',
  template: `
    <h2 mat-dialog-title>Delete Vehicle</h2>
    <mat-dialog-content>
      <p>Are you sure you want to delete this vehicle?</p>
      <div class="vehicle-info">
        <strong>{{ data.vehicleName }} ({{ data.vehicleYear }})</strong>
      </div>
      <p class="warning-text">
        <mat-icon color="warn">warning</mat-icon>
        This action cannot be undone. All bookings and reviews for this vehicle will also be affected.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="warn" (click)="onConfirm()">
        <mat-icon>delete</mat-icon>
        Delete
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .vehicle-info {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
      text-align: center;
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
export class DeleteConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<DeleteConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}