import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { SupportTicket } from './support.service';

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

  // Support Management
  getAllSupportTickets(): Observable<SupportTicket[]> {
    return this.apiService.get<SupportTicket[]>('Admin/support-tickets');
  }

  adminReplyToTicket(supportId: number, reply: string): Observable<any> {
    const userId = this.tokenService.getUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const replyData = {
      supportId,
      titlu: 'Admin Reply',
      comentariu: reply,
      userId: parseInt(userId)
    };

    return this.apiService.post(`Admin/support-tickets/${supportId}/reply`, replyData);
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

  // Validation and Security
  validateAdminAccess(): Observable<boolean> {
    return this.apiService.get<boolean>('Admin/validate-access');
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