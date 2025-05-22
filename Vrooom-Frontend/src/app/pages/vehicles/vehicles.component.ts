import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { RentDialogComponent } from '../../components/rent-dialog/rent-dialog.component';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';

@Component({
  selector: 'app-vehicles',
  imports: [
    CommonModule, 
    MatCardModule, 
    MatButtonModule, 
    MatDialogModule, 
    MatProgressSpinnerModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatChipsModule,
    MatPaginatorModule,
    MatTooltipModule,
    ReactiveFormsModule
  ],
  templateUrl: './vehicles.component.html',
  styleUrl: './vehicles.component.scss',
})
export class VehiclesComponent implements OnInit {
  private vehiclesService = inject(VehiclesService);
  private tokenService = inject(TokenService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly dialog = inject(MatDialog);

  allVehicles: Vehicle[] = [];
  displayedVehicles: Vehicle[] = [];
  paginatedVehicles: Vehicle[] = [];
  loading = true;
  error = false;

  // Pagination
  pageSize = 9;
  pageIndex = 0;
  totalVehicles = 0;

  // Filters
  filterForm: FormGroup;
  showFilters = false;
  
  // Filter options
  carBrands = ['Dacia', 'Mercedes-Benz', 'Ferrari', 'Volkswagen', 'Tesla', 'Jeep', 'Trabant'];
  carColors = ['white', 'black', 'red', 'blue', 'green', 'silver', 'gray', 'yellow'];
  priceRange = { min: 0, max: 1000 };
  yearRange = { min: 1980, max: new Date().getFullYear() };

  // Sort options
  sortOptions = [
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'year_desc', label: 'Year: Newest First' },
    { value: 'year_asc', label: 'Year: Oldest First' },
    { value: 'mileage_asc', label: 'Mileage: Low to High' },
    { value: 'mileage_desc', label: 'Mileage: High to Low' }
  ];

  constructor() {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      brand: [''],
      color: [''],
      minPrice: [0],
      maxPrice: [1000],
      minYear: [1980],
      maxYear: [new Date().getFullYear()],
      maxMileage: [200000],
      sortBy: ['price_asc']
    });
  }

  ngOnInit() {
    this.loadVehicles();
    this.setupFilterSubscription();
  }

  loadVehicles() {
    this.loading = true;
    this.error = false;
    
    this.vehiclesService.getVehicles()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.allVehicles = data;
          this.applyFilters();
          this.updatePriceRange();
        },
        error: (err) => {
          console.error('Error loading vehicles:', err);
          this.error = true;
          this.vehiclesService.showErrorMessage('Failed to load vehicles');
        }
      });
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters() {
    const filters = this.filterForm.value;
    let filtered = [...this.allVehicles];

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.titlu.toLowerCase().includes(searchTerm) ||
        vehicle.descriere.toLowerCase().includes(searchTerm) ||
        vehicle.firma.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        vehicle.locatie.toLowerCase().includes(searchTerm)
      );
    }

    // Brand filter
    if (filters.brand) {
      filtered = filtered.filter(vehicle => vehicle.firma === filters.brand);
    }

    // Color filter
    if (filters.color) {
      filtered = filtered.filter(vehicle => vehicle.culoare === filters.color);
    }

    // Price range filter
    filtered = filtered.filter(vehicle => 
      vehicle.pret >= filters.minPrice && vehicle.pret <= filters.maxPrice
    );

    // Year range filter
    filtered = filtered.filter(vehicle => 
      vehicle.anFabricatie >= filters.minYear && vehicle.anFabricatie <= filters.maxYear
    );

    // Mileage filter
    filtered = filtered.filter(vehicle => vehicle.kilometraj <= filters.maxMileage);

    // Sort
    this.sortVehicles(filtered, filters.sortBy);

    this.displayedVehicles = filtered;
    this.totalVehicles = filtered.length;
    this.pageIndex = 0;
    this.updatePaginatedVehicles();
  }

  sortVehicles(vehicles: Vehicle[], sortBy: string) {
    switch (sortBy) {
      case 'price_asc':
        vehicles.sort((a, b) => a.pret - b.pret);
        break;
      case 'price_desc':
        vehicles.sort((a, b) => b.pret - a.pret);
        break;
      case 'year_desc':
        vehicles.sort((a, b) => b.anFabricatie - a.anFabricatie);
        break;
      case 'year_asc':
        vehicles.sort((a, b) => a.anFabricatie - b.anFabricatie);
        break;
      case 'mileage_asc':
        vehicles.sort((a, b) => a.kilometraj - b.kilometraj);
        break;
      case 'mileage_desc':
        vehicles.sort((a, b) => b.kilometraj - a.kilometraj);
        break;
    }
  }

  updatePriceRange() {
    if (this.allVehicles.length > 0) {
      const prices = this.allVehicles.map(v => v.pret);
      this.priceRange.min = Math.min(...prices);
      this.priceRange.max = Math.max(...prices);
      
      this.filterForm.patchValue({
        minPrice: this.priceRange.min,
        maxPrice: this.priceRange.max
      }, { emitEvent: false });
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedVehicles();
  }

  updatePaginatedVehicles() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedVehicles = this.displayedVehicles.slice(startIndex, endIndex);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  clearFilters() {
    this.filterForm.reset({
      searchTerm: '',
      brand: '',
      color: '',
      minPrice: this.priceRange.min,
      maxPrice: this.priceRange.max,
      minYear: this.yearRange.min,
      maxYear: this.yearRange.max,
      maxMileage: 200000,
      sortBy: 'price_asc'
    });
  }

  openBookingDialog(vehicle: Vehicle) {
    const dialogRef = this.dialog.open(RentDialogComponent, {
      width: '500px',
      data: { vehicle }
    });

    dialogRef.componentInstance.onBookEvent.subscribe((slot: any) => {
      this.bookVehicle(vehicle, slot);
    });
  }

  bookVehicle(vehicle: Vehicle, slot: any) {
    this.vehiclesService.bookVehicle(vehicle.id, slot)
      .subscribe({
        next: (response) => {
          this.vehiclesService.showSuccessMessage('Vehicle booked successfully!');
          
          // Send booking confirmation email
          const booking = {
            userId: parseInt(this.tokenService.getUserId() || '0'),
            postareId: vehicle.id,
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
          this.vehiclesService.showErrorMessage('Failed to book vehicle. Please try again.');
        }
      });
  }

  getVehicleImageUrl(vehicleId: number): string {
    return this.vehiclesService.getVehicleImageUrl(vehicleId);
  }

  onImageError(event: any) {
    event.target.src = 'https://via.placeholder.com/350x220?text=No+Image';
  }

  viewVehicleDetails(vehicle: Vehicle) {
    this.router.navigate(['/vehicle', vehicle.id]);
}

  canUserBook(vehicle: Vehicle): boolean {
    const currentUserId = this.tokenService.getUserId();
    return !!(currentUserId && parseInt(currentUserId) !== vehicle.userId);
  }
}