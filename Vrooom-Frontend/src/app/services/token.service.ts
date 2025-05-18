import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  id: string;
  exp: number;
  [key: string]: string | number | boolean;
}

const ClaimTypes = {
  NameIdentifier: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  Name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name',
  Email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
  MobilePhone: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/mobilephone',
  Role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
};

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  
  getToken(): string | null {
    return localStorage.getItem('token');
  }
  
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }
  
  removeToken(): void {
    localStorage.removeItem('token');
  }
  
  getDecodedToken(): TokenPayload | null {
    const token = this.getToken();
    if (!token) return null;
    
    try {
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Failed to decode token', error);
      return null;
    }
  }
  
  isTokenExpired(): boolean {
    const decodedToken = this.getDecodedToken();
    if (!decodedToken) return true;
    
    const expirationDate = new Date(0);
    expirationDate.setUTCSeconds(decodedToken.exp);
    
    return expirationDate < new Date();
  }
  
  getUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? decodedToken.id : null;
  }
  
  getUsername(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? String(decodedToken[ClaimTypes.NameIdentifier]) : null;
  }
  
  getRole(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? String(decodedToken[ClaimTypes.Role]) : null;
  }
  
  getFullName(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? String(decodedToken[ClaimTypes.Name]) : null;
  }
  
  getEmail(): string | null {
    const decodedToken = this.getDecodedToken();
    return decodedToken ? String(decodedToken[ClaimTypes.Email]) : null;
  }
}