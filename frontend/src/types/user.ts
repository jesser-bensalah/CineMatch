import { FavoriteMovie } from "./movie";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  photoUrl: string;
  isActive: boolean;
  role: 'user' | 'admin';
  favorites: FavoriteMovie[];
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  nom: string;
  prenom: string;
  age: number;
  email: string;
  password: string;
  photo?: File;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  userId: string;
  user: Omit<User, 'password'>;
}

export interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
  age: number;
  email: string;
  photoUrl: string;
  favoritesCount: number;
  joinedDate: string;
}