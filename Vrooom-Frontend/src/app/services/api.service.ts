import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError, timer, MonoTypeOperatorFunction } from 'rxjs';
import { retry, retryWhen, delayWhen, take, concat, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(),
    }).pipe(
      this.handleRetry<T>(),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders(),
    }).pipe(
      this.handleRetry<T>(),
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders(),
    }).pipe(
      this.handleRetry<T>(),
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(),
    }).pipe(
      this.handleRetry<T>(),
      catchError(this.handleError)
    );
  }

  postFormData<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, formData).pipe(
      this.handleRetry<T>(),
      catchError(this.handleError)
    );
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  private handleRetry<T>(): MonoTypeOperatorFunction<T> {
    return retryWhen(errors =>
      errors.pipe(
        delayWhen(() => timer(1000)), // Delay între retry-uri
        take(2), // Max 2 retry-uri
        concat(throwError(() => 'Maximum retry attempts reached'))
      )
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    // Nu loga erorile de conexiune în development pentru a păstra consola curată
    if (environment.production || error.status !== 0) {
      console.error('API Error:', {
        status: error.status,
        message: error.message,
        url: error.url
      });
    }

    // Returnează o eroare user-friendly
    let errorMessage = 'Something went wrong. Please try again.';
    
    if (error.status === 0) {
      // Eroare de conexiune
      if (environment.production) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized. Please log in again.';
    } else if (error.status === 403) {
      errorMessage = 'Access denied.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    return throwError(() => ({
      ...error,
      userMessage: errorMessage
    }));
  };
}