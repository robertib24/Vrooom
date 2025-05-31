import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
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
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([]);
  public vehicles$ = this.vehiclesSubject.asObservable();

  private readonly S3_BUCKET_URL = 'https://vrooom1224.s3.amazonaws.com';
  private readonly PLACEHOLDER_IMAGE = `${this.S3_BUCKET_URL}/placeholder.png`;

  constructor(
    private apiService: ApiService, 
    private snackBar: MatSnackBar,
    private tokenService: TokenService
  ) {}

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

    return this.apiService.postFormData<number>('Postare', formData);
  }

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

  getVehicleImagesWithFallback(vehicleId: number, maxImages: number = 10): string[] {
    const images: string[] = [];
    const extensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    for (let i = 1; i <= maxImages; i++) {
      const imageUrl = `${this.S3_BUCKET_URL}/post${vehicleId}/${i}.jpg`;
      images.push(imageUrl);
    }
    
    return images;
  }

  async checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  getPlaceholderImageUrl(): string {
    return this.PLACEHOLDER_IMAGE;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getVehicles(): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>('Postare');
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`Postare/carid/${id}`);
  }

  getVehiclesByUserId(userId: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/userId?userId=${userId}`);
  }

  getUserVehicles(): Observable<Vehicle[]> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.getVehiclesByUserId(parseInt(userId));
  }

  deleteVehicle(id: number): Observable<any> {
    return this.apiService.delete(`Postare/${id}`);
  }

  updateVehicle(id: number, vehicleData: any): Observable<any> {
    return this.apiService.put(`Postare/${id}`, vehicleData);
  }

  getVehiclesByPrice(minPrice: number, maxPrice: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/pret/${minPrice}/${maxPrice}`);
  }

  getVehiclesByKm(minKm: number, maxKm: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/km/${minKm}/${maxKm}`);
  }

  getVehiclesByYear(minYear: number, maxYear: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/an/${minYear}/${maxYear}`);
  }

  getVehiclesByMake(make: string): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/firma/${make}`);
  }

  getVehiclesByModel(model: string): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/model/${model}`);
  }

  getVehiclesByTitle(title: string): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/titlu/${title}`);
  }

  searchVehiclesWithAI(query: string): Observable<Vehicle[]> {
    return this.apiService.post<Vehicle[]>('OpenAI/getCars', { prompt: query });
  }

  enhanceDescription(description: string): Observable<{prompt: string}> {
    return this.apiService.post<{prompt: string}>('OpenAI/getdescription', { prompt: description });
  }

  bookVehicle(vehicleId: number, bookingData: { start: Date, end: Date }): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const booking: Booking = {
      userId: parseInt(userId),
      postareId: vehicleId,
      dataStart: bookingData.start,
      dataStop: bookingData.end
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

  getVehicleViews(vehicleId: number): Observable<number> {
    // momentan e random
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

  refreshVehicles() {
    this.getVehicles().subscribe({
      next: (vehicles) => {
        this.vehiclesSubject.next(vehicles);
      },
      error: (error) => {
        console.error('Error refreshing vehicles:', error);
        this.showErrorMessage('Failed to refresh vehicles');
      }
    });
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
}