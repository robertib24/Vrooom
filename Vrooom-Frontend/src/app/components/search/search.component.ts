import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { VehiclesService, Vehicle } from '../../services/vehicles.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup;
  searchResults: Vehicle[] = [];
  loading = false;
  searched = false;
  errorMessage = '';

  searchSuggestions = [
    "I need a red sports car for the weekend",
    "Looking for an economical car under €50/day",
    "SUV with 4WD for mountain trip",
    "Luxury car for business meeting",
    "Electric vehicle for city driving",
    "Family car for 5 people with large trunk",
    "Convertible for summer vacation",
    "Vintage car for wedding photos"
  ];

  constructor(
    private fb: FormBuilder,
    private vehiclesService: VehiclesService
  ) {
    this.searchForm = this.fb.group({
      query: ['']
    });
  }

  ngOnInit() {}

  onSearch() {
    const query = this.searchForm.get('query')?.value?.trim();
    if (!query) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.searched = true;

    this.vehiclesService.searchVehiclesWithAI(query)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (results) => {
          this.searchResults = results;
          if (results.length === 0) {
            this.errorMessage = 'No vehicles found matching your criteria. Try a different search.';
          }
        },
        error: (error) => {
          console.error('Search error:', error);
          this.errorMessage = 'Search failed. Please try again.';
          this.searchResults = [];
        }
      });
  }

  useSuggestion(suggestion: string) {
    this.searchForm.patchValue({ query: suggestion });
    this.onSearch();
  }

  clearSearch() {
    this.searchForm.reset();
    this.searchResults = [];
    this.searched = false;
    this.errorMessage = '';
  }

  getVehicleImageUrl(vehicleId: number): string {
    return this.vehiclesService.getVehicleImageUrl(vehicleId);
  }

  viewVehicleDetails(vehicle: Vehicle) {
    // Navigate to vehicle details - you'll implement this route
    console.log('View details for vehicle:', vehicle);
  }

  bookVehicle(vehicle: Vehicle) {
    // Navigate to booking - you'll implement this
    console.log('Book vehicle:', vehicle);
  }
}