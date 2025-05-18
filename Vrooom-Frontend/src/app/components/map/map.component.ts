import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehicleService, VehicleLocation } from '../../services/vehicle.service';
import { Router } from '@angular/router';
import { catchError, EMPTY } from 'rxjs';

declare var google: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('mapContainer') mapContainer: ElementRef;
  
  @Input() height: string = '100%';
  @Input() width: string = '100%';
  @Input() centerLat: number = 46.7712; // Cluj-Napoca
  @Input() centerLng: number = 23.6236;
  @Input() zoom: number = 13;
  @Input() specificLocations: VehicleLocation[] = [];
  
  private map: any;
  private markers: any[] = [];
  private infoWindows: any[] = [];
  private googleMapsLoaded = false;
  private locationData: VehicleLocation[] = [];
  
  constructor(
    private vehicleService: VehicleService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadGoogleMapsScript();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (this.map && changes['specificLocations'] && !changes['specificLocations'].firstChange) {
      this.updateMapMarkers();
    }
  }
  
  ngAfterViewInit(): void {
    if (this.googleMapsLoaded) {
      this.initializeMap();
    }
  }
  
  private loadGoogleMapsScript(): void {
    // Check if the Google Maps script is already loaded
    if (window.hasOwnProperty('google') && window['google'].hasOwnProperty('maps')) {
      this.googleMapsLoaded = true;
      if (this.mapContainer) {
        this.initializeMap();
      }
      return;
    }
    
    // Load the Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Define the callback function
    window['initMap'] = () => {
      this.googleMapsLoaded = true;
      if (this.mapContainer) {
        this.initializeMap();
      }
    };
    
    // Add the script to the document
    document.head.appendChild(script);
  }
  
  private initializeMap(): void {
    const mapOptions = {
      center: { lat: this.centerLat, lng: this.centerLng },
      zoom: this.zoom,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: this.getMapStyles()
    };
    
    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);
    
    // Load vehicle locations if no specific locations are provided
    if (!this.specificLocations || this.specificLocations.length === 0) {
      this.loadVehicleLocations();
    } else {
      this.locationData = this.specificLocations;
      this.addMarkersToMap();
    }
  }
  
  private loadVehicleLocations(): void {
    this.vehicleService.getVehicleLocations()
      .pipe(
        catchError(err => {
          console.error('Error loading vehicle locations:', err);
          return EMPTY;
        })
      )
      .subscribe(locations => {
        this.locationData = locations;
        this.addMarkersToMap();
      });
  }
  
  private addMarkersToMap(): void {
    // Clear existing markers
    this.clearMarkers();
    
    if (!this.locationData || this.locationData.length === 0) return;
    
    // Add markers for each location
    this.locationData.forEach((location, index) => {
      if (location.lat && location.lng) {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: this.map,
          title: location.title || `Vehicle ${index + 1}`,
          animation: google.maps.Animation.DROP,
          icon: {
            url: 'assets/images/car-marker.png',
            scaledSize: new google.maps.Size(32, 32)
          }
        });
        
        // Create info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="map-info-window">
              <h3>${location.title || 'Vehicle'}</h3>
              <p>${location.address || 'No address available'}</p>
              <button class="map-info-button" onclick="window.openVehicleDetails(${location.id})">View Details</button>
            </div>
          `
        });
        
        // Add click listener to open info window
        marker.addListener('click', () => {
          this.infoWindows.forEach(window => window.close());
          infoWindow.open(this.map, marker);
        });
        
        this.markers.push(marker);
        this.infoWindows.push(infoWindow);
      }
    });
    
    // Add global function to handle button click
    window['openVehicleDetails'] = (vehicleId: number) => {
      this.router.navigate(['/vehicles', vehicleId]);
    };
    
    // Fit map to show all markers if we have more than one
    if (this.markers.length > 1) {
      this.fitMapToMarkers();
    }
  }
  
  private fitMapToMarkers(): void {
    if (this.markers.length === 0) return;
    
    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    
    this.map.fitBounds(bounds);
    
    // Don't zoom in too far
    const listener = google.maps.event.addListener(this.map, 'idle', () => {
      if (this.map.getZoom() > 16) {
        this.map.setZoom(16);
      }
      google.maps.event.removeListener(listener);
    });
  }
  
  private clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.setMap(null);
    });
    this.markers = [];
    
    this.infoWindows.forEach(window => {
      window.close();
    });
    this.infoWindows = [];
  }
  
  private updateMapMarkers(): void {
    if (this.specificLocations && this.specificLocations.length > 0) {
      this.locationData = this.specificLocations;
    } else {
      this.loadVehicleLocations();
    }
    
    this.addMarkersToMap();
  }
  
  private getMapStyles(): any[] {
    return [
      {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "poi",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "transit",
        "stylers": [
          {
            "visibility": "off"
          }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
          {
            "color": "#c9e9ff"
          }
        ]
      }
    ];
  }
}