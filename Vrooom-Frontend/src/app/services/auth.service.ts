import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, catchError, throwError, of } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { Router } from '@angular/router';

interface LoginResponse {
  token: string;
  message: string;
}

interface LoginCredentials {
  username: string;
  parola: string;
  remember: boolean;
}

interface RegisterUserData {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate: Date;
  profilePicture: File;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly isAuthenticatedSubject$ = new BehaviorSubject<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSubject$.asObservable();

  constructor(
    private apiService: ApiService,
    private tokenService: TokenService,
    private router: Router
  ) {
    // Initialize authentication state safely
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    try {
      const hasToken = this.hasToken();
      this.isAuthenticatedSubject$.next(hasToken);
      
      // Validate token if it exists
      if (hasToken && !this.tokenService.isTokenExpired()) {
        this.isAuthenticatedSubject$.next(true);
      } else if (hasToken && this.tokenService.isTokenExpired()) {
        // Token expired, clean up
        this.logout();
      }
    } catch (error) {
      console.error('Error initializing auth state:', error);
      this.isAuthenticatedSubject$.next(false);
    }
  }

  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  set isAuthenticated(flag: boolean) {
    this.isAuthenticatedSubject$.next(flag);
  }

  private hasToken(): boolean {
    try {
      const token = this.tokenService.getToken();
      return !!token && token.trim().length > 0;
    } catch (error) {
      console.error('Error checking token:', error);
      return false;
    }
  }

  login(credentials: { username: string, password: string }): Observable<LoginResponse> {
    if (!credentials.username || !credentials.password) {
      return throwError(() => new Error('Username and password are required'));
    }

    const loginData: LoginCredentials = {
      username: credentials.username.trim(),
      parola: credentials.password,
      remember: true
    };

    return this.apiService.post<LoginResponse>('User/login', loginData).pipe(
      tap(response => {
        if (response && response.token) {
          try {
            this.tokenService.setToken(response.token);
            this.isAuthenticated = true;
            console.log('✅ Login successful');
          } catch (error) {
            console.error('Error storing token:', error);
            throw error;
          }
        }
      }),
      catchError(error => {
        console.error('Login error:', error);
        this.isAuthenticated = false;
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterUserData): Observable<any> {
    console.log('🔄 AuthService: Preparing registration data...');
    
    try {
      // Validate required fields
      if (!userData.username || !userData.password || !userData.email) {
        return throwError(() => new Error('Username, password, and email are required'));
      }

      const formData = new FormData();
      
      // Add user data to FormData
      formData.append('username', userData.username.trim());
      formData.append('parola', userData.password);
      formData.append('nume', userData.lastName?.trim() || ''); 
      formData.append('prenume', userData.firstName?.trim() || ''); 
      formData.append('email', userData.email.trim());
      formData.append('nrTelefon', userData.phone?.trim() || '');
      formData.append('carteIdentitate', 'N/A');
      
      // Format birth date for backend
      if (userData.birthDate) {
        const birthDate = new Date(userData.birthDate);
        formData.append('dataNasterii', birthDate.toISOString());
      } else {
        // Default birth date if not provided
        formData.append('dataNasterii', new Date('2000-01-01').toISOString());
      }
      
      // Add profile picture
      if (userData.profilePicture && userData.profilePicture instanceof File) {
        const fileExtension = this.getFileExtension(userData.profilePicture.name);
        const fileName = `${userData.username.trim()}_pfp.${fileExtension}`;
        formData.append('pozaProfil', userData.profilePicture, fileName);
        
        console.log('📁 Profile picture details:', {
          originalName: userData.profilePicture.name,
          s3FileName: fileName,
          size: userData.profilePicture.size,
          type: userData.profilePicture.type
        });
      }

      // Debug FormData contents
      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${this.formatFileSize(value.size)})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Send registration request
      return this.apiService.postFormData('User/register', formData).pipe(
        tap(response => {
          console.log('✅ Registration successful');
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
    } catch (error) {
      console.error('Error preparing registration data:', error);
      return throwError(() => error);
    }
  }

  logout(): void {
    try {
      this.tokenService.removeToken();
      this.isAuthenticated = false;
      console.log('✅ Logout successful');
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      // Force navigation even if there's an error
      this.isAuthenticated = false;
      this.router.navigate(['/login']);
    }
  }

  confirmEmail(username: string, token: string): Observable<any> {
    if (!username || !token) {
      return throwError(() => new Error('Username and token are required'));
    }

    console.log('📧 Confirming email:', { username, tokenLength: token.length });

    return this.apiService.get(
      `User/confirmEmail?username=${encodeURIComponent(username)}&token=${encodeURIComponent(token)}`
    ).pipe(
      tap(response => {
        console.log('✅ Email confirmation response:', response);
      }),
      catchError(error => {
        console.error('❌ Email confirmation error:', error);
        
        // Enhanced error handling
        let errorResponse = {
          error: 'Email confirmation failed',
          details: [],
          invalidToken: false,
          alreadyConfirmed: false
        };

        if (error.error) {
          if (typeof error.error === 'string') {
            errorResponse.error = error.error;
          } else if (error.error.error) {
            errorResponse.error = error.error.error;
            errorResponse.details = error.error.details || [];
            errorResponse.invalidToken = error.error.invalidToken || false;
            errorResponse.alreadyConfirmed = error.error.alreadyConfirmed || false;
          }
        }

        return throwError(() => ({ error: errorResponse }));
      })
    );
  }

  getUserDetails(username: string): Observable<any> {
    if (!username) {
      return throwError(() => new Error('Username is required'));
    }

    return this.apiService.post('User/getUserDetails', username).pipe(
      catchError(error => {
        console.error('Error getting user details:', error);
        return throwError(() => error);
      })
    );
  }

  getUserProfile(username: string): Observable<any> {
    if (!username) {
      return throwError(() => new Error('Username is required'));
    }

    return this.apiService.get(`User/getUser?username=${encodeURIComponent(username)}`).pipe(
      catchError(error => {
        console.error('Error getting user profile:', error);
        // Don't throw error, return empty profile instead
        return of({
          id: 0,
          username: username,
          nume: '',
          prenume: '',
          email: '',
          puncteFidelitate: 0,
          linkPozaProfil: ''
        });
      })
    );
  }

  forgotPassword(username: string, email: string): Observable<any> {
    if (!username || !email) {
      return throwError(() => new Error('Username and email are required'));
    }

    return this.apiService.post('User/forgotPassword', {
      username: username.trim(),
      email: email.trim()
    }).pipe(
      catchError(error => {
        console.error('Forgot password error:', error);
        return throwError(() => error);
      })
    );
  }

  resetPassword(username: string, token: string, password: string): Observable<any> {
    if (!username || !token || !password) {
      return throwError(() => new Error('Username, token, and password are required'));
    }

    return this.apiService.post('User/resetPassword', {
      username: username.trim(),
      token,
      password
    }).pipe(
      catchError(error => {
        console.error('Reset password error:', error);
        return throwError(() => error);
      })
    );
  }

  // Debug method to check user status
  debugUserStatus(username: string): Observable<any> {
    return this.apiService.get(`User/debug-user-status/${encodeURIComponent(username)}`).pipe(
      catchError(error => {
        console.error('Error getting user status:', error);
        return throwError(() => error);
      })
    );
  }

  // Force confirm email (for debugging - remove in production)
  forceConfirmEmail(username: string): Observable<any> {
    return this.apiService.post(`User/force-confirm-email/${encodeURIComponent(username)}`, {}).pipe(
      catchError(error => {
        console.error('Error force confirming email:', error);
        return throwError(() => error);
      })
    );
  }

  // Utility methods
  private getFileExtension(filename: string): string {
    if (!filename) return 'jpg';
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
  }

  private formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Check authentication status
  isLoggedIn(): boolean {
    try {
      return this.hasToken() && !this.tokenService.isTokenExpired();
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }

  // Get current user info safely
  getCurrentUser(): Observable<any> {
    try {
      const username = this.tokenService.getUsername();
      if (username) {
        return this.getUserProfile(username);
      }
      return of(null);
    } catch (error) {
      console.error('Error getting current user:', error);
      return of(null);
    }
  }
}