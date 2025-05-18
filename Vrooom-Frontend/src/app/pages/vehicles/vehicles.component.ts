import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VehiclesService } from '../../services/vehicles.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatDialogModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent {
  private vehiclesService = inject(VehiclesService);
  public vehicles = this.vehiclesService.getVehicles();

  readonly dialog = inject(MatDialog);

  openDialog(vehicle: any) {
    const dialogRef = this.dialog.open(RentDialogComponent);

    dialogRef.componentInstance.onBookEvent.subscribe((slot: any) => {
      this.vehiclesService.bookVehicle(vehicle, slot);
    });
  }
}
