import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResponse {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsService {
  private readonly DEFAULT_ZOOM = 13;
  private readonly DEFAULT_MAP_SIZE = { width: 600, height: 300 };
  private googleApiKey: string = '';
  
  // Predefined valid colors for vehicle color validation
  private readonly VALID_COLORS = [
    'black', 'white', 'gray', 'grey', 'silver', 'red', 'blue', 'brown',
    'green', 'yellow', 'gold', 'orange', 'beige', 'maroon', 'purple',
    'pink', 'cyan', 'navy', 'teal', 'lime', 'olive', 'aqua', 'fuchsia',
    'bronze', 'charcoal', 'ivory', 'pearl', 'tan', 'crimson', 'indigo',
    'violet', 'turquoise', 'magenta', 'salmon', 'coral', 'khaki'
  ];

  constructor(private apiService: ApiService) {
    this.loadApiKey();
  }

  /**
   * Load Google API key from env.json
   */
  private async loadApiKey(): Promise<void> {
    try {
      const response = await fetch('/env.json');
      const env = await response.json();
      
      // Try different possible key names in your env.json
      this.googleApiKey = env.Google?.ApiKey || 
                         env.GoogleApiKey || 
                         env.GOOGLE_API_KEY || 
                         env.google_api_key || '';
      
      if (!this.googleApiKey) {
        console.warn('Google API key not found in env.json');
      }
    } catch (error) {
      console.error('Failed to load env.json:', error);
    }
  }

  /**
   * Get the API key
   */
  private getApiKey(): string {
    return this.googleApiKey;
  }

  /**
   * Validate and translate color using Google Translate API via your backend
   */
  validateColor(color: string): Observable<string> {
    if (!color || !color.trim()) {
      return throwError(() => new Error('Color cannot be empty'));
    }

    // First check if it's already a valid English color
    const normalizedColor = color.toLowerCase().trim();
    if (this.VALID_COLORS.includes(normalizedColor)) {
      return new Observable(observer => {
        observer.next(normalizedColor);
        observer.complete();
      });
    }

    // Call your backend Google service
    return this.apiService.get<string>(`Google/check?text=${encodeURIComponent(color)}`)
      .pipe(
        map(response => response.toLowerCase().trim()),
        catchError(error => {
          console.error('Color validation failed:', error);
          return throwError(() => new Error(`Invalid color: ${color}`));
        })
      );
  }

  /**
   * Get coordinates from address using your backend
   */
  getCoordinates(location: string): Observable<Coordinates> {
    if (!location || !location.trim()) {
      return throwError(() => new Error('Location cannot be empty'));
    }

    return this.apiService.get<LocationResponse>(`Google/coordinates?location=${encodeURIComponent(location)}`)
      .pipe(
        map(response => ({
          latitude: response.latitude,
          longitude: response.longitude
        })),
        catchError(error => {
          console.error('Geocoding failed:', error);
          return throwError(() => new Error(`Failed to get coordinates for: ${location}`));
        })
      );
  }

  /**
   * Get Google Place ID from address using your backend
   */
  getLocationId(location: string): Observable<string> {
    if (!location || !location.trim()) {
      return throwError(() => new Error('Location cannot be empty'));
    }

    return this.apiService.get<string>(`Google/id?location=${encodeURIComponent(location)}`)
      .pipe(
        catchError(error => {
          console.error('Place ID lookup failed:', error);
          return throwError(() => new Error(`Failed to get place ID for: ${location}`));
        })
      );
  }

  /**
   * Get formatted address from coordinates using your backend
   */
  getLocationFromCoordinates(latitude: number, longitude: number): Observable<string> {
    if (!this.isValidCoordinate(latitude, longitude)) {
      return throwError(() => new Error('Invalid coordinates provided'));
    }

    return this.apiService.get<string>(`Google/location?latitude=${latitude}&longitude=${longitude}`)
      .pipe(
        catchError(error => {
          console.error('Reverse geocoding failed:', error);
          return throwError(() => new Error(`Failed to get location for coordinates: ${latitude}, ${longitude}`));
        })
      );
  }

  /**
   * Generate Google Maps embed URL for iframe
   */
  generateMapsEmbedUrl(location: string, zoom: number = this.DEFAULT_ZOOM): string {
    if (!location || !location.trim()) {
      throw new Error('Location is required for embed URL');
    }

    const encodedLocation = encodeURIComponent(location.trim());
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      console.warn('Google API key not available for embed URL');
      return `https://www.google.com/maps/embed/v1/place?q=${encodedLocation}&zoom=${zoom}`;
    }

    return `https://www.google.com/maps/embed/v1/place?q=${encodedLocation}&zoom=${zoom}&key=${apiKey}`;
  }

  /**
   * Generate static map image URL from coordinates
   */
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
    if (!this.isValidCoordinate(latitude, longitude)) {
      throw new Error('Invalid coordinates for static map');
    }

    const {
      width = this.DEFAULT_MAP_SIZE.width,
      height = this.DEFAULT_MAP_SIZE.height,
      zoom = this.DEFAULT_ZOOM,
      mapType = 'roadmap',
      markerColor = 'red',
      markerLabel = 'A'
    } = options;

    const apiKey = this.getApiKey();
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: zoom.toString(),
      size: `${width}x${height}`,
      maptype: mapType,
      markers: `color:${markerColor}|label:${markerLabel}|${latitude},${longitude}`
    });

    if (apiKey) {
      params.append('key', apiKey);
    }

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate directions URL for Google Maps
   */
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

    return `https://www.google.com/maps/dir/?api=1&${params.toString()}`;
  }

  /**
   * Generate Street View URL
   */
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
    const params = new URLSearchParams({
      size,
      location: locationStr,
      fov: fov.toString(),
      heading: heading.toString(),
      pitch: pitch.toString()
    });

    if (apiKey) {
      params.append('key', apiKey);
    }

    return `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`;
  }

  /**
   * Calculate distance between two points using Haversine formula
   * Returns distance in kilometers
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    if (!this.isValidCoordinate(coord1.latitude, coord1.longitude) || 
        !this.isValidCoordinate(coord2.latitude, coord2.longitude)) {
      throw new Error('Invalid coordinates for distance calculation');
    }

    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    } else if (distanceKm < 100) {
      return `${distanceKm.toFixed(1)} km`;
    } else {
      return `${Math.round(distanceKm)} km`;
    }
  }

  /**
   * Get user's current location using browser geolocation
   */
  getCurrentLocation(): Observable<Coordinates> {
    return new Observable(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          observer.next({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          observer.complete();
        },
        (error) => {
          let errorMessage = 'Failed to get current location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          observer.error(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  /**
   * Check if a color is valid
   */
  isValidColor(color: string): boolean {
    if (!color || typeof color !== 'string') {
      return false;
    }
    return this.VALID_COLORS.includes(color.toLowerCase().trim());
  }

  /**
   * Get list of available colors
   */
  getAvailableColors(): string[] {
    return [...this.VALID_COLORS];
  }

  /**
   * Validate coordinates
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Create bounds for multiple coordinates
   */
  createBounds(coordinates: Coordinates[]): {
    northeast: Coordinates;
    southwest: Coordinates;
    center: Coordinates;
  } | null {
    if (!coordinates || coordinates.length === 0) {
      return null;
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    coordinates.forEach(coord => {
      if (this.isValidCoordinate(coord.latitude, coord.longitude)) {
        minLat = Math.min(minLat, coord.latitude);
        maxLat = Math.max(maxLat, coord.latitude);
        minLng = Math.min(minLng, coord.longitude);
        maxLng = Math.max(maxLng, coord.longitude);
      }
    });

    return {
      northeast: { latitude: maxLat, longitude: maxLng },
      southwest: { latitude: minLat, longitude: minLng },
      center: {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2
      }
    };
  }
}