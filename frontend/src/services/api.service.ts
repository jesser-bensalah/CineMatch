import axios from 'axios';
import { AdminMovie, AdminUser, FavoriteMovie, MatchingUser, Movie, MovieSearchResponse, PopularMoviesResponse } from '../types/movie';
import { AuthResponse, LoginData } from '../types/user';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {

    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error(' Erreur réseau:', error.message);
   
      return Promise.reject(error);
    }

    //
    if (error.response?.status === 401) {
      console.log(' Erreur d\'authentification détectée');
      
      // Vérifier le message d'erreur du serveur
      const errorMessage = error.response?.data?.message || '';
      
      
      const shouldLogout = 
        errorMessage.includes('Token invalide') ||
        errorMessage.includes('Token expiré') ||
        errorMessage.includes('Utilisateur non trouvé') ||
        errorMessage.includes('Compte désactivé');
      
      if (shouldLogout) {
        console.log(' Déconnexion nécessaire:', errorMessage);
        const currentPath = window.location.pathname;
        
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          
          window.dispatchEvent(new CustomEvent('authStateChange', { 
            detail: { action: 'token_invalid' } 
          }));
        }
      } else {
        console.log(' Erreur 401 non critique, maintien de la session');
      }
    }

   
    if (error.response?.status === 403) {
      console.log('Accès refusé pour cette ressource');
   
    }

    if (error.response?.status >= 500) {
      console.error(' Erreur serveur:', error.response.data);
    }

    return Promise.reject(error);
  }
);


export const authAPI = {
  register: (formData: FormData) =>
    api.post<AuthResponse>('/auth/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    }),

  login: (data: LoginData) =>
    api.post<AuthResponse>('/auth/login', data),

  validateToken: () =>
    api.get('/auth/validate'),
};


export const moviesAPI = {

  addToFavorites: (movieData: {
    movieId: string;
    movieTitle: string;
    moviePoster?: string;
  }) => {
    let cleanedPoster = movieData.moviePoster;
    
    if (cleanedPoster) {
      if (cleanedPoster.includes('https://image.tmdb.org/t/p/w500https://')) {
        cleanedPoster = cleanedPoster.replace('https://image.tmdb.org/t/p/w500https://', 'https://');
      }
      else if (cleanedPoster.includes('cloudinary') && !cleanedPoster.startsWith('http')) {
        cleanedPoster = `https://${cleanedPoster}`;
      }
    }
    
    return api.post<FavoriteMovie>('/movies/favorites', {
      ...movieData,
      moviePoster: cleanedPoster
    });
  },

  removeFromFavorites: (movieId: string) =>
    api.delete(`/movies/favorites/${movieId}`),

  getFavorites: () =>
    api.get<FavoriteMovie[]>('/movies/favorites'),

  
  searchMovies: (query: string, page: number = 1) =>
    api.get<MovieSearchResponse>(`/movies/search?q=${encodeURIComponent(query)}&page=${page}`),

  getPopularMovies: (page: number = 1) =>
    api.get<PopularMoviesResponse>(`/movies/popular?page=${page}`),

  getMovieDetails: (movieId: string) =>
    api.get<Movie>(`/movies/${movieId}`),

  getMatchingUsers: () =>
    api.get<MatchingUser[]>('/movies/matching-users'),

  sendMatchRequest: (targetUserId: string) =>
    api.post(`/movies/match-request/${targetUserId}`),

  respondToMatchRequest: (requestId: string, status: 'accepted' | 'declined') =>
    api.post(`/movies/match-request/${requestId}/respond`, { status }),

  getMatchRequests: () =>
    api.get('/movies/match-requests'),
};


export const adminAPI = {
  
  createMovie: (formData: FormData) =>
    api.post<AdminMovie>('/movies/admin/create', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),

  getMovies: () =>
    api.get<AdminMovie[]>('/movies/admin/list'),

  updateMovie: (movieId: string, data: Partial<AdminMovie>) =>
    api.patch(`/movies/admin/${movieId}`, data),

  deleteMovie: (movieId: string) =>
    api.delete(`/movies/admin/${movieId}`),


  getUsers: () =>
    api.get<AdminUser[]>('/movies/admin/users'),

  toggleUserStatus: (userId: string) =>
    api.post<{ message: string; isActive: boolean }>(`/movies/admin/users/${userId}/toggle-status`),

  getUserDetails: (userId: string) =>
    api.get<AdminUser>(`/movies/admin/users/${userId}`),
    
  updateUser: (userId: string, userData: Partial<AdminUser>) =>
    api.put<AdminUser>(`/auth/admin/users/${userId}`, userData),
};


export const utilsAPI = {
  healthCheck: () =>
    api.get('/health'),

  getAppStats: () =>
    api.get('/stats'),
};