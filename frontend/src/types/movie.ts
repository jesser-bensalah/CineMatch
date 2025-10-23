export interface Movie {
  id: number;
  title: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  genre_names?: string[];
  vote_average?: number;
  backdrop_path?: string;
  original_language?: string;
  original_title?: string;
  popularity?: number;
  vote_count?: number;
  adult?: boolean;
  video?: boolean;
  isAdminMovie?: boolean;
  rating?: number;
}

export interface FavoriteMovie {
  movieId: string;
  movieTitle: string;
  moviePoster?: string;
  addedAt: string;
  movieOverview?: string;
  releaseDate?: string;
  voteAverage?: number;
  isAdminMovie?: boolean;
  genreIds?: number[];
  genreNames?: string[];
  originalLanguage?: string;
  rating?: number;
}

export interface MatchingUser {
  userId: string;
  nom: string;
  prenom: string;
  photoUrl: string;
  similarity: number;
  commonMovies: number;
  totalFavorites: number;
  matchStatus?: 'none' | 'pending' | 'accepted' | 'declined';
  matchRequestId?: string;
  isSender?: boolean;
}

export interface AdminUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  age: number;
  photoUrl: string;
  isActive: boolean;
  favoritesCount: number;
  createdAt: string;
}


export interface AdminMovie {
  id: string;
  title: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  voteAverage?: number; 
  genreIds?: number[]; 
  originalLanguage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MovieSearchResponse {
  results: Movie[];
  total_pages: number;
  total_results: number;
  page: number;
}

export interface PopularMoviesResponse {
  results: Movie[];
  total_pages: number;
  page: number;
}