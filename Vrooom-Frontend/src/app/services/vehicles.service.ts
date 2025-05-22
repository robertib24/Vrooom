import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
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

  constructor(
    private apiService: ApiService, 
    private snackBar: MatSnackBar,
    private tokenService: TokenService
  ) {}

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

  addVehicle(vehicleData: any, images: File[]): Observable<number> {
    const formData = new FormData();
    
    Object.keys(vehicleData).forEach(key => {
      if (vehicleData[key] !== null && vehicleData[key] !== undefined) {
        if (key === 'dataNasterii' || key === 'dataStart' || key === 'dataStop') {
          formData.append(key, vehicleData[key].toISOString());
        } else {
          formData.append(key, vehicleData[key].toString());
        }
      }
    });

    images.forEach((image, index) => {
      formData.append('imagini', image, `image_${index}.${image.name.split('.').pop()}`);
    });

    return this.apiService.postFormData<number>('Postare', formData);
  }

  deleteVehicle(id: number): Observable<any> {
    return this.apiService.delete(`Postare/${id}`);
  }

  updateVehicle(id: number, vehicleData: any): Observable<any> {
    return this.apiService.put(`Postare/${id}`, vehicleData);
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

  sendBookingConfirmation(booking: Booking): Observable<any> {
    return this.apiService.post('Chirie/rentConfirmationEmail', booking);
  }

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
  getVehicleImageUrl(vehicleId: number, imageIndex: number = 1): string {
    return `https://vrooom1224.s3.amazonaws.com/post${vehicleId}/${imageIndex}.jpg`;
  }

  getVehicleImages(vehicleId: number, imageCount: number = 1): string[] {
    const images: string[] = [];
    for (let i = 1; i <= imageCount; i++) {
      images.push(this.getVehicleImageUrl(vehicleId, i));
    }
    return images;
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
}