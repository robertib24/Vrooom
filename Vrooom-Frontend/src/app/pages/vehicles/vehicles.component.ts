import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';
import { finalize } from 'rxjs';
import { TokenService } from '../../services/token.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  private vehiclesService = inject(VehiclesService);
  private tokenService = inject(TokenService);
  public vehicles: Vehicle[] = [];
  public loading = true;
  public error = false;

  readonly dialog = inject(MatDialog);

  ngOnInit() {
    this.loadVehicles();
  }

  loadVehicles() {
    this.loading = true;
    this.error = false;
    
    this.vehiclesService.getVehicles()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.vehicles = data;
        },
        error: (err) => {
          console.error('Error loading vehicles:', err);
          this.error = true;
        }
      });
  }

  openDialog(vehicle: Vehicle) {
    const dialogRef = this.dialog.open(RentDialogComponent);

    dialogRef.componentInstance.onBookEvent.subscribe((slot: any) => {
      this.bookVehicle(vehicle, slot);
    });
  }

  bookVehicle(vehicle: Vehicle, slot: any) {
    this.vehiclesService.bookVehicle(vehicle.id, slot)
      .subscribe({
        next: () => {
          this.vehiclesService.showBookingSuccess();
        },
        error: (err) => {
          console.error('Error booking vehicle:', err);
        }
      });
  }
}