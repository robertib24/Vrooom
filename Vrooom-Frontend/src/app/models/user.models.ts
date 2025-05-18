export interface User {
  id: number;
  username: string;
  email: string;
  nume: string;
  prenume: string;
  nrTelefon: string;
  permis: boolean;
  carteIdentitate: boolean;
  dataNasterii: Date;
  linkPozaProfil: string;
  puncteFidelitate: number;
}

export interface SafeUser {
  id: number;
  nume: string;
  prenume: string;
  username: string;
  nrTelefon: string;
  linkPozaProfil: string;
  dataNasterii: Date;
  nrPostari: number;
}

export interface LoginDTO {
  username: string;
  parola: string;
  remember: boolean;
}

export interface RegisterDTO {
  username: string;
  parola: string;
  nume: string;
  prenume: string;
  email: string;
  nrTelefon: string;
  dataNasterii: Date;
  pozaProfil: File;
}

export interface ForgotPasswordDTO {
  username: string;
  email: string;
}

export interface ResetPasswordDTO {
  username: string;
  token: string;
  password: string;
}

export interface UserChangePassDTO {
  username: string;
  parolaVeche: string;
  parolaNoua: string;
}