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
  private readonly TOKEN_KEY = 'token';
  
  getToken(): string | null {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available');
        return null;
      }
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token from localStorage:', error);
      return null;
    }
  }
  
  setToken(token: string): void {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available');
        return;
      }
      if (!token || token.trim().length === 0) {
        console.warn('Attempting to set empty token');
        return;
      }
      localStorage.setItem(this.TOKEN_KEY, token);
      console.log('✅ Token stored successfully');
    } catch (error) {
      console.error('Error storing token in localStorage:', error);
      throw error;
    }
  }
  
  removeToken(): void {
    try {
      if (typeof localStorage === 'undefined') {
        console.warn('localStorage is not available');
        return;
      }
      localStorage.removeItem(this.TOKEN_KEY);
      console.log('✅ Token removed successfully');
    } catch (error) {
      console.error('Error removing token from localStorage:', error);
    }
  }
  
  getDecodedToken(): TokenPayload | null {
    try {
      const token = this.getToken();
      if (!token) {
        return null;
      }
      
      return jwtDecode<TokenPayload>(token);
    } catch (error) {
      console.error('Failed to decode token:', error);
      // If token is invalid, remove it
      this.removeToken();
      return null;
    }
  }
  
  isTokenExpired(): boolean {
    try {
      const decodedToken = this.getDecodedToken();
      if (!decodedToken || !decodedToken.exp) {
        return true;
      }
      
      const expirationDate = new Date(0);
      expirationDate.setUTCSeconds(decodedToken.exp);
      
      const isExpired = expirationDate < new Date();
      if (isExpired) {
        console.log('Token has expired, removing...');
        this.removeToken();
      }
      
      return isExpired;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
  
  getUserId(): string | null {
    try {
      const decodedToken = this.getDecodedToken();
      return decodedToken ? decodedToken.id : null;
    } catch (error) {
      console.error('Error getting user ID from token:', error);
      return null;
    }
  }
  
  getUsername(): string | null {
    try {
      const decodedToken = this.getDecodedToken();
      if (!decodedToken) return null;
      
      return decodedToken[ClaimTypes.NameIdentifier] ? 
        String(decodedToken[ClaimTypes.NameIdentifier]) : null;
    } catch (error) {
      console.error('Error getting username from token:', error);
      return null;
    }
  }
  
  getRole(): string | null {
    try {
      const decodedToken = this.getDecodedToken();
      if (!decodedToken) return null;
      
      return decodedToken[ClaimTypes.Role] ? 
        String(decodedToken[ClaimTypes.Role]) : null;
    } catch (error) {
      console.error('Error getting role from token:', error);
      return null;
    }
  }
  
  getFullName(): string | null {
    try {
      const decodedToken = this.getDecodedToken();
      if (!decodedToken) return null;
      
      return decodedToken[ClaimTypes.Name] ? 
        String(decodedToken[ClaimTypes.Name]) : null;
    } catch (error) {
      console.error('Error getting full name from token:', error);
      return null;
    }
  }
  
  getEmail(): string | null {
    try {
      const decodedToken = this.getDecodedToken();
      if (!decodedToken) return null;
      
      return decodedToken[ClaimTypes.Email] ? 
        String(decodedToken[ClaimTypes.Email]) : null;
    } catch (error) {
      console.error('Error getting email from token:', error);
      return null;
    }
  }

  // Utility method to check if token is valid
  isTokenValid(): boolean {
    try {
      const token = this.getToken();
      if (!token) return false;
      
      const decodedToken = this.getDecodedToken();
      if (!decodedToken) return false;
      
      return !this.isTokenExpired();
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }

  // Debug method
  logTokenInfo(): void {
    try {
      const token = this.getToken();
      if (!token) {
        console.log('🔍 No token found');
        return;
      }

      const decoded = this.getDecodedToken();
      if (!decoded) {
        console.log('🔍 Token found but cannot decode');
        return;
      }

      console.log('🔍 Token Info:', {
        userId: this.getUserId(),
        username: this.getUsername(),
        role: this.getRole(),
        email: this.getEmail(),
        expired: this.isTokenExpired(),
        exp: new Date(decoded.exp * 1000).toISOString()
      });
    } catch (error) {
      console.error('Error logging token info:', error);
    }
  }
}