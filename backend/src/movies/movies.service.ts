import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../shared/firebase.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
import { ConfigService } from '@nestjs/config';


export interface MatchingUser {
  userId: string;
  nom: string;
  prenom: string;
  photoUrl: string;
  similarity: number;
  commonMovies: number;
  totalFavorites: number;
}

@Injectable()
export class MoviesService {
  private moviedbApiKey: string;
  private moviedbBaseUrl = 'https://api.themoviedb.org/3';

  constructor(
    private firebaseService: FirebaseService,
    private configService: ConfigService,
    private cloudinaryService: CloudinaryService,
  ) {
    this.moviedbApiKey = this.configService.get<string>('MOVIEDB_API_KEY') || '';
  }

  private async makeMovieDbRequest(endpoint: string, params: string = '') {
    try {
      const url = `${this.moviedbBaseUrl}${endpoint}?api_key=${this.moviedbApiKey}&language=fr-FR${params}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`MovieDB API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('MovieDB API Error:', error);
      throw new Error('Erreur lors de la récupération des données films');
    }
  }

  async searchMovies(query: string, page: number = 1) {
    if (!query.trim()) {
      return { results: [], total_pages: 0, total_results: 0 };
    }

    try {
      const data = await this.makeMovieDbRequest('/search/movie', `&query=${encodeURIComponent(query)}&page=${page}`);
      return {
        results: data.results || [],
        total_pages: data.total_pages || 0,
        total_results: data.total_results || 0
      };
    } catch (error) {
      throw new BadRequestException('Erreur lors de la recherche de films');
    }
  }

  async getPopularMovies(page: number = 1) {
    try {
      const data = await this.makeMovieDbRequest('/movie/popular', `&page=${page}`);
      return {
        results: data.results || [],
        total_pages: data.total_pages || 0
      };
    } catch (error) {
      throw new BadRequestException('Erreur lors du chargement des films populaires');
    }
  }

  async getMovieDetails(movieId: string) {
    try {
      return await this.makeMovieDbRequest(`/movie/${movieId}`);
    } catch (error) {
      throw new BadRequestException('Erreur lors de la récupération des détails du film');
    }
  }

  async addToFavorites(userId: string, addFavoriteDto: AddFavoriteDto) {
    const userDoc = await this.firebaseService.doc('users', userId).get();

    if (!userDoc.exists) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const user = userDoc.data();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const favorites = user.favorites || [];

    const existingFavorite = favorites.find((fav: any) => fav.movieId === addFavoriteDto.movieId);
    if (existingFavorite) {
      throw new BadRequestException('Film déjà dans les favoris');
    }

    const newFavorite = {
      movieId: addFavoriteDto.movieId,
      movieTitle: addFavoriteDto.movieTitle,
      moviePoster: addFavoriteDto.moviePoster,
      addedAt: new Date().toISOString()
    };

    const updatedFavorites = [...favorites, newFavorite];

    await this.firebaseService.update('users', userId, {
      favorites: updatedFavorites
    });

    return newFavorite;
  }

  async removeFromFavorites(userId: string, movieId: string) {
    const userDoc = await this.firebaseService.doc('users', userId).get();

    if (!userDoc.exists) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const user = userDoc.data();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const favorites = user.favorites || [];
    const updatedFavorites = favorites.filter((fav: any) => fav.movieId !== movieId);

    await this.firebaseService.update('users', userId, {
      favorites: updatedFavorites
    });

    return { message: 'Film retiré des favoris', movieId };
  }

  async getUserFavorites(userId: string) {
    const userDoc = await this.firebaseService.doc('users', userId).get();

    if (!userDoc.exists) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const user = userDoc.data();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user.favorites || [];
  }
  async createMovie(createMovieDto: CreateMovieDto, posterFile?: Express.Multer.File) {
    // CORRECTION : Parser genreIds si c'est une chaîne JSON
    let genreIds = createMovieDto.genreIds;

    if (typeof genreIds === 'string') {
      try {
        genreIds = JSON.parse(genreIds);
      } catch (error) {
        console.log('❌ Erreur parsing genreIds JSON:', error);
        genreIds = [];
      }
    }

    // S'assurer que c'est un tableau de nombres
    if (!Array.isArray(genreIds)) {
      genreIds = [];
    }

    genreIds = genreIds.map(id => Number(id)).filter(id => !isNaN(id) && id !== 0);

    let posterUrl = createMovieDto.posterPath;

    if (posterFile) {
      posterUrl = await this.cloudinaryService.uploadMovieImage(posterFile);
    }

    const movieData = {
      ...createMovieDto,
      genreIds, // Utiliser le tableau validé de nombres
      posterPath: posterUrl,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const movieRef = await this.firebaseService.create('movies', movieData);
    return {
      id: movieRef.id,
      ...movieData
    };
  }

  async getAdminMovies() {
    return await this.firebaseService.findAll('movies');
  }

  // Matching algorithm
  // Dans la méthode findMatchingUsers, assurez-vous que l'admin est exclu
  async findMatchingUsers(userId: string, threshold: number = 0.75): Promise<MatchingUser[]> {
    const currentUserDoc = await this.firebaseService.doc('users', userId).get();

    if (!currentUserDoc.exists) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const currentUser = currentUserDoc.data();
    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Si c'est un admin, retourner un tableau vide (les admins n'ont pas de matches)
    if (currentUser.role === 'admin') {

      return [];
    }

    const currentUserFavorites = currentUser.favorites || [];
    const currentUserMovieIds = new Set(currentUserFavorites.map((fav: any) => fav.movieId));

    const allUsers = await this.firebaseService.findAll('users', {
      field: 'isActive',
      operator: '==',
      value: true
    });

    const matchingUsers: MatchingUser[] = [];

    for (const user of allUsers) {
      // Exclure l'utilisateur courant et les admins
      if (user.id === userId || user.role === 'admin') continue;

      const userFavorites = user.favorites || [];
      const userMovieIds = new Set(userFavorites.map((fav: any) => fav.movieId));

      // Coefficient de Jaccard
      const intersection = new Set(
        [...currentUserMovieIds].filter(movieId => userMovieIds.has(movieId))
      );
      const union = new Set([...currentUserMovieIds, ...userMovieIds]);

      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      if (similarity >= threshold) {
        matchingUsers.push({
          userId: user.id,
          nom: user.nom,
          prenom: user.prenom,
          photoUrl: user.photoUrl,
          similarity: Math.round(similarity * 100),
          commonMovies: intersection.size,
          totalFavorites: userFavorites.length
        });
      }
    }

    return matchingUsers.sort((a, b) => b.similarity - a.similarity);
  }

  // Gestion des utilisateurs (Admin)
  async getAllUsers() {
    const users = await this.firebaseService.findAll('users', {
      field: 'role',
      operator: '==',
      value: 'user'
    });

    return users.map(user => ({
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      age: user.age,
      photoUrl: user.photoUrl,
      isActive: user.isActive,
      favoritesCount: user.favorites?.length || 0,
      createdAt: user.createdAt
    }));
  }

  async toggleUserStatus(userId: string) {
    const userDoc = await this.firebaseService.doc('users', userId).get();

    if (!userDoc.exists) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const user = userDoc.data();
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const newStatus = !user.isActive;

    await this.firebaseService.update('users', userId, {
      isActive: newStatus
    });

    return {
      message: `Utilisateur ${newStatus ? 'activé' : 'désactivé'}`,
      isActive: newStatus
    };
  }
}