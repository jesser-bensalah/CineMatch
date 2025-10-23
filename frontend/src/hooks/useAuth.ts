import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api.service';
import { RegisterData, LoginData, AuthResponse, User } from '../types/user';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  register: (data: RegisterData) => Promise<AuthResponse>;
  login: (data: LoginData) => Promise<AuthResponse>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          
          if (!isExpired) {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            console.log('User loaded from storage:', parsedUser.email);
          } else {
            console.log(' Token expired, clearing storage');
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
          }
        } catch (err) {
          console.error(' Error parsing token or user data:', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      } else {
        console.log(' No auth data in storage');
      }
      
      setInitialized(true);
    };

    initializeAuth();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('nom', data.nom);
      formData.append('prenom', data.prenom);
      formData.append('age', data.age.toString());
      formData.append('email', data.email);
      formData.append('password', data.password);
      
      if (data.photo) {
        formData.append('photo', data.photo);
      }

      console.log(' Starting registration...');
      const response = await authAPI.register(formData);
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      console.log(' Registration successful, user:', response.data.user.email);
      
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { action: 'register' } 
      }));
      
      return response.data;
    } catch (err: any) {
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error(' Registration error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginData): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(' Starting login...');
      const response = await authAPI.login(data);
      
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      
      console.log('Login successful, user:', response.data.user.email);
      console.log(' Token saved:', !!response.data.access_token);
      
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { action: 'login', user: response.data.user } 
      }));
      
      return response.data;
    } catch (err: any) {
      let errorMessage = 'Erreur lors de la connexion';
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.error(' Login error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log(' Logging out...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { action: 'logout' } 
    }));
  }, []);

  return {
    user,
    loading: loading || !initialized,
    error,
    register,
    login,
    logout,
    clearError,
    isAuthenticated: !!user && !!localStorage.getItem('access_token'),
  };
};