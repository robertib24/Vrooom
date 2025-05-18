import { Component, OnInit, ViewChild, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, startWith, switchMap, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';

import { VehicleService, VehicleSearchParams } from '../../services/vehicle.service';
import { TokenService } from '../../services/token.service';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';
import { VehicleCardComponent } from '../../components/vehicle-card/vehicle-card.component';
import { MapComponent } from '../../components/map/map.component';
import { Vehicle } from '../../models/other.models';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatChipsModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatButtonToggleModule,
    MatDialogModule,
    VehicleCardComponent,
    MapComponent
  ],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
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
export class VehiclesComponent implements OnInit {
  vehicles: Vehicle[] = [];
  filteredVehicles: Vehicle[] = [];
  loading = true;
  filterForm: FormGroup;
  viewMode: 'grid' | 'list' | 'map' = 'grid';
  sortOption = 'newest';
  
  makeOptions: string[] = [];
  modelOptions: string[] = [];
  colorOptions: string[] = [];
  yearOptions: number[] = [];
  
  filtersApplied = false;
  filterCount = 0;
  showFilters = true;
  isMobile = false;
  
  // Search params
  minYear = 2000;
  maxYear = new Date().getFullYear();
  minPrice = 0;
  maxPrice = 500;
  
  // AI search
  aiSearchQuery = '';
  
  private vehicleService = inject(VehicleService);
  private tokenService = inject(TokenService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  
  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }
  
  ngOnInit(): void {
    this.checkScreenSize();
    this.initFilterForm();
    this.loadVehicles();
    
    // Subscribe to filter changes
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(400),
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
        tap(() => this.countActiveFilters())
      )
      .subscribe(filters => {
        this.applyFilters(filters);
      });
  }
  
  private checkScreenSize(): void {
    this.isMobile = window.innerWidth < 960;
    if (this.isMobile) {
      this.showFilters = false;
    }
  }
  
  private initFilterForm(): void {
    this.filterForm = this.formBuilder.group({
      make: [''],
      model: [''],
      yearRange: [[this.minYear, this.maxYear]],
      priceRange: [[this.minPrice, this.maxPrice]],
      colors: [[]],
      features: this.formBuilder.group({
        airConditioner: [false],
        bluetooth: [false],
        gps: [false],
        leatherSeats: [false],
        sunroof: [false],
        parkingSensors: [false]
      })
    });
  }
  
  private loadVehicles(): void {
    this.loading = true;
    
    this.vehicleService.getVehicles()
      .pipe(
        tap(vehicles => {
          // Extract options for filters
          this.extractFilterOptions(vehicles);
        })
      )
      .subscribe({
        next: (vehicles) => {
          this.vehicles = vehicles;
          this.filteredVehicles = [...vehicles];
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
          this.loading = false;
        }
      });
  }
  
  private extractFilterOptions(vehicles: Vehicle[]): void {
    // Extract unique makes
    this.makeOptions = [...new Set(vehicles.map(v => v.firma))].sort();
    
    // Extract unique models
    this.modelOptions = [...new Set(vehicles.map(v => v.model))].sort();
    
    // Extract unique colors
    this.colorOptions = [...new Set(vehicles.map(v => v.culoare))].sort();
    
    // Extract year range
    const years = vehicles.map(v => v.anFabricatie);
    this.minYear = Math.min(...years);
    this.maxYear = Math.max(...years);
    
    // Generate year options
    this.yearOptions = [];
    for (let year = this.minYear; year <= this.maxYear; year++) {
      this.yearOptions.push(year);
    }
    
    // Extract price range
    const prices = vehicles.map(v => v.pret);
    this.minPrice = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    
    // Update form controls with new ranges
    this.filterForm.patchValue({
      yearRange: [this.minYear, this.maxYear],
      priceRange: [this.minPrice, this.maxPrice]
    });
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  clearFilters(): void {
    this.filterForm.reset({
      make: '',
      model: '',
      yearRange: [this.minYear, this.maxYear],
      priceRange: [this.minPrice, this.maxPrice],
      colors: [],
      features: {
        airConditioner: false,
        bluetooth: false,
        gps: false,
        leatherSeats: false,
        sunroof: false,
        parkingSensors: false
      }
    });
    
    this.filtersApplied = false;
    this.filterCount = 0;
    this.filteredVehicles = [...this.vehicles];
  }
  
  private countActiveFilters(): void {
    const formValue = this.filterForm.value;
    let count = 0;
    
    if (formValue.make) count++;
    if (formValue.model) count++;
    if (formValue.colors && formValue.colors.length > 0) count++;
    
    const features = formValue.features;
    if (features) {
      if (features.airConditioner) count++;
      if (features.bluetooth) count++;
      if (features.gps) count++;
      if (features.leatherSeats) count++;
      if (features.sunroof) count++;
      if (features.parkingSensors) count++;
    }
    
    const [minYearSelected, maxYearSelected] = formValue.yearRange || [this.minYear, this.maxYear];
    if (minYearSelected > this.minYear || maxYearSelected < this.maxYear) {
      count++;
    }
    
    const [minPriceSelected, maxPriceSelected] = formValue.priceRange || [this.minPrice, this.maxPrice];
    if (minPriceSelected > this.minPrice || maxPriceSelected < this.maxPrice) {
      count++;
    }
    
    this.filterCount = count;
    this.filtersApplied = count > 0;
  }
  
  private applyFilters(filters: any): void {
    if (!this.vehicles || this.vehicles.length === 0) return;
    
    let result = [...this.vehicles];
    
    // Filter by make
    if (filters.make) {
      result = result.filter(v => v.firma === filters.make);
    }
    
    // Filter by model
    if (filters.model) {
      result = result.filter(v => v.model === filters.model);
    }
    
    // Filter by year range
    if (filters.yearRange) {
      const [minYear, maxYear] = filters.yearRange;
      result = result.filter(v => v.anFabricatie >= minYear && v.anFabricatie <= maxYear);
    }
    
    // Filter by price range
    if (filters.priceRange) {
      const [minPrice, maxPrice] = filters.priceRange;
      result = result.filter(v => v.pret >= minPrice && v.pret <= maxPrice);
    }
    
    // Filter by colors
    if (filters.colors && filters.colors.length > 0) {
      result = result.filter(v => filters.colors.includes(v.culoare));
    }
    
    // Apply sorting
    this.sortVehicles(result);
    
    this.filteredVehicles = result;
  }
  
  sortVehicles(vehicles: Vehicle[] = this.filteredVehicles): void {
    switch (this.sortOption) {
      case 'newest':
        vehicles.sort((a, b) => b.anFabricatie - a.anFabricatie);
        break;
      case 'oldest':
        vehicles.sort((a, b) => a.anFabricatie - b.anFabricatie);
        break;
      case 'priceAsc':
        vehicles.sort((a, b) => a.pret - b.pret);
        break;
      case 'priceDesc':
        vehicles.sort((a, b) => b.pret - a.pret);
        break;
      default:
        vehicles.sort((a, b) => b.anFabricatie - a.anFabricatie);
    }
    
    this.filteredVehicles = [...vehicles];
  }
  
  handleColorFilterChange(color: string): void {
    const colors = this.filterForm.get('colors').value as string[] || [];
    
    if (colors.includes(color)) {
      // Remove color
      this.filterForm.patchValue({
        colors: colors.filter(c => c !== color)
      });
    } else {
      // Add color
      this.filterForm.patchValue({
        colors: [...colors, color]
      });
    }
  }
  
  isColorSelected(color: string): boolean {
    const colors = this.filterForm.get('colors').value as string[] || [];
    return colors.includes(color);
  }
  
  onSortChange(value: string): void {
    this.sortOption = value;
    this.sortVehicles();
  }
  
  onViewModeChange(mode: 'grid' | 'list' | 'map'): void {
    this.viewMode = mode;
  }
  
  onAISearch(): void {
    if (!this.aiSearchQuery) return;
    
    this.loading = true;
    
    this.vehicleService.searchWithAI(this.aiSearchQuery)
      .subscribe({
        next: (vehicles) => {
          this.vehicles = vehicles;
          this.filteredVehicles = [...vehicles];
          this.loading = false;
          
          // Extract new filter options based on AI search results
          this.extractFilterOptions(vehicles);
        },
        error: (error) => {
          console.error('Error searching vehicles:', error);
          this.loading = false;
        }
      });
  }
  
  clearAISearch(): void {
    this.aiSearchQuery = '';
    this.loadVehicles();
  }
  
  openBookingDialog(vehicle: Vehicle): void {
    const userId = this.tokenService.getUserId();
    
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    
    const dialogRef = this.dialog.open(RentDialogComponent);
    
    dialogRef.componentInstance.onBookEvent.subscribe((slot: any) => {
      this.bookVehicle(vehicle, Number(userId), slot);
    });
  }
  
  bookVehicle(vehicle: Vehicle, userId: number, slot: any): void {
    this.vehicleService.bookVehicle(vehicle.id, userId, slot)
      .subscribe({
        next: () => {
          // Send booking confirmation email
          const bookingData = {
            userId: userId,
            postareId: vehicle.id,
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
        }
      });
  }
  
  viewVehicleDetails(vehicle: Vehicle): void {
    this.router.navigate(['/vehicles', vehicle.id]);
  }
  
  toggleFavorite(vehicle: Vehicle): void {
    this.vehicleService.toggleFavorite(vehicle.id);
  }
  
  isFavorite(vehicle: Vehicle): boolean {
    return this.vehicleService.isFavorite(vehicle.id);
  }
}