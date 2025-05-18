import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
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

interface RegisterData {
  username: string;
  parola: string;
  nume: string;
  prenume: string;
  email: string;
  nrTelefon: string;
  dataNasterii: Date;
  pozaProfil: File;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly isAuthenticatedSubject$ = new BehaviorSubject<boolean>(this.hasToken());
  readonly isAuthenticated$ = this.isAuthenticatedSubject$.asObservable();

  constructor(private apiService: ApiService, private router: Router) {}

  get isAuthenticated(): Observable<boolean> {
    return this.isAuthenticated$;
  }

  set isAuthenticated(flag: boolean) {
    this.isAuthenticatedSubject$.next(flag);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  login(credentials: { username: string, password: string }): Observable<LoginResponse> {
    const loginData: LoginCredentials = {
      username: credentials.username,
      parola: credentials.password,
      remember: true
    };

    return this.apiService.post<LoginResponse>('User/login', loginData).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          this.isAuthenticated = true;
        }
      })
    );
  }

  register(userData: any): Observable<any> {
    const formData = new FormData();
    formData.append('username', userData.username);
    formData.append('parola', userData.password);
    formData.append('nume', userData.lastName);
    formData.append('prenume', userData.firstName);
    formData.append('email', userData.email);
    formData.append('nrTelefon', userData.phone || '');
    formData.append('dataNasterii', new Date().toISOString());
    
    if (userData.profilePicture) {
      formData.append('pozaProfil', userData.profilePicture);
    }

    return this.apiService.postFormData('User/register', formData);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }

  confirmEmail(username: string, token: string): Observable<any> {
    return this.apiService.get(`User/confirmEmail?username=${username}&token=${token}`);
  }

  getUserDetails(username: string): Observable<any> {
    return this.apiService.post('User/getUserDetails', { username });
  }

  getUserProfile(username: string): Observable<any> {
    return this.apiService.get(`User/getUser?username=${username}`);
  }
}