import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonImg,
  IonButton,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonList,
  IonItem,
  IonAvatar,
  IonChip,
  IonModal,
  IonInput,
  IonTextarea,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonBadge,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  useIonToast,
} from '@ionic/react';
import {
  heart,
  heartOutline,
  add,
  settings,
  person,
  film,
  search,
  trendingUp,
  refresh,
  filter,
  calendar,
  star,
  informationCircle,
  close,
  eye,
  videocam,
  bookmark,
  shield,
  logOutOutline,
  people,
  create,
  closeCircle,
  pencil,
} from 'ionicons/icons';
import { useAuth } from '../hooks/useAuth';
import { useMovies } from '../hooks/useMovies';
import { adminAPI, moviesAPI } from '../services/api.service';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';
import { Movie, MatchingUser, AdminUser, AdminMovie } from '../types/movie';


const Home: React.FC = () => {
  const { user, logout } = useAuth();
  const [presentToast] = useIonToast();
  const {
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
    createMovie,
    toggleUserStatus,
    isFavorite,
    loadFavorites,
    loadPopularMovies,
    clearError,
  } = useMovies();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegment, setActiveSegment] = useState('discover');
  const [showError, setShowError] = useState(false);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<AdminMovie | null>(null);
  const [moviePoster, setMoviePoster] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  interface NewMovie {
    title: string;
    overview: string;
    releaseDate: string;
    genreIds: number[];
    posterPath: string;
  }

  const [newMovie, setNewMovie] = useState<NewMovie>({
    title: '',
    overview: '',
    releaseDate: '',
    genreIds: [],
    posterPath: ''
  });
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const movieGenres = [
    { id: 'all', name: 'Tous les genres' },
    { id: '28', name: 'Action' },
    { id: '12', name: 'Aventure' },
    { id: '16', name: 'Animation' },
    { id: '35', name: 'Comédie' },
    { id: '80', name: 'Crime' },
    { id: '18', name: 'Drame' },
    { id: '14', name: 'Fantastique' },
    { id: '27', name: 'Horreur' },
    { id: '10749', name: 'Romance' },
    { id: '878', name: 'Science-Fiction' },
    { id: '53', name: 'Thriller' },
  ];

  const getImageUrl = (path?: string, type: 'backdrop' | 'poster' = 'poster') => {
    if (!path) return '/assets/images/no-poster.jpg';
    if (path.startsWith('http')) return path;

    const base = type === 'backdrop'
      ? 'https://image.tmdb.org/t/p/w780'
      : 'https://image.tmdb.org/t/p/w500';
    return `${base}${path}`;
  };

  const checkAdminPermissions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return false;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const isExpired = payload.exp * 1000 < Date.now();
        if (isExpired) return false;
      } catch {
        return false;
      }

      return user?.role === 'admin';
    } catch (error) {
      console.log('Erreur de vérification des permissions admin');
      return false;
    }
  };

  useEffect(() => {
    console.log(' Home mounted - User:', user?.email, 'Role:', user?.role, 'Active:', user?.isActive);

    loadFavorites();
    loadPopularMovies();

    if (user?.role === 'admin' && activeSegment === 'matches') {
      setActiveSegment('discover');
    }

    if (activeSegment === 'matches' && user?.role !== 'admin') {
      loadMatchingUsers();
    } else if (activeSegment === 'admin') {
      checkAdminPermissions().then(isAdmin => {
        if (isAdmin) {
          loadAdminUsers();
          loadAdminMovies();
        } else {
          console.log('Accès admin refusé, redirection vers Discover');
          setActiveSegment('discover');
        }
      });
    }
  }, [activeSegment, user?.role]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const openMovieDetails = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowDetailModal(true);
  };

  const getFilteredMovies = (movies: Movie[]) => {
    let filtered = [...movies];

    if (selectedGenre !== 'all') {
      filtered = filtered.filter(movie =>
        movie.genre_ids?.includes(parseInt(selectedGenre))
      );
    }

    filtered.sort((a, b) => {
      const dateA = a.release_date ? new Date(a.release_date).getTime() : 0;
      const dateB = b.release_date ? new Date(b.release_date).getTime() : 0;

      if (sortBy === 'recent') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    return filtered;
  };

  const filteredPopularMovies = getFilteredMovies(popularMovies);
  const filteredSearchResults = getFilteredMovies(searchResults);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchMovies(query);
    }
  };

  const handleToggleFavorite = async (movie: Movie) => {
    try {
      if (isFavorite(movie.id.toString())) {
        await removeFavorite(movie.id.toString());
      } else {
        await addFavorite(movie);
      }
    } catch (error: any) {
      console.error('Erreur lors de la gestion des favoris:', error);
      setShowError(true);
    }
  };

  const handleCreateMovie = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      formData.append('title', newMovie.title);
      formData.append('overview', newMovie.overview);
      formData.append('releaseDate', newMovie.releaseDate);
      newMovie.genreIds.forEach(id => formData.append('genreIds', id.toString()));
      
      if (moviePoster) {
        formData.append('poster', moviePoster);
      }
      
      await adminAPI.createMovie(formData);
      
      setShowMovieModal(false);
      setNewMovie({
        title: '',
        overview: '',
        releaseDate: '',
        genreIds: [],
        posterPath: ''
      });
      setMoviePoster(null);
      
      // Refresh the movies list
      await loadAdminMovies();
      
      presentToast({
        message: 'Film créé avec succès',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
    } catch (error) {
      console.error('Error creating movie:', error);
      presentToast({
        message: 'Erreur lors de la création du film',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMovie = async () => {
    if (!editingMovie) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Create a movie object that matches the CreateMovieDto
      const movieData = {
        title: newMovie.title,
        overview: newMovie.overview,
        releaseDate: newMovie.releaseDate,
        genreIds: newMovie.genreIds.map(id => Number(id)),
        posterPath: editingMovie.posterPath, // Keep existing poster path if no new file is uploaded
        isActive: true
      };
      
      // Append the movie data as JSON
      formData.append('movie', JSON.stringify(movieData));
      
      // Only append poster if it's a new file
      if (moviePoster && moviePoster instanceof File) {
        // Make sure the field name is 'poster' to match the backend's @UploadedFile('poster') decorator
        formData.append('poster', moviePoster);
      }
      
      // Log the form data for debugging
      console.log('Sending update request with data:', movieData);

      // Don't set Content-Type header when sending FormData, let the browser set it with the correct boundary
      await adminAPI.updateMovie(editingMovie.id.toString(), formData);
      
      // Refresh the movies list
      await loadAdminMovies();
      
      setShowMovieModal(false);
      setEditingMovie(null);
      setNewMovie({
        title: '',
        overview: '',
        releaseDate: '',
        genreIds: [],
        posterPath: ''
      });
      setMoviePoster(null);

      presentToast({
        message: 'Film mis à jour avec succès',
        duration: 3000,
        color: 'success',
        position: 'top'
      });
    } catch (error) {
      console.error('Error updating movie:', error);
      presentToast({
        message: 'Erreur lors de la mise à jour du film',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async (event: any) => {
    try {
      await loadFavorites();
      await loadPopularMovies();
      if (activeSegment === 'matches' && user?.role !== 'admin') {
        await loadMatchingUsers();
      } else if (activeSegment === 'admin') {
        const isAdmin = await checkAdminPermissions();
        if (isAdmin) {
          await loadAdminUsers();
          await loadAdminMovies();
        }
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    } finally {
      event.detail.complete();
    }
  };

  const loadMoreMovies = async (event: any) => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    // Implémentation du chargement infini
    event.target.complete();
  };

  const handleEditClick = (user: AdminUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async (updatedUser: AdminUser) => {
    try {
      // Call the API to update the user
      await adminAPI.updateUser(updatedUser.id, {
        prenom: updatedUser.prenom,
        nom: updatedUser.nom,
        email: updatedUser.email,
        isActive: updatedUser.isActive
      });
      
      // Refresh the admin users list to get the updated data
      await loadAdminUsers();
      
      // Close the edit modal
      setIsEditModalOpen(false);
      
      // Show success message
      presentToast({
        message: 'Utilisateur mis à jour avec succès',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la mise à jour de l\'utilisateur';
      presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    }
  };

  const PremiumMovieCard = ({ movie, isFavorite, onToggleFavorite, showDetailsButton = true }: {
    movie: Movie;
    isFavorite: boolean;
    onToggleFavorite: (movie: Movie) => void;
    showDetailsButton?: boolean;
  }) => (
    <IonCard className="premium-movie-card h-full flex flex-col outline outline-2 outline-indigo-400/60 m-2 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
      <div className="relative flex-shrink-0">
        <IonImg
          src={getImageUrl(movie.poster_path, 'poster')}
          alt={movie.title}
          className="w-full h-48 md:h-56 object-cover"
          onIonError={(e: any) => {
            e.target.src = '/assets/images/no-poster.jpg';
          }}
        />

        <div className="absolute top-3 right-3">
          <IonButton
            fill="solid"
            size="small"
            color={isFavorite ? "danger" : "medium"}
            onClick={() => onToggleFavorite(movie)}
            className="rounded-full shadow-lg bg-black/70 backdrop-blur-sm hover:bg-black/90 border border-white/20"
          >
            <IonIcon
              icon={isFavorite ? heart : heartOutline}
              className={`text-lg ${isFavorite ? 'text-red-400' : 'text-gray-300'}`}
            />
          </IonButton>
        </div>

        {movie.vote_average && (
          <div className="absolute top-3 left-3">
            <div className="premium-badge flex items-center bg-black/70 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm font-bold">
              <IonIcon icon={star} className="text-yellow-400 mr-1" />
              {movie.vote_average.toFixed(1)}
            </div>
          </div>
        )}
      </div>

      <IonCardHeader className="p-4 pb-2 flex-shrink-0">
        <IonCardTitle className="text-white font-bold text-base line-clamp-2 leading-tight min-h-[3rem]">
          {movie.title}
        </IonCardTitle>
      </IonCardHeader>

      <IonCardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
        <div className="mb-3">
          {movie.release_date && (
            <div className="flex items-center text-sm text-gray-300 mb-2">
              <IonIcon icon={calendar} className="mr-2 text-indigo-400" />
              {new Date(movie.release_date).getFullYear()}
            </div>
          )}

          {movie.genre_names && movie.genre_names.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {movie.genre_names.slice(0, 2).map((genre, index) => (
                <IonBadge key={index} color="medium" className="text-xs">
                  {genre}
                </IonBadge>
              ))}
              {movie.genre_names.length > 2 && (
                <IonBadge color="light" className="text-xs">
                  +{movie.genre_names.length - 2}
                </IonBadge>
              )}
            </div>
          )}
        </div>

        {showDetailsButton && (
          <div className="flex-shrink-0">
            <IonButton
              expand="block"
              fill="clear"
              size="small"
              onClick={() => openMovieDetails(movie)}
              className="premium-btn text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
            >
              <IonIcon icon={eye} slot="start" />
              Voir détails
            </IonButton>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );

  const renderMovieGrid = (movies: Movie[], showDetailsButton = true) => (
    <IonGrid className="px-0">
      <IonRow>
        {movies.map((movie) => (
          <IonCol size="6" sizeMd="4" sizeLg="3" key={movie.id} className="mb-6">
            <PremiumMovieCard
              movie={movie}
              isFavorite={isFavorite(movie.id?.toString() || '')}
              onToggleFavorite={handleToggleFavorite}
              showDetailsButton={showDetailsButton}
            />
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );

  const handleSendMatchRequest = async (targetUserId: string) => {
    try {
      await moviesAPI.sendMatchRequest(targetUserId);
      await loadMatchingUsers(); // Reload to update status
      presentToast({
        message: 'Demande de match envoyée !',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
    } catch (error: any) {
      console.error('Error sending match request:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'envoi de la demande';
      presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    }
  };

  const handleRespondToMatch = async (requestId: string, status: 'accepted' | 'declined') => {
    console.log('🔄 Responding to match request:', { requestId, status });
    try {
      await moviesAPI.respondToMatchRequest(requestId, status);
      await loadMatchingUsers(); // Reload to update status
      presentToast({
        message: status === 'accepted' ? 'Match accepté !' : 'Match refusé',
        duration: 2000,
        color: status === 'accepted' ? 'success' : 'medium',
        position: 'top'
      });
    } catch (error: any) {
      console.error('❌ Error responding to match request:', error);
      console.error('Request ID was:', requestId);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la réponse';
      presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    }
  };

  const handleCancelMatchRequest = async (requestId: string) => {
    if (!requestId) {
      console.error('No request ID provided for cancellation');
      presentToast({
        message: 'Erreur: ID de demande manquant',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      return;
    }

    try {
      const response = await moviesAPI.cancelMatchRequest(requestId);
      console.log('Cancel response:', response);
      
      await loadMatchingUsers(); // Reload to update status
      presentToast({
        message: 'Demande de match annulée avec succès',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
    } catch (error: any) {
      console.error('Error canceling match request:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'annulation de la demande';
      console.error('Error details:', error.response?.data);
      
      presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    }
  };

  const handleUnmatch = async (requestId: string) => {
    if (!requestId) {
      console.error('No request ID provided for unmatch');
      presentToast({
        message: 'Erreur: ID de match manquant',
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
      return;
    }

    try {
      await moviesAPI.unmatch(requestId);
      await loadMatchingUsers(); // Reload to update status
      presentToast({
        message: 'Match annulé avec succès',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
    } catch (error: any) {
      console.error('Error unmatching:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de l\'annulation du match';
      presentToast({
        message: errorMessage,
        duration: 3000,
        color: 'danger',
        position: 'top'
      });
    }
  };

  const getMatchButtonProps = (matchingUser: MatchingUser) => {
    const status = matchingUser.matchStatus || 'none';
    const isSender = matchingUser.isSender === true;
    
    console.log('Match button props:', {
      status,
      isSender,
      requestId: matchingUser.matchRequestId,
      userId: matchingUser.userId
    });
      
    switch (status) {
      case 'accepted':
        return {
          type: 'unmatch' as const,
          text: 'Unmatch',
          color: 'danger',
          requestId: matchingUser.matchRequestId || '',
          handler: () => {
            if (matchingUser.matchRequestId) {
              handleUnmatch(matchingUser.matchRequestId);
            }
          }
        };
      case 'pending':
        // If current user is the SENDER, show cancel button
        if (isSender) {
          return {
            type: 'cancel' as const,  // New type for cancel button
            text: 'Annuler la demande',
            color: 'medium',
            requestId: matchingUser.matchRequestId || '',
            handler: () => {
              if (matchingUser.matchRequestId) {
                handleCancelMatchRequest(matchingUser.matchRequestId);
              }
            }
          };
        }
        // If current user is the RECEIVER, show accept/decline buttons
        return {
          type: 'double' as const,
          requestId: matchingUser.matchRequestId || ''
        };
      case 'declined':
      case 'none':
      default:
        return {
          type: 'single' as const,
          text: 'Match',
          color: 'primary',
          icon: undefined,
          disabled: false,
          fill: 'clear' as const
        };
    }
  };

  // match user's list
  const renderMatchingUser = (matchingUser: MatchingUser) => {
    const buttonProps = getMatchButtonProps(matchingUser);

    console.log('👤 Rendering matching user:', {
      userId: matchingUser.userId,
      name: `${matchingUser.prenom} ${matchingUser.nom}`,
      matchStatus: matchingUser.matchStatus,
      matchRequestId: matchingUser.matchRequestId,
      isSender: matchingUser.isSender,
      buttonType: buttonProps.type
    });
    
    return (
      <IonItem
        key={matchingUser.userId}
        className="premium-movie-card w-[calc(95%-1rem)] ml-10 mb-4 mt-4 border border-white/10 outline outline-2 outline-indigo-400/60"
      >
        <IonAvatar slot="start" className="w-16 h-16 border-2 border-indigo-400 shadow-lg">
          <img
            src={matchingUser.photoUrl || '/assets/images/avatar-placeholder.png'}
            alt="Profile"
            className="object-cover"
          />
        </IonAvatar>
        <IonLabel>
          <h2 className="font-bold text-white text-lg">{matchingUser.prenom} {matchingUser.nom}</h2>
          <p className="text-sm text-gray-300 mt-1">
            {matchingUser.commonMovies} film{matchingUser.commonMovies > 1 ? 's' : ''} en commun
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <IonBadge color="medium" className="text-xs">
              {matchingUser.totalFavorites} favoris
            </IonBadge>
          </div>
        </IonLabel>
        
        {buttonProps.type === 'double' ? (
          <div className="flex gap-2 mr-2">
            <IonButton
              color="success"
              fill="solid"
              size="small"
              onClick={() => handleRespondToMatch(buttonProps.requestId!, 'accepted')}
            >
              <IonIcon icon={heart} slot="icon-only" />
            </IonButton>
            <IonButton
              color="danger"
              fill="outline"
              size="small"
              onClick={() => handleRespondToMatch(buttonProps.requestId!, 'declined')}
            >
              <IonIcon icon={close} slot="icon-only" />
            </IonButton>
          </div>
        ) : buttonProps.type === 'cancel' ? (
          // Cancel button for pending requests
          <div className="mr-2">
            <IonButton
              color={buttonProps.color}
              fill="outline"
              size="small"
              onClick={buttonProps.handler}
            >
              <IonIcon icon={close} slot="start" />
              {buttonProps.text}
            </IonButton>
          </div>
        ) : buttonProps.type === 'unmatch' ? (
          // Unmatch button for accepted matches
          <div className="mr-2">
            <IonButton
              color={buttonProps.color}
              fill="outline"
              size="small"
              onClick={buttonProps.handler}
            >
              <IonIcon icon={closeCircle} slot="start" />
              {buttonProps.text}
            </IonButton>
          </div>
        ) : (
          // Default match button
          <div className="mr-2">
            <IonButton
              color="primary"
              fill="outline"
              size="small"
              disabled={buttonProps.disabled}
              onClick={() => handleSendMatchRequest(matchingUser.userId)}
            >
              {buttonProps.icon && <IonIcon icon={buttonProps.icon} slot="start" />}
              {buttonProps.text}
            </IonButton>
          </div>
        )}
        
        <IonBadge
          color="success"
          slot="end"
          className="text-sm font-bold px-3 py-2 rounded-full"
        >
          {matchingUser.similarity}%
        </IonBadge>
      </IonItem>
    );
  };

  const renderAdminUser = (adminUser: AdminUser) => (
    <IonItem
      key={adminUser.id}
      className="premium-movie-card mb-4 border border-white/10 outline outline-2 outline-indigo-400/60"
    >
      <IonAvatar slot="start" className="w-14 h-14 border-2 border-purple-400">
        <img
          src={adminUser.photoUrl || '/assets/images/avatar-placeholder.png'}
          alt="Profile"
          className="object-cover"
        />
      </IonAvatar>
      <IonLabel>
        <h2 className="font-semibold text-white">{adminUser.prenom} {adminUser.nom}</h2>
        <p className="text-sm text-gray-300">
          {adminUser.email}
        </p>
        <div className="flex items-center space-x-2 mt-1">
          <IonBadge color="blue" className="text-xs">
            {adminUser.favoritesCount} favoris
          </IonBadge>
          
          <IonBadge color="medium" className="text-xs">
            {new Date(adminUser.createdAt).toLocaleDateString()}
          </IonBadge>
        </div>
      </IonLabel>
      <IonToggle
        checked={adminUser.isActive}
        onIonChange={() => toggleUserStatus(adminUser.id)}
        color="success"
        className="ml-2"
      />
      <IonButton
        onClick={(e) => {
          e.stopPropagation();
          handleEditClick(adminUser);
        }}
        fill="clear"
        slot="end"
        color="success"
        className="mr-2"
      >
        <IonIcon icon={create} size="large" />
      </IonButton>
    </IonItem>
  );

  return (
    <IonPage className="cinema-theme cinema-particles">
      <IonHeader className="premium-header">
        <IonToolbar className="bg-transparent">
          <IonTitle className="text-center">
            <div className="cinematch-logo">CineMatch</div>
          </IonTitle>

          <div slot="end" className="flex items-center space-x-2">
            {user?.role === 'admin' && (
              <IonChip color="primary" className="premium-badge m-0">
                <IonIcon icon={shield} className="mr-2" />
                Admin
              </IonChip>
            )}

            <IonAvatar className="w-10 h-10 border-2 border-indigo-400 shadow-lg">
              <img
                src={user?.photoUrl || '/assets/images/avatar-placeholder.png'}
                alt="Profile"
                className="object-cover"
              />
            </IonAvatar>

            <IonButton
              fill="clear"
              size="default"
              onClick={() => setShowLogoutConfirm(true)}
              className="text-indigo-200 hover:text-white transition-colors duration-300"
              title="Déconnexion"
            >
              <IonIcon icon={logOutOutline} className="text-xl" />
            </IonButton>
          </div>
        </IonToolbar>

        <IonToolbar className="bg-transparent">
          <IonSegment
            value={activeSegment}
            onIonChange={(e) => setActiveSegment(e.detail.value as string)}
            className="premium-segment"
            scrollable={true}
          >
            <IonSegmentButton value="discover" className="premium-segment-button">
              <IonLabel className="text-sm font-semibold flex items-center">
                <IonIcon icon={search} className="mr-2" />
                Découvrir
              </IonLabel>
            </IonSegmentButton>

            <IonSegmentButton value="favorites" className="premium-segment-button">
              <IonLabel className="text-sm font-semibold flex items-center">
                <IonIcon icon={bookmark} className="mr-2" />
                Favoris {favorites.length > 0 && `(${favorites.length})`}
              </IonLabel>
            </IonSegmentButton>

            {user?.role !== 'admin' && (
              <IonSegmentButton value="matches" className="premium-segment-button">
                <IonLabel className="text-sm font-semibold flex items-center">
                  <IonIcon icon={people} className="mr-2" />
                  Matchs
                </IonLabel>
              </IonSegmentButton>
            )}

            {user?.role === 'admin' && (
              <IonSegmentButton value="admin" className="premium-segment-button">
                <IonLabel className="text-sm font-semibold flex items-center">
                  <IonIcon icon={settings} className="mr-2" />
                  Admin
                </IonLabel>
              </IonSegmentButton>
            )}
          </IonSegment>
        </IonToolbar>

        {activeSegment === 'discover' && (
          <IonToolbar className="bg-transparent">
            <div className="w-full px-4">
              <IonSearchbar
                value={searchQuery}
                onIonInput={(e) => handleSearch(e.detail.value!)}
                placeholder="Rechercher un film..."
                animated
                className="mb-4"
                showClearButton="always"
              />

              <div className="flex items-center justify-between mb-4">
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}
                  className="premium-btn text-sm"
                >
                  <IonIcon icon={filter} className="mr-2" />
                  Filtres
                </IonButton>

                <div className="text-sm text-indigo-300 font-semibold bg-black/30 px-3 py-1 rounded-full">
                  {filteredPopularMovies.length} films
                </div>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-3 mb-4 p-4 bg-black/30 rounded-2xl backdrop-blur-lg border border-indigo-400/20">
                  <div className="flex-1 min-w-[140px]">
                    <IonSelect
                      value={sortBy}
                      placeholder="Trier par"
                      onIonChange={(e) => setSortBy(e.detail.value)}
                      className="text-white"
                    >
                      <IonSelectOption value="recent">Plus récents</IonSelectOption>
                      <IonSelectOption value="oldest">Plus anciens</IonSelectOption>
                    </IonSelect>
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <IonSelect
                      value={selectedGenre}
                      placeholder="Genre"
                      onIonChange={(e) => setSelectedGenre(e.detail.value)}
                      className="text-white"
                    >
                      {movieGenres.map(genre => (
                        <IonSelectOption key={genre.id} value={genre.id}>
                          {genre.name}
                        </IonSelectOption>
                      ))}
                    </IonSelect>
                  </div>

                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={() => {
                      setSortBy('recent');
                      setSelectedGenre('all');
                    }}
                    className="text-indigo-300 hover:text-white"
                  >
                    Réinitialiser
                  </IonButton>
                </div>
              )}
            </div>
          </IonToolbar>
        )}
      </IonHeader>

      <IonContent fullscreen className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 ">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingIcon={refresh}
            refreshingSpinner="crescent"
          />
        </IonRefresher>

        {/* Segment Découvert */}
        {activeSegment === 'discover' && (
          <div className="p-6 premium-fade-in">
            {searchQuery ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <IonIcon icon={search} className="mr-3 text-indigo-400 text-2xl" />
                  <span>
                    {filteredSearchResults.length > 0
                      ? `"${searchQuery}" - ${filteredSearchResults.length} résultat${filteredSearchResults.length > 1 ? 's' : ''}`
                      : `Aucun résultat pour "${searchQuery}"`
                    }
                  </span>
                </h2>

                {filteredSearchResults.length > 0 ? (
                  renderMovieGrid(filteredSearchResults)
                ) : (
                  <div className="text-center py-16">
                    <div className="w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-400/30">
                      <IonIcon icon={film} className="text-5xl text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">Film introuvable</h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">
                      Aucun film ne correspond à votre recherche. Essayez avec d'autres mots-clés.
                    </p>
                    <IonButton
                      onClick={() => setSearchQuery('')}
                      className="premium-btn"
                    >
                      <IonIcon icon={trendingUp} slot="start" />
                      Voir les tendances
                    </IonButton>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="mb-8 text-center">
                  <h2 className="section-title mb-4">
                    Films Populaires
                  </h2>
                  <p className="text-gray-300 text-lg">
                    {selectedGenre !== 'all'
                      ? `🎭 ${movieGenres.find(g => g.id === selectedGenre)?.name} • Triés par ${sortBy === 'recent' ? 'plus récents' : 'plus anciens'}`
                      : ` Découvrez les films tendance du moment • Triés par ${sortBy === 'recent' ? 'plus récents' : 'plus anciens'}`
                    }
                  </p>
                </div>

                {filteredPopularMovies.length > 0 ? (
                  renderMovieGrid(filteredPopularMovies)
                ) : (
                  <LoadingSpinner message="Chargement des films..." />
                )}
              </>
            )}
          </div>
        )}

        {/* Segment Favoris */}
        {activeSegment === 'favorites' && (
          <div className="p-6 premium-fade-in">
            <div className="mb-8 text-center">
              <h2 className="section-title mb-4">
                Mes Favoris
              </h2>
              <p className="text-gray-300 text-lg">
                {favorites.length === 0
                  ? "Commencez à créer votre collection personnelle !"
                  : `Votre sélection exclusive (${favorites.length} film${favorites.length > 1 ? 's' : ''})`
                }
              </p>
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-pink-400/30">
                  <IonIcon icon={bookmark} className="text-5xl text-pink-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Collection vide</h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Ajoutez des films à vos favoris pour créer votre playlist personnelle.
                </p>
                <IonButton
                  onClick={() => setActiveSegment('discover')}
                  className="premium-btn"
                >
                  <IonIcon icon={videocam} slot="start" />
                  Explorer les films
                </IonButton>
              </div>
            ) : (
              <IonGrid className="px-0" style={{
                height: '100%',
                overflowY: 'auto',
                paddingBottom: '100px'
              }}
              >
                <IonRow>
                  {favorites.map(favorite => {
                    const movie: Movie = {
                      id: parseInt(favorite.movieId),
                      title: favorite.movieTitle,
                      poster_path: favorite.moviePoster,
                      release_date: favorite.releaseDate,
                      vote_average: favorite.rating,
                      overview: favorite.movieOverview || '',
                      genre_ids: favorite.genreIds,
                      genre_names: favorite.genreNames
                    };

                    return (
                      <IonCol size="6" sizeMd="4" sizeLg="3"  key={favorite.movieId} className="mb-6">
                        <PremiumMovieCard
                          movie={movie}
                          isFavorite={true}
                          onToggleFavorite={handleToggleFavorite}
                          showDetailsButton={true}
                        />
                      </IonCol>
                    );
                  })}
                </IonRow>
              </IonGrid>
            )}
          </div>
        )}

        {/* Segment Match - Masqué pour les admins */}
        {activeSegment === 'matches' && user?.role !== 'admin' && (
          <div className="p-6 premium-fade-in">
            <div className="mb-8 text-center">
              <h2 className="section-title mb-4">
                Vos Matchs
              </h2>
              <p className="text-gray-300 text-lg">
                Découvrez les personnes qui partagent vos goûts cinématographiques
              </p>
            </div>

            {loading ? (
              <LoadingSpinner message="Recherche de matches..." />
            ) : matchingUsers.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-400/30">
                  <IonIcon icon={person} className="text-5xl text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Aucun match pour le moment</h3>
                <p className="text-gray-300 mb-6 max-w-md mx-auto">
                  Ajoutez plus de films à vos favoris pour trouver des personnes avec des goûts similaires.
                </p>
                <IonButton
                  onClick={() => setActiveSegment('discover')}
                  className="premium-btn"
                >
                  <IonIcon icon={videocam} slot="start" />
                  Explorer les films
                </IonButton>
              </div>
            ) : (
              <IonList className="bg-transparent">
                {matchingUsers.map(renderMatchingUser)}
              </IonList>
            )}
          </div>
        )}

        {/* Segment Admin */}
        {activeSegment === 'admin' && user?.role === 'admin' && (
          <div className="p-6 space-y-8 premium-fade-in">
            {(adminUsers.length === 0 && adminMovies.length === 0 && loading) ? (
              <div className="text-center py-12">
                <IonSpinner name="crescent" className="mb-4" />
                <p className="text-white">Chargement des données administrateur...</p>
              </div>
            ) : (
              <>
                {/* Statistiques avec animations */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  <div className="premium-movie-card text-center p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-indigo-300/80 bg-gradient-to-br from-indigo-950/80 to-indigo-900/80 drop-shadow-md rounded-2xl overflow-hidden outline outline-2 outline-indigo-400/60">
                    <IonIcon icon={person} className="text-5xl text-blue-300 mb-4 animate-pulse" />
                    <h3 className="text-3xl font-bold text-gray-400 drop-shadow-md">{adminUsers.length}</h3>
                    <p className="text-gray-300 font-medium text-md mt-2">Utilisateurs</p>
                  </div>

                  <div className="premium-movie-card text-center p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-purple-300/80 bg-gradient-to-br from-purple-950/80 to-purple-900/80 drop-shadow-md rounded-2xl overflow-hidden outline outline-2 outline-purple-400/60">
                    <IonIcon icon={film} className="text-5xl text-purple-300 mb-4 animate-pulse" />
                    <h3 className="text-3xl font-bold text-gray-400 drop-shadow-md">{adminMovies.length}</h3>
                    <p className="text-gray-300 font-medium text-md mt-2">Films</p>
                  </div>

                  <div className="premium-movie-card text-center p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-green-300/80 bg-gradient-to-br from-green-950/80 to-green-900/80 drop-shadow-md rounded-2xl overflow-hidden outline outline-2 outline-green-400/60">
                    <IonIcon icon={heart} className="text-5xl text-green-300 mb-4 animate-pulse" />
                    <h3 className="text-3xl font-bold text-gray-400 drop-shadow-md">
                      {adminUsers.reduce((total, user) => total + user.favoritesCount, 0)}
                    </h3>
                    <p className="text-gray-300 font-medium text-md mt-2">Favoris total</p>
                  </div>

                  <div className="premium-movie-card text-center p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-2xl border-2 border-orange-300/80 bg-gradient-to-br from-orange-950/80 to-orange-900/80 drop-shadow-md rounded-2xl overflow-hidden outline outline-2 outline-orange-400/60">
                    <IonIcon icon={people} className="text-5xl text-orange-300 mb-4 animate-pulse" />
                    <h3 className="text-3xl font-bold text-gray-400 drop-shadow-md">
                      {adminUsers.filter(user => user.isActive).length}
                    </h3>
                    <p className="text-gray-300 font-medium text-md mt-2">Utilisateurs actifs</p>
                  </div>
                </div>

                {/* Gestion des Films */}
                <IonCard className="rounded-2xl shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80">
                  <IonCardHeader className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-white/10 p-6">
                    <IonCardTitle className="text-2xl font-bold text-white flex items-center">
                      <IonIcon icon={film} className="mr-3 text-indigo-400 text-3xl" />
                      Gestion des Films
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="p-6">
                    <IonButton 
                      fill='clear'
                      onClick={() => setShowMovieModal(true)}
                      className="premium-btn bg-gradient-to-r from-green-500 to-blue-500 mb-6 rounded-xl hover:scale-105 hover:shadow-xl transition-transform duration-300 border border-green-400/50 animate-bounce"
                    >
                      <IonIcon icon={add} slot="start" />
                      Ajouter un film
                    </IonButton>

                    <h3 className="font-semibold text-white mb-4 text-xl flex items-center">
                      <IonIcon icon={film} className="mr-2 text-purple-400" />
                      Films de la base ({adminMovies.length})
                    </h3>

                    {adminMovies.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <IonIcon icon={film} className="text-5xl mb-3 text-indigo-400/50" />
                        <p>Aucun film dans la base de données</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {adminMovies.map(movie => (
                          <div key={movie.id} className="flex items-center space-x-4 p-4 bg-gray-700/30 rounded-xl border border-white/10 hover:bg-gray-700/50 transition-colors duration-300 outline outline-2 outline-indigo-400/60">
                            {movie.posterPath && (
                              <img
                                src={movie.posterPath}
                                alt={movie.title}
                                className="w-16 h-20 object-cover rounded-lg shadow-md border border-white/20"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white truncate">{movie.title}</h4>
                              <p className="text-sm text-gray-400 truncate">
                                {movie.overview || 'Aucune description'}
                              </p>
                              {movie.releaseDate && (
                                <p className="text-xs text-gray-500">
                                  Sortie: {new Date(movie.releaseDate).toLocaleDateString('fr-FR')}
                                </p>
                              )}
                            </div>
                            <IonButton
                              fill='clear'
                              onClick={(e) => {
                                e.stopPropagation();
                                // Map the movie data to match the AdminMovie interface
                                const movieData: AdminMovie = {
                                  id: movie.id,
                                  title: movie.title,
                                  overview: movie.overview,
                                  releaseDate: movie.releaseDate,
                                  posterPath: movie.posterPath,
                                  genreIds: movie.genreIds || [],
                                  isActive: movie.isActive ?? true,
                                  createdAt: movie.createdAt || new Date().toISOString(),
                                  updatedAt: new Date().toISOString()
                                };
                                setEditingMovie(movieData);
                                setNewMovie({
                                  title: movie.title || '',
                                  overview: movie.overview || '',
                                  releaseDate: movie.releaseDate || '',
                                  genreIds: movie.genreIds || [],
                                  posterPath: movie.posterPath || ''
                                });
                                setShowMovieModal(true);
                              }}>
                              <IonIcon icon={create} color='success' slot="start" />
                            </IonButton>
                            <IonBadge color={movie.isActive ? "success" : "medium"} className="rounded-full px-3 py-1 text-xs font-semibold">
                              {movie.isActive ? "Actif" : "Inactif"}
                            </IonBadge>
                          </div>
                        ))}
                      </div>
                    )}
                  </IonCardContent>
                </IonCard>

                {/* Gestion des Utilisateurs */}
                <IonCard className="rounded-2xl shadow-2xl border-0 overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80">
                  <IonCardHeader className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-b border-white/10 p-6">
                    <IonCardTitle className="text-2xl font-bold text-white flex items-center">
                      <IonIcon icon={person} className="mr-3 text-green-400 text-3xl" />
                      Gestion des Utilisateurs
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent className="p-6">
                    <h3 className="font-semibold text-white mb-4 text-xl flex items-center">
                      <IonIcon icon={people} className="mr-2 text-blue-400" />
                      Utilisateurs ({adminUsers.length})
                    </h3>

                    {adminUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <IonIcon icon={person} className="text-5xl mb-3 text-green-400/50" />
                        <p>Aucun utilisateur trouvé</p>
                      </div>
                    ) : (
                      <IonList className="bg-transparent space-y-3">
                        {adminUsers.map(renderAdminUser)}
                      </IonList>
                    )}
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </div>
        )}

        {/* Scroll infini */}
        <IonInfiniteScroll onIonInfinite={loadMoreMovies}>
          <IonInfiniteScrollContent
            loadingSpinner="bubbles"
            loadingText="Chargement de plus de films..."
          />
        </IonInfiniteScroll>

        {/* Modal de création de film */}
        <IonModal 
          style={{
            '--height': 'calc(100% - 100px)',
            '--border-radius': '18px',
            '--top': '50%',
            '--left': '50%',
            '--transform': 'translate(-50%, -50%)',
          }}
          isOpen={showMovieModal} 
          onDidDismiss={() => {
            setShowMovieModal(false);
            setEditingMovie(null);
            setNewMovie({
              title: '',
              overview: '',
              releaseDate: '',
              genreIds: [],
              posterPath: ''
            });
          }}>
          <IonHeader>
            <IonToolbar className='text-center'>
              <IonTitle>{editingMovie ? 'Modifier le film' : 'Ajouter un nouveau film'}</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setShowMovieModal(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <div className="space-y-4">
              <IonInput
                label="Titre du film"
                labelPlacement="stacked"
                placeholder="Entrez le titre du film"
                value={newMovie.title}
                onIonInput={(e) => setNewMovie({ ...newMovie, title: e.detail.value! })}
                className="border rounded-lg"
              />

              <IonTextarea
                label="Synopsis"
                labelPlacement="stacked"
                placeholder="Entrez le synopsis du film"
                rows={4}
                value={newMovie.overview}
                onIonInput={(e) => setNewMovie({ ...newMovie, overview: e.detail.value! })}
                className="border rounded-lg"
              />

              <IonInput
                label="Date de sortie"
                labelPlacement="stacked"
                type="date"
                value={newMovie.releaseDate}
                onIonInput={(e) => setNewMovie({ ...newMovie, releaseDate: e.detail.value! })}
                className="border rounded-lg"
              />

              <IonSelect
                label="Genres"
                labelPlacement="stacked"
                multiple
                placeholder="Sélectionnez les genres"
                value={newMovie.genreIds}
                onIonChange={(e) => {
                  setNewMovie({ ...newMovie, genreIds: e.detail.value });
                }}
                className="border rounded-lg"
              >
                {movieGenres
                  .filter(genre => genre.id !== 'all')
                  .map(genre => (
                    <IonSelectOption key={genre.id} value={parseInt(genre.id)}>
                      {genre.name}
                    </IonSelectOption>
                  ))
                }
              </IonSelect>

              <div className="border rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Affiche du film (optionnel)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMoviePoster(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <IonButton
                fill='clear'
                expand="block"
                onClick={editingMovie ? handleUpdateMovie : handleCreateMovie}
                disabled={!newMovie.title || !newMovie.overview || !newMovie.releaseDate || newMovie.genreIds.length === 0}
                className="premium-btn mt-4"
              >
                <IonIcon icon={editingMovie ? create : add} slot="start" />
                {editingMovie ? 'Mettre à jour' : 'Créer le film'}
              </IonButton>
            </div>
          </IonContent>
        </IonModal>

        {/* Modal de détails du film - CORRIGÉ */}
        <IonModal
          isOpen={showDetailModal}
          onDidDismiss={() => setShowDetailModal(false)}
          className="movie-detail-modal"
          style={{
            '--border-radius': '18px',
            '--width': '90%',
            '--max-width': '600px',
            '--height': '90%',
            '--max-height': '800px',
            '--box-shadow': '0 4px 20px rgba(0, 0, 0, 0.2)'
          }}
        >
          {selectedMovie && (
            <>
              <IonHeader className="bg-gray-900 border-b border-white/10">
                <IonToolbar className="bg-transparent text-center">
                  <IonTitle className="text-lg font-bold text-white truncate">
                    {selectedMovie.title}
                  </IonTitle>
                  <IonButton
                    slot="end"
                    fill="clear"
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-300 hover:text-white"
                  >
                    <IonIcon icon={close} />
                  </IonButton>
                </IonToolbar>
              </IonHeader>

              <IonContent className="bg-gray-900">
                <div className="movie-detail-content">
                  {/* Image principale */}
                  <div className="relative">
                    <IonImg
                      src={getImageUrl(selectedMovie.backdrop_path || selectedMovie.poster_path, 'backdrop')}
                      alt={selectedMovie.title}
                      className="w-full h-64 md:h-80 object-cover"
                      onIonError={(e: any) => {
                        e.target.src = getImageUrl(selectedMovie.poster_path, 'poster') || '/assets/images/no-poster.jpg';
                      }}
                    />

                    {/* Overlay avec informations */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {selectedMovie.vote_average && (
                            <div className="flex items-center bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                              <IonIcon icon={star} className="text-yellow-400 mr-1" />
                              <span className="font-bold">{selectedMovie.vote_average.toFixed(1)}/10</span>
                            </div>
                          )}

                          {selectedMovie.release_date && (
                            <div className="flex items-center bg-black/60 text-white px-3 py-1 rounded-full backdrop-blur-sm">
                              <IonIcon icon={calendar} className="mr-1" />
                              <span>{new Date(selectedMovie.release_date).getFullYear()}</span>
                            </div>
                          )}
                        </div>

                        <IonButton
                          fill={isFavorite(selectedMovie.id.toString()) ? "solid" : "outline"}
                          color={isFavorite(selectedMovie.id.toString()) ? "danger" : "light"}
                          onClick={() => handleToggleFavorite(selectedMovie)}
                          className="backdrop-blur-sm"
                        >
                          <IonIcon
                            icon={isFavorite(selectedMovie.id.toString()) ? heart : heartOutline}
                            slot="start"
                          />
                          <span className="text-white">
                            {isFavorite(selectedMovie.id.toString()) ? 'Favori' : 'Ajouter'}
                          </span>
                        </IonButton>
                      </div>
                    </div>
                  </div>

                  {/* Contenu détaillé */}
                  <div className="p-6 space-y-6">
                    {/* Genres */}
                    {selectedMovie.genre_names && selectedMovie.genre_names.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedMovie.genre_names.map((genre, index) => (
                          <IonBadge key={index} color="primary" className="text-sm">
                            {genre}
                          </IonBadge>
                        ))}
                      </div>
                    )}

                    {/* Synopsis */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                        <IonIcon icon={informationCircle} className="mr-2 text-blue-400" />
                        Synopsis
                      </h3>
                      <p className="text-gray-300 leading-relaxed">
                        {selectedMovie.overview || 'Aucun synopsis disponible pour ce film.'}
                      </p>
                    </div>

                    {/* Informations détaillées */}
                    <div className="grid grid-cols-2 gap-4">
                      {selectedMovie.release_date && (
                        <div className="bg-gray-800 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center text-gray-400 mb-1">
                            <IonIcon icon={calendar} className="mr-2" />
                            <span className="text-sm font-medium">Date de sortie</span>
                          </div>
                          <p className="text-white font-semibold">
                            {new Date(selectedMovie.release_date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}

                      {selectedMovie.vote_average && (
                        <div className="bg-gray-800 rounded-lg p-4 border border-white/10">
                          <div className="flex items-center text-gray-400 mb-1">
                            <IonIcon icon={star} className="mr-2 text-yellow-400" />
                            <span className="text-sm font-medium">Note moyenne</span>
                          </div>
                          <p className="text-white font-semibold">
                            {selectedMovie.vote_average.toFixed(1)}/10
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                      <IonButton
                        expand="block"
                        fill="clear"
                        
                        onClick={() => {
                          handleToggleFavorite(selectedMovie);
                        }}
                        className="flex-1 premium-btn"
                          style={{
    '--color': 'white',
    '--color-hover': 'white',
    '--color-activated': 'white',
    '--color-focused': 'white'
  }}
                      >
                        <IonIcon
                        
                          icon={isFavorite(selectedMovie.id.toString()) ? heart : heartOutline}
                          slot="start"
                          style={{ color: 'white' }}
                        />
                         <span style={{ color: 'white' }}>
    {isFavorite(selectedMovie.id.toString()) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
  </span>
</IonButton>

                      <IonButton
                        expand="block"
                        fill="outline"
                        onClick={() => setShowDetailModal(false)}
                        className="flex-1"
                      >
                        <IonIcon icon={close} slot="start" />
                        Fermer
                      </IonButton>
                    </div>
                  </div>
                </div>
              </IonContent>
            </>
          )}
        </IonModal>

        {/* Modal de confirmation de déconnexion */}
        <IonModal style={{'--border-radius': '20px'}} isOpen={showLogoutConfirm} onDidDismiss={() => setShowLogoutConfirm(false)}>
          <div className="premium-movie-card bg-transparent p-6 text-center justify-center items-center w-full h-full flex flex-col">
            <IonIcon icon={logOutOutline} className="text-4xl text-indigo-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Déconnexion</h3>
            <p className="text-gray-300 mb-6">Êtes-vous sûr de vouloir vous déconnecter ?</p>
            <div className="flex space-x-7">
              <IonButton
                expand="block"
                fill="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Annuler
              </IonButton>
              <IonButton
                expand="block"
                fill="solid"
                color="danger"
                onClick={handleLogout}
                className="flex-1"
              >
                Déconnexion
              </IonButton>
            </div>
          </div>
        </IonModal>

        {/* Modal de modification d'utilisateur */}
        <IonModal isOpen={isEditModalOpen} onDidDismiss={() => setIsEditModalOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>Modifier l'utilisateur</IonTitle>
              <IonButton slot="end" fill="clear" onClick={() => setIsEditModalOpen(false)}>
                <IonIcon icon={close} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {editingUser && (
              <div className="space-y-4">
                <IonItem>
                  <IonLabel position="stacked">Prénom</IonLabel>
                  <IonInput
                    value={editingUser.prenom}
                    onIonChange={e => setEditingUser({...editingUser, prenom: e.detail.value || ''})}
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="stacked">Nom</IonLabel>
                  <IonInput
                    value={editingUser.nom}
                    onIonChange={e => setEditingUser({...editingUser, nom: e.detail.value || ''})}
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={editingUser.email}
                    onIonChange={e => setEditingUser({...editingUser, email: e.detail.value || ''})}
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel>Compte actif</IonLabel>
                  <IonToggle
                    checked={editingUser.isActive}
                    onIonChange={e => setEditingUser({...editingUser, isActive: e.detail.checked})}
                  />
                </IonItem>
                
                <div className="ion-padding">
                  <IonButton
                    expand="block"
                    onClick={() => handleSaveUser(editingUser)}
                    className="mt-4"
                  >
                    Enregistrer les modifications
                  </IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Gestion des erreurs */}
        <ErrorAlert
          isOpen={showError}
          message={error || "Une erreur est survenue"}
          onDismiss={() => {
            setShowError(false);
            clearError();
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
