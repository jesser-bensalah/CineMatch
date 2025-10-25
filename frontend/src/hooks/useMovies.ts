import { useState, useEffect, useCallback } from 'react';
import { moviesAPI, adminAPI } from '../services/api.service';
import { Movie, FavoriteMovie, MatchingUser, AdminUser, AdminMovie } from '../types/movie';

interface UseMoviesReturn {

  favorites: FavoriteMovie[];
  searchResults: Movie[];
  popularMovies: Movie[];
  matchingUsers: MatchingUser[];
  adminUsers: AdminUser[];
  adminMovies: AdminMovie[];
  loading: boolean;
  error: string | null;

  addFavorite: (movie: Movie) => Promise<boolean>;
  removeFavorite: (movieId: string) => Promise<void>;
  searchMovies: (query: string, page?: number) => Promise<void>;
  loadMatchingUsers: () => Promise<void>;


  loadAdminUsers: () => Promise<void>;
  loadAdminMovies: () => Promise<void>;
  deleteMovie: (movieId: string) => Promise<void>;
  createMovie: (movieData: any, posterFile?: File) => Promise<AdminMovie>;
  toggleUserStatus: (userId: string) => Promise<void>;

  // Utilitaires
  loadFavorites: () => Promise<void>;
  loadPopularMovies: (page?: number) => Promise<void>;
  isFavorite: (movieId: string) => boolean;
  clearError: () => void;
}

export const useMovies = (): UseMoviesReturn => {
  const [favorites, setFavorites] = useState<FavoriteMovie[]>([]);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [matchingUsers, setMatchingUsers] = useState<MatchingUser[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminMovies, setAdminMovies] = useState<AdminMovie[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);


  const loadFavorites = useCallback(async () => {
    try {
      const response = await moviesAPI.getFavorites();
      setFavorites(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des favoris';
      setError(errorMessage);
      console.error('Error loading favorites:', err);
    }
  }, []);


  const addFavorite = async (movie: Movie): Promise<boolean> => {
    try {
      const movieData = {
        movieId: movie.id.toString(),
        movieTitle: movie.title,
        moviePoster: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : undefined,
      };

      await moviesAPI.addToFavorites(movieData);
      await loadFavorites();
      return true;
    } catch (err: any) {
      if (err.response?.status === 400) {
        throw new Error('Film déjà dans les favoris');
      }
      const errorMessage = err.response?.data?.message || 'Erreur lors de l\'ajout aux favoris';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

 
  const removeFavorite = async (movieId: string) => {
    try {
      await moviesAPI.removeFromFavorites(movieId);
      await loadFavorites();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression du favori';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const searchMovies = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await moviesAPI.searchMovies(query, page);
      setSearchResults(response.data.results);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la recherche';
      setError(errorMessage);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };


  const loadPopularMovies = async (page: number = 1) => {
    try {
      setLoading(true);

     
      const popularResponse = await moviesAPI.getPopularMovies(page);
      console.log('Films populaires MovieDB:', popularResponse.data.results.length);

      
      let adminMoviesData: AdminMovie[] = [];
      try {
        const adminMoviesResponse = await adminAPI.getMovies();
        adminMoviesData = adminMoviesResponse.data;
        console.log('Films admin chargés:', adminMoviesData.length);
      } catch (err) {
        console.log('Impossible de charger les films admin (utilisateur non admin)');
        
      }

     
      const formattedAdminMovies: Movie[] = adminMoviesData
        .filter((movie: AdminMovie) => movie.isActive)
        .map((movie: AdminMovie) => {
      
          let posterPath = movie.posterPath;

         
          if (posterPath && (posterPath.includes('cloudinary') || posterPath.includes('res.cloudinary.com'))) {
           
          }
          // Si c'est un chemin relatif, on construit l'URL complète
          else if (posterPath && !posterPath.startsWith('http')) {
            posterPath = `https://image.tmdb.org/t/p/w500${posterPath}`;
          }


          const adminMovieId = Math.abs(
            movie.title.split('').reduce((a, b) => {
              a = ((a << 5) - a) + b.charCodeAt(0);
              return a & a;
            }, 0)
          );

          return {
            id: adminMovieId,
            title: movie.title,
            overview: movie.overview || '',
            poster_path: posterPath || '',
            release_date: movie.releaseDate || '',
            vote_average: 0,
            vote_count: 0,
            popularity: 0,
            original_title: movie.title,
            backdrop_path: movie.backdropPath || '',
            original_language: movie.originalLanguage || 'fr',
            genre_ids: movie.genreIds || [],
            adult: false,
            video: false,
            isAdminMovie: true, 
          };
        });

      console.log('Films admin formatés:', formattedAdminMovies.length);

      // Créer un Set des IDs des films populaires pour éviter les doublons
      const popularMovieIds = new Set(popularResponse.data.results.map((m: Movie) => m.id));

      // Filtrer les films admin qui ne sont pas déjà dans les films populaires
      const uniqueAdminMovies = formattedAdminMovies.filter((movie: Movie) => {
        return !popularMovieIds.has(movie.id);
      });

      console.log('Films admin uniques:', uniqueAdminMovies.length);

      // Combiner les films populaires avec les films admin uniques
      const allMovies = [
        ...popularResponse.data.results.map(movie => ({
          ...movie,
          overview: movie.overview || 'Aucun synopsis disponible pour ce film.'
        })),
        ...uniqueAdminMovies
      ];

      console.log('Total des films après combinaison:', allMovies.length);

      setPopularMovies(allMovies);
      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des films';
      setError(errorMessage);
      console.error('Error loading movies:', err);
      setPopularMovies([]);
    } finally {
      setLoading(false);
    }
  };

  
  const loadMatchingUsers = async () => {
    console.log('🔄 Loading matching users...');
    setLoading(true);
    try {
      const response = await moviesAPI.getMatchingUsers();
      console.log('✅ Matching users loaded:', response.data);
      console.log(`📊 Found ${response.data.length} matches`);
      setMatchingUsers(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des utilisateurs similaires';
      setError(errorMessage);
      console.error('❌ Error loading matching users:', err);
    } finally {
      setLoading(false);
    }
  };

 
  const loadAdminUsers = async () => {
    try {
      const response = await adminAPI.getUsers();
      setAdminUsers(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des utilisateurs';
      setError(errorMessage);
      console.error('Error loading admin users:', err);
    }
  };

  const loadAdminMovies = async () => {
    try {
      const response = await adminAPI.getMovies();
      setAdminMovies(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors du chargement des films administrateur';
      setError(errorMessage);
      console.error('Error loading admin movies:', err);
    }
  };

  const deleteMovie = async (movieId: string) => {
    try {
      await adminAPI.deleteMovie(movieId);
      // Remove the movie from the local state
      setAdminMovies(prevMovies => prevMovies.filter(movie => movie.id.toString() !== movieId.toString()));
      // Also remove from popular movies if it exists there
      setPopularMovies(prevMovies => prevMovies.filter(movie => movie.id.toString() !== movieId.toString()));
    } catch (error) {
      console.error('Error deleting movie:', error);
      setError('Failed to delete movie');
      throw error; // Re-throw to handle in the component
    }
  };

  const createMovie = async (movieData: any, posterFile?: File) => {
    setLoading(true);
    try {
      const formData = new FormData();

      
      formData.append('title', movieData.title);
      formData.append('overview', movieData.overview || '');

  
      if (movieData.releaseDate) {
        const releaseDate = new Date(movieData.releaseDate);
        formData.append('releaseDate', releaseDate.toISOString());
      }

      
      let genreIds: number[] = [];
      if (Array.isArray(movieData.genreIds)) {
        // Convert all values to numbers and filter out any invalid numbers
        genreIds = movieData.genreIds
          .map((id: any) => Number(id))
          .filter((id: number) => !isNaN(id) && id > 0);
      }

      // Send genreIds as a JSON string
      formData.append('genreIds', JSON.stringify(genreIds));

     
      if (posterFile) {
        formData.append('poster', posterFile);
      }

      console.log('Sending to server - FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await adminAPI.createMovie(formData);

     
      await Promise.all([
        loadAdminMovies(),
        loadPopularMovies()
      ]);

      return response.data;
    } catch (err: any) {
      console.error('Error in createMovie:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors de la création du film';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      await loadAdminUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la modification du statut';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Vérifier si un film est dans les favoris
  const isFavorite = useCallback((movieId: string) => {
    return favorites.some(fav => fav.movieId === movieId.toString());
  }, [favorites]);


  useEffect(() => {
    loadFavorites();
    loadPopularMovies();
  }, [loadFavorites]);

  return {
    favorites,
    searchResults,
    popularMovies,
    matchingUsers,
    adminUsers,
    adminMovies,
    loading,
    error,

    addFavorite,
    removeFavorite,
    searchMovies,
    loadMatchingUsers,
    loadAdminUsers,
    loadAdminMovies,
    deleteMovie,
    createMovie,
    toggleUserStatus,

  
    loadFavorites,
    loadPopularMovies,
    isFavorite,
    clearError,
  };
};