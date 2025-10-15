import React from 'react';
import { IonCard, IonImg, IonCardHeader, IonCardTitle, IonCardContent, IonBadge } from '@ionic/react';
import { Movie } from '../types/movie';

interface AdminMovieCardProps {
  movie: Movie;
  onToggleFavorite: (movie: Movie) => void;
  isFavorite: boolean;
}

const AdminMovieCard: React.FC<AdminMovieCardProps> = ({ movie, onToggleFavorite, isFavorite }) => {
  // Fonction pour obtenir l'URL correcte de l'affiche
  const getPosterUrl = () => {
    if (!movie.poster_path) return '/assets/images/no-poster.jpg';
    
 
    if (movie.poster_path.startsWith('http')) {
      return movie.poster_path;
    }
    
   
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  };

  return (
    <IonCard className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow">
      <div className="relative">
        <IonImg
          src={getPosterUrl()}
          alt={movie.title}
          className="w-full h-64 object-cover"
          onError={(e) => {
       
            const target = e.target as HTMLImageElement;
            target.src = '/assets/images/no-poster.jpg';
          }}
        />
        <div className="absolute top-2 right-2">
          <button
            onClick={() => onToggleFavorite(movie)}
            className={`p-2 rounded-full ${isFavorite ? 'bg-red-100 text-red-600' : 'bg-white text-gray-600'} shadow-md`}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill={isFavorite ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        </div>
        {movie.release_date && (
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {new Date(movie.release_date).getFullYear()}
          </div>
        )}
      </div>

      <IonCardHeader className="p-4">
        <IonCardTitle className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
          {movie.title}
        </IonCardTitle>
      </IonCardHeader>

      <IonCardContent className="p-4 pt-0">
        <div className="flex justify-between items-center">
          {movie.vote_average !== undefined && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-yellow-400 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900">
                {movie.vote_average.toFixed(1)}
              </span>
            </div>
          )}
          {movie.isAdminMovie && (
            <IonBadge color="primary" className="text-xs">
              Admin
            </IonBadge>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default AdminMovieCard;
