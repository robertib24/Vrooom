import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { VehiclesService } from '../../services/vehicles.service';

@Component({
  selector: 'app-vehicles',
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent {
  private vehiclesService = inject(VehiclesService);
  public vehicles = this.vehiclesService.getVehicles();
}
