import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Support } from '../models/other.models';

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  constructor(private apiService: ApiService) { }

  /**
   * Create a new support ticket
   */
  createSupportTicket(supportData: { userId: number, titlu: string, comentariu: string }): Observable<any> {
    return this.apiService.post<any>('Support', supportData);
  }

  /**
   * Reply to a support ticket
   */
  replySupportTicket(supportData: { userId: number, supportId: number, titlu: string, comentariu: string }): Observable<any> {
    return this.apiService.post<any>('Support/reply', supportData);
  }

  /**
   * Get all support tickets (admin only)
   */
  getAllSupportTickets(): Observable<Support[]> {
    return this.apiService.get<Support[]>('Support');
  }

  /**
   * Get support tickets for a specific user
   */
  getUserSupportTickets(userId: number): Observable<Support[]> {
    return this.apiService.get<Support[]>(`Support/SupportByUserId/${userId}`);
  }

  /**
   * Get a specific support ticket thread by ID
   */
  getSupportTicketById(supportId: number): Observable<Support[]> {
    return this.apiService.get<Support[]>(`Support/SupportBySupportId/${supportId}`);
  }

  /**
   * Send email notification to user for a support ticket reply
   */
  sendReplyEmail(supportData: Support): Observable<any> {
    return this.apiService.post<any>('Support/ReplyEmail', supportData);
  }

  /**
   * Send email notification to admin for a new support ticket
   */
  sendAdminEmail(supportData: Support): Observable<any> {
    return this.apiService.post<any>('Support/CreateEmail', supportData);
  }
}