import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { ApiService } from './api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../components/snackbar/snackbar.component';
import { Vehicle } from '../models/other.models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface VehicleSearchParams {
  make?: string;
  model?: string;
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minKm?: number;
  maxKm?: number;
  color?: string;
  naturalLanguageQuery?: string;
}

export interface VehicleLocation {
  lat: number;
  lng: number;
  address: string;
  title: string;
  id: number;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private favoriteVehiclesSubject = new BehaviorSubject<number[]>(this.loadFavorites());
  public favoriteVehicles$ = this.favoriteVehiclesSubject.asObservable();
  
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  public vehicles$ = this.vehiclesSubject.asObservable();
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  constructor(
    private apiService: ApiService, 
    private _snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  /**
   * Get all vehicles
   */
  getVehicles(): Observable<Vehicle[]> {
    this.loadingSubject.next(true);
    return this.apiService.get<Vehicle[]>('Postare')
      .pipe(
        tap(vehicles => {
          this.vehiclesSubject.next(vehicles);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Get vehicle by ID
   */
  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`Postare/carid/${id}`);
  }

  /**
   * Get vehicles by user ID
   */
  getVehiclesByUserId(userId: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/userId?userId=${userId}`);
  }

  /**
   * Search vehicles with various filtering options
   */
  searchVehicles(params: VehicleSearchParams): Observable<Vehicle[]> {
    this.loadingSubject.next(true);
    
    // If natural language query is provided, use OpenAI API
    if (params.naturalLanguageQuery) {
      return this.searchWithAI(params.naturalLanguageQuery);
    }
    
    // Otherwise use standard search endpoints
    let endpoint = '';
    let queryParams = '';
    
    if (params.make) {
      endpoint = `Postare/firma/${params.make}`;
    } else if (params.model) {
      endpoint = `Postare/model/${params.model}`;
    } else if (params.minPrice !== undefined && params.maxPrice !== undefined) {
      endpoint = `Postare/pret/${params.minPrice}/${params.maxPrice}`;
    } else if (params.minKm !== undefined && params.maxKm !== undefined) {
      endpoint = `Postare/km/${params.minKm}/${params.maxKm}`;
    } else if (params.minYear !== undefined && params.maxYear !== undefined) {
      endpoint = `Postare/an/${params.minYear}/${params.maxYear}`;
    } else {
      endpoint = 'Postare';
    }
    
    return this.apiService.get<Vehicle[]>(endpoint + queryParams)
      .pipe(
        tap(vehicles => {
          this.vehiclesSubject.next(vehicles);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Search vehicles using OpenAI natural language processing
   */
  searchWithAI(query: string): Observable<Vehicle[]> {
    const data = { prompt: query };
    
    return this.apiService.post<Vehicle[]>('OpenAI/getCars', data)
      .pipe(
        tap(vehicles => {
          this.vehiclesSubject.next(vehicles);
          this.loadingSubject.next(false);
        })
      );
  }

  /**
   * Generate improved vehicle description using OpenAI
   */
  generateDescription(description: string): Observable<string> {
    const data = { prompt: description };
    
    return this.apiService.post<{ prompt: string }>('OpenAI/getdescription', data)
      .pipe(
        map(response => response.prompt)
      );
  }

  /**
   * Add a new vehicle listing
   */
  addVehicle(vehicle: any, images: File[]): Observable<number> {
    this.loadingSubject.next(true);
    
    const formData = new FormData();
    
    // Append vehicle data to form
    Object.keys(vehicle).forEach(key => {
      if (vehicle[key] !== undefined && vehicle[key] !== null && typeof vehicle[key] !== 'object') {
        formData.append(key, vehicle[key].toString());
      }
    });
    
    // Append images
    images.forEach((image, index) => {
      formData.append(`imagini`, image);
    });
    
    // Append documents if available
    if (vehicle.talonFile) {
      formData.append('talon', vehicle.talonFile);
    }
    if (vehicle.carteIdentitateFile) {
      formData.append('carteIdentitateMasina', vehicle.carteIdentitateFile);
    }
    if (vehicle.asigurareFile) {
      formData.append('asigurare', vehicle.asigurareFile);
    }
    
    return this.apiService.postFormData<number>('Postare', formData)
      .pipe(
        tap(() => this.loadingSubject.next(false))
      );
  }

  /**
   * Delete a vehicle listing
   */
  deleteVehicle(id: number): Observable<any> {
    return this.apiService.delete(`Postare/${id}`);
  }

  /**
   * Book a vehicle for a specific time period
   */
  bookVehicle(vehicleId: number, userId: number, slot: { start: Date, end: Date }): Observable<any> {
    const bookingData = {
      userId: userId,
      postareId: vehicleId,
      dataStart: slot.start,
      dataStop: slot.end,
    };

    return this.apiService.post('Chirie', bookingData);
  }

  /**
   * Send booking confirmation emails
   */
  sendBookingConfirmation(bookingData: any): Observable<any> {
    return this.apiService.post('Chirie/rentConfirmationEmail', bookingData);
  }

  /**
   * Add a review for a vehicle
   */
  addReview(review: any, postareId: number, userId: number): Observable<any> {
    return this.apiService.post('Review', review, { params: { postareId, userId } });
  }

  /**
   * Get reviews for a vehicle sorted by criteria
   */
  getReviewsByRating(order: 'asc' | 'desc'): Observable<any> {
    const endpoint = order === 'asc' 
      ? 'Review/GetReviewsByRatingLowToHigh' 
      : 'Review/GetReviewsByRatingHighToLow';
    
    return this.apiService.get(endpoint);
  }

  /**
   * Get reviews by date
   */
  getReviewsByDate(order: 'asc' | 'desc'): Observable<any> {
    const endpoint = order === 'asc' 
      ? 'Review/GetReviewsByDateOldToNew' 
      : 'Review/GetReviewsByDateNewToOld';
    
    return this.apiService.get(endpoint);
  }

  /**
   * Toggle vehicle favorite status
   */
  toggleFavorite(vehicleId: number): void {
    const favorites = this.loadFavorites();
    const index = favorites.indexOf(vehicleId);
    
    if (index === -1) {
      favorites.push(vehicleId);
    } else {
      favorites.splice(index, 1);
    }
    
    localStorage.setItem('favoriteVehicles', JSON.stringify(favorites));
    this.favoriteVehiclesSubject.next(favorites);
  }

  /**
   * Check if a vehicle is in favorites
   */
  isFavorite(vehicleId: number): boolean {
    const favorites = this.loadFavorites();
    return favorites.includes(vehicleId);
  }

  /**
   * Load favorites from local storage
   */
  private loadFavorites(): number[] {
    const favoritesStr = localStorage.getItem('favoriteVehicles');
    return favoritesStr ? JSON.parse(favoritesStr) : [];
  }

  /**
   * Get favorite vehicles
   */
  getFavoriteVehicles(): Observable<Vehicle[]> {
    const favorites = this.loadFavorites();
    if (favorites.length === 0) {
      return new Observable(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    }
    
    return this.getVehicles().pipe(
      map(vehicles => vehicles.filter(v => favorites.includes(v.id)))
    );
  }

  /**
   * Get locations of all vehicles for map display
   */
  getVehicleLocations(): Observable<VehicleLocation[]> {
    return this.getVehicles().pipe(
      map(vehicles => vehicles.map(v => ({
        lat: v.latitudine || 0,
        lng: v.longitudine || 0,
        address: v.locatie_formala || v.locatie || '',
        title: `${v.firma} ${v.model}`,
        id: v.id
      })))
    );
  }

  /**
   * Get Google Maps embed URL for a vehicle
   */
  getMapEmbedUrl(vehicle: Vehicle): string {
    if (!vehicle.linkMaps) {
      return '';
    }
    return vehicle.linkMaps;
  }

  /**
   * Show booking success notification
   */
  showBookingSuccess() {
    this._snackBar.openFromComponent(SnackbarComponent, {
      verticalPosition: 'top',
      duration: 3000,
    });
  }
}