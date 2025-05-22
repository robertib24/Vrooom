import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

export interface SupportTicket {
  supportId: number;
  titlu: string;
  comentariu: string;
  userId: number;
}

export interface CreateSupportTicket {
  titlu: string;
  comentariu: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class SupportService {
  constructor(
    private apiService: ApiService,
    private tokenService: TokenService
  ) {}

  createSupportTicket(ticket: Omit<CreateSupportTicket, 'userId'>): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const supportTicket: CreateSupportTicket = {
      ...ticket,
      userId: parseInt(userId)
    };

    return this.apiService.post('Support', supportTicket);
  }

  replySupportTicket(supportId: number, reply: string): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const replyTicket: SupportTicket = {
      supportId,
      titlu: '',
      comentariu: reply,
      userId: parseInt(userId)
    };

    return this.apiService.post('Support/reply', replyTicket);
  }

  // admin only
  getAllSupportTickets(): Observable<SupportTicket[]> {
    return this.apiService.get<SupportTicket[]>('Support');
  }

  getSupportTicketsByUserId(): Observable<SupportTicket[]> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }
    
    return this.apiService.get<SupportTicket[]>(`Support/SupportByUserId/${userId}`);
  }

  getSupportTicketsBySupportId(supportId: number): Observable<SupportTicket[]> {
    return this.apiService.get<SupportTicket[]>(`Support/SupportBySupportId/${supportId}`);
  }

  sendSupportCreatedEmail(supportTicket: SupportTicket): Observable<any> {
    return this.apiService.post('Support/CreateEmail', supportTicket);
  }

  sendSupportReplyEmail(supportTicket: SupportTicket): Observable<any> {
    return this.apiService.post('Support/ReplyEmail', supportTicket);
  }
}