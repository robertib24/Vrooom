// Actualizează GoogleMapsService pentru debug și funcționalitate îmbunătățită

import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private readonly DEFAULT_ZOOM = 15;
  private readonly DEFAULT_MAP_SIZE = { width: 600, height: 300 };
  private googleApiKey: string = '';
  
  constructor(private apiService: ApiService) {
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    try {
      // Încearcă să încarce din env.json
      const response = await fetch('/env.json');
      const env = await response.json();
      this.googleApiKey = env.Google?.ApiKey || '';
      
      if (!this.googleApiKey) {
        console.warn('🗺️ Google API key nu a fost găsită în env.json');
        console.log('📋 Pentru a activa hărțile, adaugă cheia API în public/env.json:');
        console.log(`{
  "Google": {
    "ApiKey": "YOUR_API_KEY_HERE"
  }
}`);
      } else {
        console.log('✅ Google API key încărcată cu succes');
      }
    } catch (error) {
      console.error('❌ Nu s-a putut încărca env.json:', error);
      console.log('📋 Creează fișierul public/env.json cu structura:');
      console.log(`{
  "Google": {
    "ApiKey": "YOUR_API_KEY_HERE"
  }
}`);
    }
  }

  private getApiKey(): string {
    return this.googleApiKey;
  }

  // Metodă simplificată pentru a genera URL-uri de map static
  generateStaticMapUrl(
    latitude: number, 
    longitude: number, 
    options: {
      width?: number;
      height?: number;
      zoom?: number;
      mapType?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid';
      markerColor?: string;
      markerLabel?: string;
    } = {}
  ): string {
    const {
      width = this.DEFAULT_MAP_SIZE.width,
      height = this.DEFAULT_MAP_SIZE.height,
      zoom = this.DEFAULT_ZOOM,
      mapType = 'roadmap',
      markerColor = 'red',
      markerLabel = 'A'
    } = options;

    if (!this.isValidCoordinate(latitude, longitude)) {
      console.error('❌ Coordonate invalide pentru hartă:', latitude, longitude);
      return '';
    }

    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('🗺️ Nu se poate genera harta statică fără API key');
      return '';
    }

    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: zoom.toString(),
      size: `${width}x${height}`,
      maptype: mapType,
      markers: `color:${markerColor}|label:${markerLabel}|${latitude},${longitude}`,
      key: apiKey
    });

    const url = `${baseUrl}?${params.toString()}`;
    console.log('🗺️ URL hartă statică generat:', url);
    return url;
  }

  // Metodă pentru Google Maps embed (iframe)
  generateMapsEmbedUrl(location: string, zoom: number = this.DEFAULT_ZOOM): string {
    if (!location || !location.trim()) {
      console.error('❌ Locația este necesară pentru embed URL');
      return '';
    }

    const encodedLocation = encodeURIComponent(location.trim());
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('🗺️ Se folosește embed fără API key (funcționalitate limitată)');
      return `https://www.google.com/maps/embed/v1/place?q=${encodedLocation}&zoom=${zoom}`;
    }

    const url = `https://www.google.com/maps/embed/v1/place?q=${encodedLocation}&zoom=${zoom}&key=${apiKey}`;
    console.log('🗺️ URL embed generat:', url);
    return url;
  }

  // Metodă pentru direcții
  generateDirectionsUrl(
    origin: string | Coordinates, 
    destination: string | Coordinates,
    travelMode: 'driving' | 'walking' | 'transit' | 'bicycling' = 'driving'
  ): string {
    const originStr = typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`;
    const destinationStr = typeof destination === 'string' ? destination : `${destination.latitude},${destination.longitude}`;

    const params = new URLSearchParams({
      origin: originStr,
      destination: destinationStr,
      travelmode: travelMode
    });

    const url = `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
    console.log('🗺️ URL direcții generat:', url);
    return url;
  }

  // Metodă pentru Street View
  generateStreetViewUrl(
    location: string | Coordinates,
    options: {
      size?: string;
      fov?: number;
      heading?: number;
      pitch?: number;
    } = {}
  ): string {
    const {
      size = '600x400',
      fov = 90,
      heading = 0,
      pitch = 0
    } = options;

    const locationStr = typeof location === 'string' 
      ? location 
      : `${location.latitude},${location.longitude}`;

    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('🗺️ Street View necesită API key');
      return '';
    }

    const params = new URLSearchParams({
      size,
      location: locationStr,
      fov: fov.toString(),
      heading: heading.toString(),
      pitch: pitch.toString(),
      key: apiKey
    });

    const url = `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
    console.log('🗺️ URL Street View generat:', url);
    return url;
  }

  // Obține locația curentă a utilizatorului
  getCurrentLocation(): Observable<Coordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation nu este suportată de acest browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log('📍 Locația curentă obținută:', coords);
          observer.next(coords);
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Nu s-a putut obține locația curentă';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Accesul la locație a fost refuzat';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Informațiile de locație nu sunt disponibile';
              break;
            case error.TIMEOUT:
              errorMessage = 'Cererea de locație a expirat';
              break;
          }
          console.warn('📍 Eroare la obținerea locației:', errorMessage);
          observer.error(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  }

  // Validare coordonate
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
  }

  // Metodă pentru debug - verifică dacă API-ul funcționează
  async testApiKey(): Promise<boolean> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.log('❌ Nu există API key pentru testare');
      return false;
    }

    try {
      // Test simplu cu Geocoding API
      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Bucharest&key=${apiKey}`;
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('✅ Google Maps API key funcționează corect');
        return true;
      } else {
        console.error('❌ Eroare la testarea API key:', data.status, data.error_message);
        return false;
      }
    } catch (error) {
      console.error('❌ Eroare la testarea API key:', error);
      return false;
    }
  }
}