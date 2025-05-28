import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { VehiclesService } from './vehicles.service';

export interface Booking {
  chirieId: number;
  userId: number;
  postareId: number;
  dataStart: string;
  dataStop: string;
  vehicle?: any;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  ownerInfo?: any;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  constructor(
    private apiService: ApiService,
    private tokenService: TokenService,
    private vehiclesService: VehiclesService
  ) {}

  getUserBookings(): Observable<Booking[]> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    return this.apiService.get<Booking[]>(`Chirie/user/${userId}`);
  }

  getBookingById(id: number): Observable<Booking> {
    return this.apiService.get<Booking>(`Chirie/${id}`);
  }

  cancelBooking(id: number): Observable<any> {
    return this.apiService.delete(`Chirie/${id}`);
  }

  processBookings(bookings: Booking[]): Booking[] {
    const now = new Date();
    
    return bookings.map(booking => {
      const startDate = new Date(booking.dataStart);
      const endDate = new Date(booking.dataStop);
      
      let status: 'upcoming' | 'active' | 'completed' | 'cancelled';
      
      if (startDate > now) {
        status = 'upcoming';
      } else if (endDate < now) {
        status = 'completed';
      } else {
        status = 'active';
      }
      
      return { ...booking, status };
    });
  }
}