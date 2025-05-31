import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, of, tap } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../components/snackbar/snackbar.component';
import { TokenService } from './token.service';

export interface Vehicle {
  id: number;
  userId: number;
  titlu: string;
  descriere: string;
  pret: number;
  firma: string;
  model: string;
  kilometraj: number;
  anFabricatie: number;
  talon: string;
  carteIdentitateMasina: string;
  culoare: string;
  asigurare: string;
  locatie: string;
  locatie_formala: string;
  linkMaps: string;
  latitudine?: number;
  longitudine?: number;
  nrImagini?: number;
}

export interface Booking {
  userId: number;
  postareId: number;
  dataStart: Date;
  dataStop: Date;
}

export interface Review {
  titlu: string;
  comentariu: string;
  rating: number;
  dataReview: Date;
}

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  // Cache management with BehaviorSubject
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  public vehicles$ = this.vehiclesSubject.asObservable();
  
  // Cache state tracking
  private vehiclesCacheLoaded = false;
  private lastCacheRefresh = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private readonly S3_BUCKET_URL = 'https://vrooom1224.s3.amazonaws.com';
  private readonly PLACEHOLDER_IMAGE = `${this.S3_BUCKET_URL}/placeholder.png`;

  constructor(
    private apiService: ApiService, 
    private snackBar: MatSnackBar,
    private tokenService: TokenService
  ) {}

  /**
   * Get all vehicles with smart caching
   */
  getVehicles(forceRefresh: boolean = false): Observable<Vehicle[]> {
    const now = Date.now();
    const cacheExpired = (now - this.lastCacheRefresh) > this.CACHE_DURATION;
    
    // Return cached data if available and not expired, unless force refresh
    if (!forceRefresh && this.vehiclesCacheLoaded && !cacheExpired) {
      console.log('🔄 Returning cached vehicles data');
      return this.vehicles$;
    }

    console.log('🌐 Fetching vehicles from API...');
    return this.apiService.get<Vehicle[]>('Postare').pipe(
      tap(vehicles => {
        console.log(`✅ Loaded ${vehicles.length} vehicles from API`);
        this.vehiclesSubject.next(vehicles);
        this.vehiclesCacheLoaded = true;
        this.lastCacheRefresh = now;
      })
    );
  }

  /**
   * Force refresh vehicles data
   */
  refreshVehicles(): Observable<Vehicle[]> {
    console.log('🔄 Force refreshing vehicles data...');
    return this.getVehicles(true);
  }

  /**
   * Add vehicle and immediately refresh cache
   */
  addVehicle(vehicleData: any, images: File[]): Observable<number> {
    const formData = new FormData();
    
    formData.append('userId', vehicleData.userId.toString());
    formData.append('titlu', vehicleData.titlu || '');
    formData.append('descriere', vehicleData.descriere || '');
    formData.append('pret', vehicleData.pret.toString());
    formData.append('firma', vehicleData.firma || '');
    formData.append('model', vehicleData.model || '');
    formData.append('kilometraj', vehicleData.kilometraj.toString());
    formData.append('anFabricatie', vehicleData.anFabricatie.toString());
    formData.append('culoare', vehicleData.culoare || '');
    formData.append('locatie', vehicleData.locatie || '');
    
    formData.append('talon', this.PLACEHOLDER_IMAGE);
    formData.append('carteIdentitateMasina', this.PLACEHOLDER_IMAGE);
    formData.append('asigurare', this.PLACEHOLDER_IMAGE);

    images.forEach((image, index) => {
      const imageNumber = index + 1;
      const fileExtension = this.getFileExtension(image.name) || 'jpg';
      const fileName = `${imageNumber}.${fileExtension}`;
      
      formData.append('imagini', image, fileName);
    });

    return this.apiService.postFormData<number>('Postare', formData).pipe(
      tap(vehicleId => {
        console.log(`✅ Vehicle created with ID: ${vehicleId}`);
        // Immediately refresh vehicles cache
        this.refreshVehiclesCache();
      })
    );
  }

  /**
   * Delete vehicle and refresh cache
   */
  deleteVehicle(id: number): Observable<any> {
    return this.apiService.delete(`Postare/${id}`).pipe(
      tap(() => {
        console.log(`🗑️ Vehicle ${id} deleted, refreshing cache...`);
        this.refreshVehiclesCache();
      })
    );
  }

  /**
   * Update vehicle and refresh cache
   */
  updateVehicle(id: number, vehicleData: any): Observable<any> {
    return this.apiService.put(`Postare/${id}`, vehicleData).pipe(
      tap(() => {
        console.log(`✏️ Vehicle ${id} updated, refreshing cache...`);
        this.refreshVehiclesCache();
      })
    );
  }

  /**
   * Internal method to refresh cache after mutations
   */
  private refreshVehiclesCache(): void {
    setTimeout(() => {
      this.getVehicles(true).subscribe({
        next: () => console.log('🔄 Vehicle cache refreshed successfully'),
        error: (error) => console.error('❌ Failed to refresh vehicle cache:', error)
      });
    }, 1000); // Small delay to ensure backend has processed the change
  }

  /**
   * Get cached vehicles (synchronous access to current cache)
   */
  getCachedVehicles(): Vehicle[] {
    return this.vehiclesSubject.value;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    console.log('🧹 Clearing vehicles cache');
    this.vehiclesCacheLoaded = false;
    this.lastCacheRefresh = 0;
    this.vehiclesSubject.next([]);
  }

  /**
   * Get vehicle by ID with cache fallback
   */
  getVehicleById(id: number): Observable<Vehicle> {
    // First try to find in cache
    const cachedVehicle = this.getCachedVehicles().find(v => v.id === id);
    if (cachedVehicle) {
      console.log(`🎯 Found vehicle ${id} in cache`);
      return of(cachedVehicle);
    }

    // If not in cache, fetch from API
    console.log(`🌐 Fetching vehicle ${id} from API`);
    return this.apiService.get<Vehicle>(`Postare/carid/${id}`);
  }

  /**
   * Get vehicles by user ID
   */
  getVehiclesByUserId(userId: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/userId?userId=${userId}`);
  }

  /**
   * Get current user's vehicles
   */
  getUserVehicles(): Observable<Vehicle[]> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.getVehiclesByUserId(parseInt(userId));
  }

  // Search and filter methods (updated to use cached data when possible)
  getVehiclesByPrice(minPrice: number, maxPrice: number): Observable<Vehicle[]> {
    // Try to filter from cache first
    const cached = this.getCachedVehicles();
    if (cached.length > 0) {
      const filtered = cached.filter(v => v.pret >= minPrice && v.pret <= maxPrice);
      return of(filtered);
    }
    
    return this.apiService.get<Vehicle[]>(`Postare/pret/${minPrice}/${maxPrice}`);
  }

  getVehiclesByKm(minKm: number, maxKm: number): Observable<Vehicle[]> {
    const cached = this.getCachedVehicles();
    if (cached.length > 0) {
      const filtered = cached.filter(v => v.kilometraj >= minKm && v.kilometraj <= maxKm);
      return of(filtered);
    }
    
    return this.apiService.get<Vehicle[]>(`Postare/km/${minKm}/${maxKm}`);
  }

  getVehiclesByYear(minYear: number, maxYear: number): Observable<Vehicle[]> {
    const cached = this.getCachedVehicles();
    if (cached.length > 0) {
      const filtered = cached.filter(v => v.anFabricatie >= minYear && v.anFabricatie <= maxYear);
      return of(filtered);
    }
    
    return this.apiService.get<Vehicle[]>(`Postare/an/${minYear}/${maxYear}`);
  }

  getVehiclesByMake(make: string): Observable<Vehicle[]> {
    const cached = this.getCachedVehicles();
    if (cached.length > 0) {
      const filtered = cached.filter(v => 
        v.firma.toLowerCase().includes(make.toLowerCase())
      );
      return of(filtered);
    }
    
    return this.apiService.get<Vehicle[]>(`Postare/firma/${make}`);
  }

  getVehiclesByModel(model: string): Observable<Vehicle[]> {
    const cached = this.getCachedVehicles();
    if (cached.length > 0) {
      const filtered = cached.filter(v => 
        v.model.toLowerCase().includes(model.toLowerCase())
      );
      return of(filtered);
    }
    
    return this.apiService.get<Vehicle[]>(`Postare/model/${model}`);
  }

  getVehiclesByTitle(title: string): Observable<Vehicle[]> {
    const cached = this.getCachedVehicles();
    if (cached.length > 0) {
      const filtered = cached.filter(v => 
        v.titlu.toLowerCase().includes(title.toLowerCase())
      );
      return of(filtered);
    }
    
    return this.apiService.get<Vehicle[]>(`Postare/titlu/${title}`);
  }

  // Image handling methods
  getVehicleImageUrl(vehicleId: number, imageIndex: number = 1): string {
    return `${this.S3_BUCKET_URL}/post${vehicleId}/${imageIndex}.jpg`;
  }

  getVehicleImages(vehicleId: number, imageCount: number = 1): string[] {
    const images: string[] = [];
    for (let i = 1; i <= imageCount; i++) {
      images.push(this.getVehicleImageUrl(vehicleId, i));
    }
    return images;
  }

  getPlaceholderImageUrl(): string {
    return this.PLACEHOLDER_IMAGE;
  }

  // AI and enhancement methods
  searchVehiclesWithAI(query: string): Observable<Vehicle[]> {
    return this.apiService.post<Vehicle[]>('OpenAI/getCars', { prompt: query });
  }

  enhanceDescription(description: string): Observable<{prompt: string}> {
    return this.apiService.post<{prompt: string}>('OpenAI/getdescription', { prompt: description });
  }

  // Booking methods
  bookVehicle(vehicleId: number, bookingData: { start: Date, end: Date }): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const startDate = new Date(bookingData.start);
    const endDate = new Date(bookingData.end);
    
    const fixedStartDate = new Date(
      startDate.getFullYear(), 
      startDate.getMonth(), 
      startDate.getDate(), 
      12, 0, 0
    );
    
    const fixedEndDate = new Date(
      endDate.getFullYear(), 
      endDate.getMonth(), 
      endDate.getDate(), 
      12, 0, 0
    );

    const booking: Booking = {
      userId: parseInt(userId),
      postareId: vehicleId,
      dataStart: fixedStartDate,
      dataStop: fixedEndDate
    };

    return this.apiService.post('Chirie', booking);
  }

  getUserBookings(): Observable<Booking[]> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.apiService.get<Booking[]>(`Chirie/user/${userId}`);
  }

  getOwnerBookings(): Observable<any[]> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.apiService.get<any[]>(`Chirie/owner/${userId}`);
  }

  sendBookingConfirmation(booking: Booking): Observable<any> {
    return this.apiService.post('Chirie/rentConfirmationEmail', booking);
  }

  // Statistics and analytics
  getVehicleViews(vehicleId: number): Observable<number> {
    return of(Math.floor(Math.random() * 90) + 10);
  }

  getAllVehicleViews(): Observable<{ [vehicleId: number]: number }> {
    return this.getUserVehicles().pipe(
      switchMap(vehicles => {
        if (!vehicles.length) {
          return of({});
        }
        
        const viewRequests = vehicles.map(vehicle => 
          this.getVehicleViews(vehicle.id).pipe(
            map(views => ({ vehicleId: vehicle.id, views }))
          )
        );
        
        return forkJoin(viewRequests).pipe(
          map(results => {
            const viewsMap: { [vehicleId: number]: number } = {};
            results.forEach(result => {
              viewsMap[result.vehicleId] = result.views;
            });
            return viewsMap;
          })
        );
      })
    );
  }

  // Review methods
  addReview(postareId: number, review: Review): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.apiService.post(`Review?postareId=${postareId}&userId=${userId}`, review);
  }

  getReviewsByRating(rating: number): Observable<Review[]> {
    return this.apiService.get<Review[]>(`Review/rating/${rating}`);
  }

  getReviewsByDateAsc(): Observable<Review[]> {
    return this.apiService.get<Review[]>('Review/GetReviewsByDateNewToOld');
  }

  getReviewsByDateDesc(): Observable<Review[]> {
    return this.apiService.get<Review[]>('Review/GetReviewsByDateOldToNew');
  }

  getReviewsByRatingAsc(): Observable<Review[]> {
    return this.apiService.get<Review[]>('Review/GetReviewsByRatingLowToHigh');
  }

  getReviewsByRatingDesc(): Observable<Review[]> {
    return this.apiService.get<Review[]>('Review/GetReviewsByRatingHighToLow');
  }

  // Utility methods
  showBookingSuccess() {
    this.snackBar.openFromComponent(SnackbarComponent, {
      verticalPosition: 'top',
      duration: 3000,
    });
  }

  showSuccessMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showErrorMessage(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  debugVehicleImages(vehicleId: number, imageCount: number = 5) {
    console.log(`=== Vehicle ${vehicleId} Images ===`);
    for (let i = 1; i <= imageCount; i++) {
      const url = this.getVehicleImageUrl(vehicleId, i);
      console.log(`Image ${i}: ${url}`);
    }
    console.log(`Placeholder: ${this.PLACEHOLDER_IMAGE}`);
    console.log('================================');
  }

  /**
   * Cache status methods
   */
  isCacheLoaded(): boolean {
    return this.vehiclesCacheLoaded;
  }

  getCacheAge(): number {
    return Date.now() - this.lastCacheRefresh;
  }

  getCacheStatus(): {loaded: boolean, age: number, expired: boolean, count: number} {
    const age = this.getCacheAge();
    return {
      loaded: this.vehiclesCacheLoaded,
      age: age,
      expired: age > this.CACHE_DURATION,
      count: this.getCachedVehicles().length
    };
  }
}