export interface Vehicle {
  id: number;
  userId: number;
  titlu: string;
  descriere: string;
  pret: number;
  firma: string;
  model: string;
  kilometraj: number;
  anFabricatie: number;
  talon: string;
  carteIdentitateMasina: string;
  culoare: string;
  asigurare: string;
  locatie: string;
  locatie_formala: string;
  linkMaps: string;
  imagini?: File[]; // For POST requests only
}

export interface Review {
  titlu: string;
  comentariu: string;
  rating: number;
  dataReview: Date;
}

export interface Booking {
  userId?: number;
  postareId: number;
  dataStart: Date;
  dataStop: Date;
}

export interface Card {
  userId: number;
  numar: string;
  dataExpirare: Date;
  nume: string;
  cvv: number;
}

export interface Support {
  supportId: number;
  titlu: string;
  comentariu: string;
  userId: number;
}

export interface OpenAIRequest {
  prompt: string;
}

export interface OpenAIResponse {
  prompt: string;
}