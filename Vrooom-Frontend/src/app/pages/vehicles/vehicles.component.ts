import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
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
import { finalize, takeUntil, timeout, catchError, debounceTime } from 'rxjs/operators';
import { Router } from '@angular/router';
import { TokenService } from '../../services/token.service';
import { Subject, of, timer } from 'rxjs';

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
export class VehiclesComponent implements OnInit, OnDestroy {
  private vehiclesService = inject(VehiclesService);
  private tokenService = inject(TokenService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  readonly dialog = inject(MatDialog);
  
  private destroy$ = new Subject<void>();

  allVehicles: Vehicle[] = [];
  displayedVehicles: Vehicle[] = [];
  paginatedVehicles: Vehicle[] = [];
  loading = true;
  error = false;
  loadingMessage = 'Loading amazing vehicles...';

  // Pagination
  pageSize = 9;
  pageIndex = 0;
  totalVehicles = 0;

  // Filters
  filterForm: FormGroup;
  showFilters = false;
  
  // Filter options
  carBrands = ['Dacia', 'Mercedes-Benz', 'Ferrari', 'Volkswagen', 'Tesla', 'Jeep', 'Trabant'];
  carColors = ['white', 'black', 'red', 'blue', 'green', 'silver', 'gray', 'grey', 'yellow']; // Added 'grey'
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
      maxPrice: [2000],
      minYear: [1980],
      maxYear: [new Date().getFullYear()],
      maxMileage: [500000], 
      sortBy: ['price_asc']
    });
  }

  ngOnInit() {
    console.log('🚗 VehiclesComponent initializing...');
    this.loadVehicles();
    this.setupFilterSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadVehicles() {
    console.log('🔄 Starting vehicle loading...');
    this.loading = true;
    this.error = false;
    this.loadingMessage = 'Loading amazing vehicles...';
    
    this.allVehicles = [];
    this.displayedVehicles = [];
    this.paginatedVehicles = [];
    this.totalVehicles = 0;
    
    this.vehiclesService.getVehicles(true)
      .pipe(
        timeout(15000),
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('❌ Error in vehicle loading:', error);
          this.error = true;
          this.loading = false; 
          this.loadingMessage = 'Failed to load vehicles';
          return of([]);
        })
      )
      .subscribe({
        next: (data) => {
          console.log('✅ Vehicles loaded successfully:', data);
          console.log('📊 Vehicle count:', data?.length || 0);
          
          this.loading = false;
          this.error = false;
          
          if (data && data.length > 0) {
            console.log('🚗 First vehicle sample:', data[0]);
          }
          
          this.allVehicles = data || [];
          
          if (this.allVehicles.length === 0) {
            console.warn('📭 No vehicles found');
            this.loadingMessage = 'No vehicles available';
            this.totalVehicles = 0;
            this.displayedVehicles = [];
            this.paginatedVehicles = [];
          } else {
            console.log('🔄 Processing vehicles...');
            this.updatePriceRange();
            setTimeout(() => {
              this.applyFilters();
            }, 10);
          }
        },
        error: (err) => {
          console.error('❌ Observable error:', err);
          this.error = true;
          this.loading = false; 
          this.allVehicles = [];
          this.vehiclesService.showErrorMessage('Failed to load vehicles. Please check your connection.');
        },
        complete: () => {
          console.log('🏁 Vehicle loading completed');
          this.loading = false; // Extra safety - ensure loading is always false when complete
        }
      });
  }

  setupFilterSubscription() {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('🔍 Filter values changed, applying filters...');
        this.applyFilters();
      });
  }

  applyFilters() {
    console.log('🔄 applyFilters called');
    console.log('📊 allVehicles.length:', this.allVehicles.length);
    console.log('⏳ loading:', this.loading);
    
    if (this.allVehicles.length === 0) {
      console.log('⏸️ Skipping filter application - no vehicles loaded yet');
      this.displayedVehicles = [];
      this.totalVehicles = 0;
      this.paginatedVehicles = [];
      return;
    }

    const filters = this.filterForm.value;
    console.log('🔍 Current filter values:', filters);
    
    let filtered = [...this.allVehicles];
    console.log('📝 Starting with', filtered.length, 'vehicles');

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      console.log('🔍 Applying search filter for:', searchTerm);
      const beforeSearch = filtered.length;
      filtered = filtered.filter(vehicle => 
        (vehicle.titlu && vehicle.titlu.toLowerCase().includes(searchTerm)) ||
        (vehicle.descriere && vehicle.descriere.toLowerCase().includes(searchTerm)) ||
        (vehicle.firma && vehicle.firma.toLowerCase().includes(searchTerm)) ||
        (vehicle.model && vehicle.model.toLowerCase().includes(searchTerm)) ||
        (vehicle.locatie && vehicle.locatie.toLowerCase().includes(searchTerm))
      );
      console.log(`🔍 Search filter: ${beforeSearch} → ${filtered.length}`);
    }

    if (filters.brand && filters.brand.trim()) {
      console.log('🏭 Applying brand filter for:', filters.brand);
      const beforeBrand = filtered.length;
      filtered = filtered.filter(vehicle => vehicle.firma === filters.brand);
      console.log(`🏭 Brand filter: ${beforeBrand} → ${filtered.length}`);
    }

    if (filters.color && filters.color.trim()) {
      console.log('🎨 Applying color filter for:', filters.color);
      const beforeColor = filtered.length;
      filtered = filtered.filter(vehicle => {
        // Normalize color comparison
        const vehicleColor = (vehicle.culoare || '').toLowerCase().trim();
        const filterColor = filters.color.toLowerCase().trim();
        
        // Handle gray/grey variations
        if ((filterColor === 'gray' || filterColor === 'grey') && 
            (vehicleColor === 'gray' || vehicleColor === 'grey')) {
          return true;
        }
        
        return vehicleColor === filterColor;
      });
      console.log(`🎨 Color filter: ${beforeColor} → ${filtered.length}`);
      
      if (filtered.length === 0) {
        console.log('🔍 Available colors in all vehicles:', 
          this.allVehicles.map(v => v.culoare).filter((v, i, a) => a.indexOf(v) === i));
      }
    }

    const beforePrice = filtered.length;
    filtered = filtered.filter(vehicle => {
      const price = vehicle.pret || 0;
      return price >= (filters.minPrice || 0) && price <= (filters.maxPrice || 999999);
    });
    console.log(`💰 Price filter (${filters.minPrice}-${filters.maxPrice}): ${beforePrice} → ${filtered.length}`);

    const beforeYear = filtered.length;
    filtered = filtered.filter(vehicle => {
      const year = vehicle.anFabricatie || 0;
      return year >= (filters.minYear || 0) && year <= (filters.maxYear || 9999);
    });
    console.log(`📅 Year filter (${filters.minYear}-${filters.maxYear}): ${beforeYear} → ${filtered.length}`);

    const beforeMileage = filtered.length;
    filtered = filtered.filter(vehicle => {
      const mileage = vehicle.kilometraj || 0;
      return mileage <= (filters.maxMileage || 999999);
    });
    console.log(`🛣️ Mileage filter (≤${filters.maxMileage}): ${beforeMileage} → ${filtered.length}`);

    if (filters.sortBy) {
      this.sortVehicles(filtered, filters.sortBy);
      console.log('📊 Vehicles sorted by:', filters.sortBy);
    }

    this.displayedVehicles = filtered;
    this.totalVehicles = filtered.length;
    this.pageIndex = 0;
    this.updatePaginatedVehicles();

    console.log('✅ Filter application complete:');
    console.log(`📊 Total: ${this.allVehicles.length} → Displayed: ${this.totalVehicles}`);
    console.log(`📄 Paginated: ${this.paginatedVehicles.length} (page ${this.pageIndex + 1})`);
  }

  sortVehicles(vehicles: Vehicle[], sortBy: string) {
    switch (sortBy) {
      case 'price_asc':
        vehicles.sort((a, b) => (a.pret || 0) - (b.pret || 0));
        break;
      case 'price_desc':
        vehicles.sort((a, b) => (b.pret || 0) - (a.pret || 0));
        break;
      case 'year_desc':
        vehicles.sort((a, b) => (b.anFabricatie || 0) - (a.anFabricatie || 0));
        break;
      case 'year_asc':
        vehicles.sort((a, b) => (a.anFabricatie || 0) - (b.anFabricatie || 0));
        break;
      case 'mileage_asc':
        vehicles.sort((a, b) => (a.kilometraj || 0) - (b.kilometraj || 0));
        break;
      case 'mileage_desc':
        vehicles.sort((a, b) => (b.kilometraj || 0) - (a.kilometraj || 0));
        break;
    }
  }

  updatePriceRange() {
    if (this.allVehicles.length > 0) {
      const prices = this.allVehicles.map(v => v.pret || 0).filter(p => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        console.log('💰 Price range updated:', minPrice, '-', maxPrice);
        
        this.priceRange.min = minPrice;
        this.priceRange.max = maxPrice;
        
        this.filterForm.patchValue({
          minPrice: minPrice,
          maxPrice: maxPrice
        }, { emitEvent: false });
      }
    }
  }

  onPageChange(event: PageEvent) {
    console.log('📄 Page changed:', event);
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePaginatedVehicles();
  }

  updatePaginatedVehicles() {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedVehicles = this.displayedVehicles.slice(startIndex, endIndex);
    
    console.log(`📄 Pagination: showing ${startIndex}-${endIndex} of ${this.displayedVehicles.length}`);
    console.log(`📄 Paginated vehicles count: ${this.paginatedVehicles.length}`);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
    console.log('🔧 Filters toggled:', this.showFilters);
  }

  clearFilters() {
    console.log('🧹 Clearing all filters...');
    
    this.filterForm.reset({
      searchTerm: '',
      brand: '',
      color: '',
      minPrice: this.priceRange.min,
      maxPrice: this.priceRange.max,
      minYear: this.yearRange.min,
      maxYear: this.yearRange.max,
      maxMileage: 500000,
      sortBy: 'price_asc'
    });
    
    // Force apply filters after reset
    setTimeout(() => {
      this.applyFilters();
    }, 100);
  }

  // Debug method - force show all vehicles
  showAllVehicles() {
    console.log('🔄 Force showing all vehicles...');
    this.displayedVehicles = [...this.allVehicles];
    this.totalVehicles = this.allVehicles.length;
    this.pageIndex = 0;
    this.updatePaginatedVehicles();
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
          
          const booking = {
            userId: parseInt(this.tokenService.getUserId() || '0'),
            postareId: vehicle.id,
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