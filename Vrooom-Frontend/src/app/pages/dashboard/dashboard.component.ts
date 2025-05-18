import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';
import { UserService } from '../../services/user.service';
import { TokenService } from '../../services/token.service';
import { Vehicle } from '../../models/other.models';
import { SafeUser } from '../../models/user.models';
import { animate, style, transition, trigger } from '@angular/animations';
import { ChartComponent } from '../../components/chart/chart.component';
import { MapComponent } from '../../components/map/map.component';
import { VehicleCardComponent } from '../../components/vehicle-card/vehicle-card.component';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    ChartComponent,
    MapComponent,
    VehicleCardComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('staggerIn', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class DashboardComponent implements OnInit {
  loading = true;
  userProfile: SafeUser;
  recentVehicles: Vehicle[] = [];
  favoriteVehicles: Vehicle[] = [];
  userRole: string;
  userId: number;
  vehicleCount = 0;
  bookingsCount = 0;
  reviewsCount = 0;
  favoriteCount = 0;
  
  // Chart data
  vehiclesByMakeData = [];
  vehiclesByYearData = [];
  
  // For proprietar role
  myVehicles: Vehicle[] = [];
  myListingsStats = {
    totalViews: 0,
    totalBookings: 0,
    totalRevenue: 0,
    avgRating: 0
  };
  
  private vehicleService = inject(VehicleService);
  private userService = inject(UserService);
  private tokenService = inject(TokenService);
  private router = inject(Router);
  
  ngOnInit(): void {
    this.userRole = this.tokenService.getRole();
    const username = this.tokenService.getUsername();
    this.userId = Number(this.tokenService.getUserId());
    
    if (!username || !this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Load data based on user role
    this.loadDashboardData(username);
  }
  
  private loadDashboardData(username: string): void {
    forkJoin({
      profile: this.userService.getUserProfile(username).pipe(catchError(() => of(null))),
      recentVehicles: this.vehicleService.getVehicles().pipe(catchError(() => of([]))),
      favoriteVehicles: this.vehicleService.getFavoriteVehicles().pipe(catchError(() => of([])))
    }).subscribe(result => {
      this.userProfile = result.profile;
      this.recentVehicles = result.recentVehicles.slice(0, 6);
      this.favoriteVehicles = result.favoriteVehicles;
      this.favoriteCount = this.favoriteVehicles.length;
      
      // Process chart data
      this.processChartData(result.recentVehicles);
      
      // Load role-specific data
      if (this.userRole === 'Proprietar') {
        this.loadProprietarData();
      }
      
      this.loading = false;
    });
  }
  
  private loadProprietarData(): void {
    this.vehicleService.getVehiclesByUserId(this.userId).subscribe(vehicles => {
      this.myVehicles = vehicles;
      this.vehicleCount = vehicles.length;
      
      // Calculate statistics (mock data for now)
      this.myListingsStats = {
        totalViews: vehicles.length * 15,
        totalBookings: Math.floor(vehicles.length * 1.5),
        totalRevenue: vehicles.reduce((sum, vehicle) => sum + vehicle.pret * 3, 0),
        avgRating: 4.3
      };
    });
  }
  
  private processChartData(vehicles: Vehicle[]): void {
    // Process data for vehicle make chart
    const makeMap = new Map<string, number>();
    vehicles.forEach(vehicle => {
      const make = vehicle.firma;
      makeMap.set(make, (makeMap.get(make) || 0) + 1);
    });
    
    this.vehiclesByMakeData = Array.from(makeMap.entries()).map(([make, count]) => ({
      name: make,
      value: count
    }));
    
    // Process data for vehicle year chart
    const yearMap = new Map<number, number>();
    vehicles.forEach(vehicle => {
      const year = vehicle.anFabricatie;
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });
    
    this.vehiclesByYearData = Array.from(yearMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({
        name: year.toString(),
        value: count
      }));
  }
  
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
  
  toggleFavorite(vehicle: Vehicle): void {
    this.vehicleService.toggleFavorite(vehicle.id);
  }
  
  isFavorite(vehicle: Vehicle): boolean {
    return this.vehicleService.isFavorite(vehicle.id);
  }
}