import React, { useState } from 'react';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonIcon,
  IonButton,
  IonText,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent
} from '@ionic/react';
import { heart, heartOutline, star, close, calendar, globe, informationCircle, film, people } from 'ionicons/icons';
import { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movie: Movie) => void;
  showYear?: boolean;
  showRating?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  isFavorite,
  onToggleFavorite,
  showYear = true,
  showRating = true,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Genres de films
  const genreMap: { [key: number]: string } = {
    28: 'Action',
    12: 'Aventure',
    16: 'Animation',
    35: 'Comédie',
    80: 'Crime',
    18: 'Drame',
    14: 'Fantastique',
    27: 'Horreur',
    10749: 'Romance',
    878: 'Science-Fiction',
    53: 'Thriller',
  };

  const getMoviePoster = (movie: Movie) => {
    if (imageError || !movie.poster_path) return '/assets/images/no-poster.jpg';

    if (movie.poster_path.startsWith('http') || movie.poster_path.startsWith('data:')) {
      return movie.poster_path;
    }

    if (movie.poster_path.includes('cloudinary') || movie.poster_path.includes('res.cloudinary.com')) {
      return movie.poster_path;
    }

    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  };

  const getGenreNames = () => {
    if (!movie.genre_ids || movie.genre_ids.length === 0) return [];
    return movie.genre_ids.slice(0, 2).map(id => genreMap[id] || `Genre ${id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(movie);
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetails(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (rating >= 7) return 'bg-gradient-to-r from-yellow-500 to-orange-500';
    if (rating >= 6) return 'bg-gradient-to-r from-orange-500 to-red-500';
    return 'bg-gradient-to-r from-red-500 to-red-700';
  };

  const getRatingText = (rating: number) => {
    if (rating >= 8) return 'text-green-100';
    if (rating >= 7) return 'text-yellow-100';
    if (rating >= 6) return 'text-orange-100';
    return 'text-red-100';
  };

  const genreNames = getGenreNames();

  return (
    <>
      {/* Carte de film améliorée avec thème cinéma */}
      <IonCard className="movie-card-premium rounded-2xl overflow-hidden shadow-2xl border-0 h-full flex flex-col group cursor-pointer transition-all duration-500 hover:scale-105 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="relative overflow-hidden flex-1">

          <div className="relative h-48 overflow-hidden">
            <IonImg
              src={getMoviePoster(movie)}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onIonError={handleImageError}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

            <div className="absolute top-3 right-3">
              <IonButton
                fill="solid"
                size="small"
                onClick={handleFavoriteClick}
                className={`rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 backdrop-blur-sm ${isFavorite
                    ? 'bg-red-500 hover:bg-red-600 border-2 border-red-300'
                    : 'bg-black/70 hover:bg-black/90 border-2 border-white/30 text-white/80 hover:text-white'
                  }`}
              >
                <IonIcon
                  icon={isFavorite ? heart : heartOutline}
                  className={`text-lg ${isFavorite ? 'text-white' : ''}`}
                />
              </IonButton>
            </div>

            {/* Badge de note */}
            {showRating && movie.vote_average && movie.vote_average > 0 && (
              <div className={`absolute top-3 left-3 ${getRatingColor(movie.vote_average)} text-white px-3 py-1 rounded-full font-bold flex items-center space-x-1 shadow-lg border-2 border-white/20`}>
                <IonIcon icon={star} className="text-sm" />
                <span className="text-sm">{movie.vote_average.toFixed(1)}</span>
              </div>
            )}

            {/* Badge film admin */}
            {movie.isAdminMovie && (
              <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm border border-blue-300/30">
                🎬 CineMatch
              </div>
            )}

            {/* Année */}
            {showYear && movie.release_date && (
              <div className="absolute bottom-3 right-3 bg-black/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm border border-white/20">
                {new Date(movie.release_date).getFullYear()}
              </div>
            )}
          </div>

          {/* Contenu texte */}
          <IonCardHeader className="p-4 pb-2">
            <IonCardTitle className="text-white font-bold text-base line-clamp-2 leading-tight min-h-[3rem] group-hover:text-yellow-300 transition-colors duration-300">
              {movie.title}
            </IonCardTitle>

            {/* Métadonnées */}
            <div className="flex items-center justify-between mt-2">
              {movie.release_date && (
                <div className="flex items-center text-xs text-gray-400">
                  <IonIcon icon={calendar} className="mr-1 text-yellow-400" />
                  {new Date(movie.release_date).getFullYear()}
                </div>
              )}

              {movie.original_language && movie.original_language !== 'fr' && (
                <div className="text-xs text-gray-400 uppercase bg-white/10 px-2 py-1 rounded-full">
                  {movie.original_language}
                </div>
              )}
            </div>
          </IonCardHeader>

          <IonCardContent className="p-4 pt-0 flex-1 flex flex-col ">
            {/* Genres avec style amélioré */}
            {genreNames.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {genreNames.map((genre, index) => (
                  <span
                    key={index}
                    className="inline-block bg-yellow-500/20 text-yellow-300 text-xs px-2 py-1 rounded-full border border-yellow-400/30 backdrop-blur-sm"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {movie.overview && (
              <IonText>
                <p className="text-gray-300 text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
                  {movie.overview}
                </p>
              </IonText>
            )}

            {/* Bouton détails amélioré */}
            <div className="flex-shrink-0 mt-auto">
              <IonButton
                expand="block"
                fill="solid"
                size="small"
                onClick={handleDetailsClick}
                className="bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 text-white font-semibold text-xs shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <IonIcon icon={informationCircle} slot="start" />
                Voir les détails
              </IonButton>
            </div>
          </IonCardContent>
        </div>

        {/* Effet de bordure lumineuse au survol */}
        <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-400/40 rounded-2xl transition-all duration-300 pointer-events-none"></div>
      </IonCard>

      {/* Modal des détails - Version Cinéma Premium */}
      <IonModal
        isOpen={showDetails}
        onDidDismiss={() => setShowDetails(false)}
        className="rounded-[25px] cinema-modal"
      >
        <IonHeader className="shadow-2xl cinema-header border-b-0">
          <IonToolbar className="bg-gradient-to-r from-gray-900 to-gray-800">
            <IonTitle className="text-white font-bold text-xl text-center">
              🎬 Détails du Film
            </IonTitle>
            <IonButton
              slot="end"
              fill="clear"
              onClick={() => setShowDetails(false)}
              className="text-yellow-400 hover:text-white transition-colors duration-300"
            >
              <IonIcon icon={close} className="text-2xl" />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 film-grid">
          <div className="pb-8">
            {/* Image hero avec overlay */}
            <div className="relative h-80 bg-gradient-to-br from-red-900/50 to-yellow-900/50">
              <IonImg
                src={getMoviePoster(movie)}
                alt={movie.title}
                className="w-full h-full object-cover"
                onIonError={handleImageError}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Informations overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-2xl">
                      {movie.title}
                    </h1>

                    {/* Métadonnées principales */}
                    <div className="flex flex-wrap items-center gap-3">
                      {movie.release_date && (
                        <div className="flex items-center text-yellow-300 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                          <IonIcon icon={calendar} className="mr-2" />
                          <span className="font-semibold text-sm">
                            {new Date(movie.release_date).getFullYear()}
                          </span>
                        </div>
                      )}

                      {movie.vote_average && movie.vote_average > 0 && (
                        <div className={`flex items-center ${getRatingText(movie.vote_average)} ${getRatingColor(movie.vote_average)} px-3 py-1 rounded-full backdrop-blur-sm`}>
                          <IonIcon icon={star} className="mr-2" />
                          <span className="font-bold text-sm">
                            {movie.vote_average.toFixed(1)}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bouton favori */}
                  <IonButton
                    fill="solid"
                    color={isFavorite ? 'danger' : 'light'}
                    onClick={() => onToggleFavorite(movie)}
                    className="rounded-full shadow-2xl backdrop-blur-sm border-2 border-white/20 hover:scale-110 transition-transform duration-300"
                  >
                    <IonIcon
                      icon={isFavorite ? heart : heartOutline}
                      slot="start"
                    />
                    {isFavorite ? '❤️ Favori' : '🤍 Ajouter'}
                  </IonButton>
                </div>
              </div>
            </div>

            {/* Contenu détaillé */}
            <div className="p-6 space-y-6 -mt-8 relative z-10">
              {/* Section Genres */}
              {movie.genre_ids && movie.genre_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {movie.genre_ids.map(genreId => (
                    <div
                      key={genreId}
                      className="bg-gradient-to-r from-yellow-500/20 to-red-500/20 text-yellow-300 px-4 py-2 rounded-full border border-yellow-400/30 backdrop-blur-sm font-semibold"
                    >
                      {genreMap[genreId] || `Genre ${genreId}`}
                    </div>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {movie.overview && (
                <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl p-6 shadow-2xl border border-gray-600/30 backdrop-blur-sm">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <IonIcon icon={film} className="mr-3 text-yellow-400 text-2xl" />
                    Synopsis
                  </h3>
                  <IonText>
                    <p className="text-gray-200 leading-relaxed text-lg">
                      {movie.overview}
                    </p>
                  </IonText>
                </div>
              )}

              {/* Informations techniques */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-3xl p-6 shadow-2xl border border-gray-600/30 backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <IonIcon icon={informationCircle} className="mr-3 text-blue-400 text-2xl" />
                  Informations techniques
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {movie.release_date && (
                    <div className="bg-black/30 rounded-2xl p-4 border border-gray-600/50">
                      <label className="text-sm text-gray-400 flex items-center mb-2">
                        <IonIcon icon={calendar} className="mr-2 text-green-400" />
                        Date de sortie
                      </label>
                      <p className="font-bold text-white text-lg">
                        {new Date(movie.release_date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  {movie.original_language && (
                    <div className="bg-black/30 rounded-2xl p-4 border border-gray-600/50">
                      <label className="text-sm text-gray-400 flex items-center mb-2">
                        <IonIcon icon={globe} className="mr-2 text-blue-400" />
                        Langue originale
                      </label>
                      <p className="font-bold text-white text-lg uppercase">
                        {movie.original_language}
                      </p>
                    </div>
                  )}

                  {movie.vote_average && (
                    <div className="bg-black/30 rounded-2xl p-4 border border-gray-600/50">
                      <label className="text-sm text-gray-400 flex items-center mb-2">
                        <IonIcon icon={star} className="mr-2 text-yellow-400" />
                        Note moyenne
                      </label>
                      <p className="font-bold text-white text-lg">
                        {movie.vote_average.toFixed(1)}/10
                      </p>
                    </div>
                  )}

                  {movie.vote_count && (
                    <div className="bg-black/30 rounded-2xl p-4 border border-gray-600/50">
                      <label className="text-sm text-gray-400 flex items-center mb-2">
                        <IonIcon icon={people} className="mr-2 text-purple-400" />
                        Nombre de votes
                      </label>
                      <p className="font-bold text-white text-lg">
                        {movie.vote_count.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge spécial pour les films admin */}
              {movie.isAdminMovie && (
                <div className="text-center">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-2xl inline-flex items-center space-x-2 shadow-2xl border border-blue-300/30">
                    <IonIcon icon={film} className="text-xl" />
                    <span className="font-bold">🎬 Film exclusif CineMatch</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-4 pt-4">
                <IonButton
                  expand="block"
                  fill="solid"
                  color="danger"
                  onClick={() => onToggleFavorite(movie)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-yellow-500 hover:from-red-600 hover:to-yellow-600 font-bold py-4 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <IonIcon
                    icon={isFavorite ? heart : heartOutline}
                    slot="start"
                    className="text-xl"
                  />
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </IonButton>

                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={() => setShowDetails(false)}
                  className="flex-1 text-white border-white/30 hover:bg-white/10 font-bold py-4 rounded-2xl transition-all duration-300"
                >
                  <IonIcon icon={close} slot="start" />
                  Fermer
                </IonButton>
              </div>
            </div>
          </div>
        </IonContent>
      </IonModal>
    </>
  );
};

export default MovieCard;