// Updated support.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';

export interface SupportTicket {
  supportId: number;
  titlu: string;
  comentariu: string;
  userId: number;
  status?: string;
  createdAt?: Date | string;
  resolvedAt?: Date | string; 
  resolvedByUserId?: number; 
  resolvedByUserName?: string; 
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
      titlu: '', // Empty title for replies
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

  // Additional methods for enhanced support management
  updateTicketStatus(supportId: number, status: string): Observable<any> {
    return this.apiService.put(`Support/${supportId}/status`, { status });
  }

  escalateTicket(supportId: number): Observable<any> {
    return this.apiService.post(`Support/${supportId}/escalate`, {});
  }

  assignTicket(supportId: number, assignedToUserId: number): Observable<any> {
    return this.apiService.put(`Support/${supportId}/assign`, { assignedToUserId });
  }

  addTicketNote(supportId: number, note: string): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return this.apiService.post(`Support/${supportId}/note`, {
      note,
      userId: parseInt(userId)
    });
  }

  getTicketHistory(supportId: number): Observable<any[]> {
    return this.apiService.get<any[]>(`Support/${supportId}/history`);
  }

  bulkUpdateTickets(supportIds: number[], action: string, value?: any): Observable<any> {
    return this.apiService.post('Support/bulk-update', {
      supportIds,
      action,
      value
    });
  }

  getTicketStatistics(): Observable<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    byPriority: { [key: string]: number };
    byUser: { [key: string]: number };
  }> {
    return this.apiService.get('Support/statistics');
  }

  searchTickets(searchParams: {
    query?: string;
    status?: string;
    priority?: string;
    userId?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Observable<SupportTicket[]> {
    const params = new URLSearchParams();
    
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    return this.apiService.get<SupportTicket[]>(`Support/search?${params.toString()}`);
  }

  /*exportTickets(format: 'csv' | 'excel' = 'csv', filters?: any): Observable<Blob> {
    const params = new URLSearchParams();
    params.append('format', format);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    return this.apiService.get(`Support/export?${params.toString()}`, { responseType: 'blob' }) as Observable<Blob>;
  }*/
}