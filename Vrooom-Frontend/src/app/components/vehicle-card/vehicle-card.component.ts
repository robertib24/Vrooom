import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatRippleModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Vehicle } from '../../models/other.models';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-vehicle-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatRippleModule,
    MatTooltipModule
  ],
  templateUrl: './vehicle-card.component.html',
  styleUrl: './vehicle-card.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('heartBeat', [
      transition('* => *', [
        animate('0.4s ease-in-out', style({ transform: 'scale(1.3)' })),
        animate('0.2s ease-in-out', style({ transform: 'scale(1)' })),
      ]),
    ]),
  ],
})
export class VehicleCardComponent {
  @Input() vehicle: Vehicle;
  @Input() isFavorite: boolean = false;
  @Input() showActions: boolean = true;
  @Input() compact: boolean = false;
  @Output() favoriteToggle = new EventEmitter<Vehicle>();
  @Output() bookNow = new EventEmitter<Vehicle>();
  
  defaultImage = 'assets/images/car-placeholder.jpg';
  heartAnimation = false;
  
  formatLocationName(location: string): string {
    if (!location) return 'Location not specified';
    
    // If it's a full address, truncate it
    if (location.length > 30) {
      const parts = location.split(',');
      if (parts.length > 1) {
        return parts[0].trim();
      }
      return location.substring(0, 30) + '...';
    }
    
    return location;
  }
  
  getVehicleImage(vehicle: Vehicle): string {
    if (!vehicle) return this.defaultImage;
    
    // Construct the image URL based on the vehicle ID
    return `https://vrooom1224.s3.amazonaws.com/post${vehicle.id}/1.jpg`;
  }
  
  toggleFavorite(event: Event): void {
    event.stopPropagation();
    this.heartAnimation = true;
    this.favoriteToggle.emit(this.vehicle);
  }
  
  onBookNow(event: Event): void {
    event.stopPropagation();
    this.bookNow.emit(this.vehicle);
  }
  
  getVehicleAge(): number {
    if (!this.vehicle) return 0;
    const currentYear = new Date().getFullYear();
    return currentYear - this.vehicle.anFabricatie;
  }
}