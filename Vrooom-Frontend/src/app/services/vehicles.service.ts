import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class VehiclesService {
  getVehicles() {
    return [
      {
        model: 'Tesla Model 3',
        description: 'Electric, fast, and eco-friendly.',
        pricePerDay: 89,
        image:
          'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        model: 'BMW 5 Series',
        description: 'Luxury and comfort for business trips.',
        pricePerDay: 109,
        image:
          'https://images.unsplash.com/photo-1650369446487-88da5c2ca105?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        model: 'Ford Mustang',
        description: 'Classic power and iconic style.',
        pricePerDay: 120,
        image:
          'https://images.unsplash.com/photo-1547744152-14d985cb937f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        model: 'Ducati Panigale V4',
        description: 'Wild young and free.',
        pricePerDay: 189,
        image:
          'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        model: 'Ford Mustang',
        description: 'Classic power and iconic style.',
        pricePerDay: 120,
        image:
          'https://images.unsplash.com/photo-1547744152-14d985cb937f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        model: 'BMW 5 Series',
        description: 'Luxury and comfort for business trips.',
        pricePerDay: 109,
        image:
          'https://images.unsplash.com/photo-1650369446487-88da5c2ca105?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
      {
        model: 'Ford Mustang',
        description: 'Classic power and iconic style.',
        pricePerDay: 120,
        image:
          'https://images.unsplash.com/photo-1547744152-14d985cb937f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      },
    ];
  }
}
