import { Injectable } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { ApiService } from './api.service'  ;
import { TokenService } from './token.service';
import { SupportTicket } from './support.service';
import { catchError, tap } from 'rxjs/operators';

export interface AdminVehicle {
  id: number;
  userId: number;
  titlu: string;
  descriere: string;
  pret: number;
  firma: string;
  model: string;
  kilometraj: number;
  anFabricatie: number;
  culoare: string;
  locatie: string;
  status: 'active' | 'suspended' | 'pending';
  createdDate: string;
  ownerName: string;
  ownerEmail: string;
  nrImagini?: number;
}

export interface AdminUser {
  id: number;
  nume: string;
  prenume: string;
  username: string;
  email: string;
  nrTelefon: string;
  role: string;
  joinDate: string;
  linkPozaProfil: string;
  puncteFidelitate: number;
  vehicleCount: number;
  status: 'active' | 'suspended';
  lastLogin?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalVehicles: number;
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  activeVehicles: number;
  pendingVehicles: number;
  newUsersThisMonth: number;
  newVehiclesThisMonth: number;
  topBrands: { brand: string; count: number; }[];
  recentActivity: {
    type: 'user_registration' | 'vehicle_listing' | 'booking' | 'review';
    description: string;
    timestamp: string;
    userId?: number;
    userName?: string;
  }[];
}

export interface AdminVehiclesResponse {
  vehicles: AdminVehicle[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(
    private apiService: ApiService,
    private tokenService: TokenService
  ) {}

  isAdmin(): boolean {
    const role = this.tokenService.getRole();
    return role === 'Admin';
  }

  // Admin Statistics
  getAdminStats(): Observable<AdminStats> {
    return this.apiService.get<AdminStats>('Admin/stats');
  }

  // Vehicle Management
  getAllVehicles(
    page: number = 0,
    pageSize: number = 10,
    search: string = '',
    status: string = 'all'
  ): Observable<AdminVehiclesResponse> {
    let endpoint = `Admin/vehicles?page=${page}&pageSize=${pageSize}`;
    
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    
    if (status !== 'all') {
      endpoint += `&status=${status}`;
    }
    
    return this.apiService.get<AdminVehiclesResponse>(endpoint);
  }

  deleteVehicle(vehicleId: number): Observable<any> {
    return this.apiService.delete(`Admin/vehicles/${vehicleId}`);
  }

  updateVehicleStatus(vehicleId: number, status: 'active' | 'suspended'): Observable<any> {
    return this.apiService.put(`Admin/vehicles/${vehicleId}/status`, { status });
  }

  getVehicleDetails(vehicleId: number): Observable<AdminVehicle> {
    return this.apiService.get<AdminVehicle>(`Admin/vehicles/${vehicleId}`);
  }

  // User Management
  getAllUsers(
    page: number = 0,
    pageSize: number = 10,
    search: string = ''
  ): Observable<AdminUsersResponse> {
    let endpoint = `Admin/users?page=${page}&pageSize=${pageSize}`;
    
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    
    return this.apiService.get<AdminUsersResponse>(endpoint);
  }

  updateUserRole(userId: number, role: string): Observable<any> {
    return this.apiService.put(`Admin/users/${userId}/role`, { role });
  }

  suspendUser(userId: number): Observable<any> {
    return this.apiService.put(`Admin/users/${userId}/suspend`, {});
  }

  unsuspendUser(userId: number): Observable<any> {
    return this.apiService.put(`Admin/users/${userId}/unsuspend`, {});
  }

  getUserDetails(userId: number): Observable<AdminUser> {
    return this.apiService.get<AdminUser>(`Admin/users/${userId}`);
  }

  deleteUser(userId: number): Observable<any> {
    return this.apiService.delete(`Admin/users/${userId}`);
  }

  validateUserDeletion(userId: number): Observable<{canDelete: boolean, reason?: string, warnings?: string[]}> {
    return this.apiService.get(`Admin/users/${userId}/validate-deletion`);
  }

  getAllSupportTickets(): Observable<SupportTicket[]> {
    return this.apiService.get<SupportTicket[]>('Admin/support-tickets');
  }

  adminReplyToTicket(supportId: number, reply: string): Observable<any> {
  const userId = this.tokenService.getUserId();
  if (!userId) {
    throw new Error('Admin not authenticated');
  }

  const replyData = {
    supportId: supportId,
    titlu: 'Admin Reply',
    comentariu: reply,
    userId: parseInt(userId) 
  };

  console.log('📤 Sending admin reply:', replyData);
  console.log('🔑 Admin user ID:', userId);

  return this.apiService.post(`Admin/support-tickets/${supportId}/reply`, replyData).pipe(
    tap(response => {
      console.log('✅ Admin reply API response:', response);
    }),
    catchError(error => {
      console.error('❌ Admin reply API error:', error);
      return throwError(() => error);
    })
  );
}

  resolveTicket(supportId: number): Observable<any> {
  console.log(`🔧 Resolving ticket ${supportId}`);
  
  return this.apiService.post(`Admin/support-tickets/${supportId}/resolve`, {}).pipe(
    tap(response => {
      console.log('✅ Ticket resolved successfully:', response);
    }),
    catchError(error => {
      console.error('❌ Error resolving ticket:', error);
      return throwError(() => error);
    })
  );
}

  getTicketStatus(supportId: number): Observable<any> {
  return this.apiService.get(`Admin/support-tickets/${supportId}/status`).pipe(
    tap(response => {
      console.log(`📊 Ticket ${supportId} status:`, response);
    }),
    catchError(error => {
      console.error(`❌ Error getting ticket ${supportId} status:`, error);
      return throwError(() => error);
    })
  );
}

  reopenTicket(supportId: number): Observable<any> {
  return this.apiService.post(`Admin/support-tickets/${supportId}/reopen`, {});
}

  closeTicket(supportId: number, reason?: string): Observable<any> {
  const data = reason ? { reason } : {};
  return this.apiService.post(`Admin/support-tickets/${supportId}/close`, data);
}

  getAllSupportTicketsWithFilter(status?: string): Observable<SupportTicket[]> {
  let endpoint = 'Admin/support-tickets';
  if (status && status !== 'all') {
    endpoint += `?status=${status}`;
  }
  return this.apiService.get<SupportTicket[]>(endpoint);
}
  
  bulkResolveTickets(supportIds: number[]): Observable<any> {
  return this.apiService.post('Admin/support-tickets/bulk-resolve', { supportIds });
}

  getSupportStatistics(): Observable<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  avgResponseTime: number;
  avgResolutionTime: number;
}> {
  return this.apiService.get('Admin/support-tickets/statistics');
}

  // Booking Management
  getAllBookings(
    page: number = 0,
    pageSize: number = 10,
    status: string = 'all'
  ): Observable<any> {
    let endpoint = `Chirie?page=${page}&pageSize=${pageSize}`;
    
    if (status !== 'all') {
      endpoint += `&status=${status}`;
    }
    
    return this.apiService.get(endpoint);
  }

  cancelBooking(bookingId: number, reason: string): Observable<any> {
    return this.apiService.delete(`Chirie/${bookingId}`);
  }

  // System Settings
  getSystemSettings(): Observable<any> {
    return this.apiService.get('Admin/settings');
  }

  updateSystemSettings(settings: any): Observable<any> {
    return this.apiService.put('Admin/settings', settings);
  }

  // Reports
  getRevenueReport(startDate: string, endDate: string): Observable<any> {
    return this.apiService.get(`Admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`);
  }

  getActivityReport(startDate: string, endDate: string): Observable<any> {
    return this.apiService.get(`Admin/reports/activity?startDate=${startDate}&endDate=${endDate}`);
  }

  getPopularVehiclesReport(): Observable<any> {
    return this.apiService.get('Admin/reports/popular-vehicles');
  }

  validateAdminAccess(): Observable<boolean> {
  const role = this.tokenService.getRole();
  const isAdmin = role === 'Admin';
  
  console.log('🔐 Admin access validation:', {
    role: role,
    isAdmin: isAdmin,
    userId: this.tokenService.getUserId()
  });
  
  return of(isAdmin);
}

  getSecurityLogs(page: number = 0, pageSize: number = 50): Observable<any> {
    return this.apiService.get(`Admin/security-logs?page=${page}&pageSize=${pageSize}`);
  }

  // Platform maintenance
  clearCache(): Observable<any> {
    return this.apiService.post('Admin/clear-cache', {});
  }

  sendBulkNotification(notification: {
    title: string;
    message: string;
    userIds?: number[];
    sendToAll?: boolean;
  }): Observable<any> {
    return this.apiService.post('Admin/bulk-notification', notification);
  }
}