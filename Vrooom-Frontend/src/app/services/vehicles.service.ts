import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarComponent } from '../components/snackbar/snackbar.component';

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
}

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  constructor(private apiService: ApiService, private _snackBar: MatSnackBar) {}

  getVehicles(): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>('Postare');
  }

  getVehicleById(id: number): Observable<Vehicle> {
    return this.apiService.get<Vehicle>(`Postare/carid/${id}`);
  }

  getVehiclesByUserId(userId: number): Observable<Vehicle[]> {
    return this.apiService.get<Vehicle[]>(`Postare/userId?userId=${userId}`);
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

  addVehicle(vehicle: any, images: File[]): Observable<number> {
    const formData = new FormData();
    
    formData.append('userId', vehicle.userId.toString());
    formData.append('titlu', vehicle.titlu);
    formData.append('descriere', vehicle.descriere);
    formData.append('pret', vehicle.pret.toString());
    formData.append('firma', vehicle.firma);
    formData.append('model', vehicle.model);
    formData.append('kilometraj', vehicle.kilometraj.toString());
    formData.append('anFabricatie', vehicle.anFabricatie.toString());
    formData.append('culoare', vehicle.culoare);
    formData.append('locatie', vehicle.locatie);

    images.forEach((image, index) => {
      formData.append(`imagini`, image);
    });

    if (vehicle.talonFile) {
      formData.append('talon', vehicle.talonFile);
    }
    if (vehicle.carteIdentitateFile) {
      formData.append('carteIdentitateMasina', vehicle.carteIdentitateFile);
    }
    if (vehicle.asigurareFile) {
      formData.append('asigurare', vehicle.asigurareFile);
    }

    return this.apiService.postFormData<number>('Postare', formData);
  }

  deleteVehicle(id: number): Observable<any> {
    return this.apiService.delete(`Postare/${id}`);
  }

  bookVehicle(vehicleId: number, slot: { start: Date, end: Date }): Observable<any> {
    const bookingData = {
      postareId: vehicleId,
      dataStart: slot.start,
      dataStop: slot.end,
    };

    return this.apiService.post('Chirie', bookingData);
  }

  showBookingSuccess() {
    this._snackBar.openFromComponent(SnackbarComponent, {
      verticalPosition: 'top',
      duration: 3000,
    });
  }
}