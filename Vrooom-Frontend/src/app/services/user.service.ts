import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { SafeUser, User } from '../models/user.models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private apiService: ApiService) { }

  /**
   * Get user details by username
   */
  getUserDetails(username: string): Observable<User> {
    return this.apiService.post<User>('User/getUserDetails', { username });
  }

  /**
   * Get user profile by username (public profile)
   */
  getUserProfile(username: string): Observable<SafeUser> {
    return this.apiService.get<SafeUser>(`User/getUser?username=${username}`);
  }

  /**
   * Get user details by ID
   */
  getUserById(id: number): Observable<User> {
    return this.apiService.get<User>(`User/getById?id=${id}`);
  }

  /**
   * Upload user profile picture
   */
  uploadProfilePicture(username: string, file: File): Observable<boolean> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('pozaProfil', file);
    
    return this.apiService.postFormData<boolean>('User/uploadPhoto', formData);
  }

  /**
   * Upload user document (ID card or driving license)
   */
  uploadDocument(username: string, documentType: 'permis' | 'carteIdentitate', file: File): Observable<any> {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('document', documentType);
    formData.append('file', file);
    
    return this.apiService.postFormData<any>('User/uploadDocument', formData);
  }

  /**
   * Change user password
   */
  changePassword(username: string, oldPassword: string, newPassword: string): Observable<any> {
    const data = {
      username,
      parolaVeche: oldPassword,
      parolaNoua: newPassword
    };
    
    return this.apiService.post<any>('User/changePassword', data);
  }

  /**
   * Forgot password - request password reset
   */
  forgotPassword(username: string, email: string): Observable<any> {
    const data = {
      Username: username,
      Email: email
    };
    
    return this.apiService.post<any>('User/forgotPassword', data);
  }

  /**
   * Reset password with token
   */
  resetPassword(username: string, token: string, newPassword: string): Observable<any> {
    const data = {
      Username: username,
      Token: token,
      Password: newPassword
    };
    
    return this.apiService.post<any>('User/resetPassword', data);
  }
}