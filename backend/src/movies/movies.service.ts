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
  matchStatus?: 'none' | 'pending' | 'accepted' | 'declined';
  matchRequestId?: string;
  isSender?: boolean;
}

export interface MatchRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
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
  // findMatchingUsers,
  async findMatchingUsers(userId: string, threshold: number = 0.20): Promise<MatchingUser[]> {
    const currentUserDoc = await this.firebaseService.doc('users', userId).get();

    if (!currentUserDoc.exists) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const currentUser = currentUserDoc.data();
    if (!currentUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // les admins n'ont pas de matches
    if (currentUser.role === 'admin') {
      console.log('⚠️ Admin user - no matches returned');
      return [];
    }

    const currentUserFavorites = currentUser.favorites || [];
    const currentUserMovieIds = new Set(currentUserFavorites.map((fav: any) => fav.movieId));
    
    console.log(`🔍 Finding matches for user ${userId}`);
    console.log(`📊 Current user has ${currentUserFavorites.length} favorites:`, [...currentUserMovieIds]);

    const allUsers = await this.firebaseService.findAll('users', {
      field: 'isActive',
      operator: '==',
      value: true
    });

    const matchingUsers: MatchingUser[] = [];
    
    console.log(`👥 Found ${allUsers.length} active users to check`);

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
      
      console.log(`👤 User ${user.prenom} ${user.nom}:`);
      console.log(`   - Has ${userFavorites.length} favorites:`, [...userMovieIds]);
      console.log(`   - Common movies: ${intersection.size}/${union.size}`);
      console.log(`   - Similarity: ${Math.round(similarity * 100)}% (threshold: ${Math.round(threshold * 100)}%)`);

      if (similarity >= threshold) {
        console.log(`   ✅ MATCH! Adding to results`);
        
        // Get match status for this user
        const matchStatus = await this.getMatchStatus(userId, user.id);
        
        matchingUsers.push({
          userId: user.id,
          nom: user.nom,
          prenom: user.prenom,
          photoUrl: user.photoUrl,
          similarity: Math.round(similarity * 100),
          commonMovies: intersection.size,
          totalFavorites: userFavorites.length,
          matchStatus: matchStatus.status,
          matchRequestId: matchStatus.requestId,
          isSender: matchStatus.isSender
        });
      } else {
        console.log(`   ❌ Below threshold`);
      }
    }

    console.log(`\n🎯 Total matches found: ${matchingUsers.length}`);
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

  // Match Request Methods
  async sendMatchRequest(fromUserId: string, toUserId: string) {
    // Check if users exist
    const fromUser = await this.firebaseService.findById('users', fromUserId);
    const toUser = await this.firebaseService.findById('users', toUserId);

    if (!fromUser || !toUser) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Check if request already exists
    const existingRequests = await this.firebaseService.findAll('matchRequests');
    const existing = existingRequests.find(
      (req: any) =>
        (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
        (req.fromUserId === toUserId && req.toUserId === fromUserId)
    );

    if (existing) {
      if (existing.status === 'pending') {
        throw new BadRequestException('Une demande est déjà en attente');
      }
      if (existing.status === 'accepted') {
        throw new BadRequestException('Vous êtes déjà matchés');
      }
      // If declined, allow sending a new request
      if (existing.status === 'declined') {
        // Update the existing request
        await this.firebaseService.update('matchRequests', existing.id, {
          status: 'pending',
          fromUserId,
          toUserId,
          updatedAt: new Date().toISOString()
        });
        return {
          id: existing.id,
          message: 'Demande de match envoyée'
        };
      }
    }

    // Create new match request
    const matchRequest = {
      fromUserId,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const requestRef = await this.firebaseService.create('matchRequests', matchRequest);

    return {
      id: requestRef.id,
      message: 'Demande de match envoyée'
    };
  }

  async respondToMatchRequest(requestId: string, userId: string, status: 'accepted' | 'declined') {
    // Use doc().get() directly to get match request data
    const requestDoc = await this.firebaseService.doc('matchRequests', requestId).get();

    if (!requestDoc.exists) {
      throw new NotFoundException('Demande non trouvée');
    }

    const request = requestDoc.data();
    
    if (!request) {
      throw new NotFoundException('Données de la demande introuvables');
    }

    console.log('🔍 Respond to match request:');
    console.log('   Request ID:', requestId);
    console.log('   Current User ID:', userId);
    console.log('   Request fromUserId:', request.fromUserId);
    console.log('   Request toUserId:', request.toUserId);
    console.log('   Request status:', request.status);

    // Only the recipient can respond
    if (request.toUserId !== userId) {
      console.log('❌ FORBIDDEN: User is not the recipient');
      throw new ForbiddenException('Vous ne pouvez pas répondre à cette demande');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException('Cette demande a déjà été traitée');
    }

    await this.firebaseService.update('matchRequests', requestId, {
      status,
      updatedAt: new Date().toISOString()
    });

    return {
      message: status === 'accepted' ? 'Match accepté' : 'Match refusé',
      status
    };
  }

  async getMatchRequests(userId: string) {
    const allRequests = await this.firebaseService.findAll('matchRequests');
    
    // Get requests sent to this user (pending)
    const receivedRequests = allRequests.filter(
      (req: any) => req.toUserId === userId && req.status === 'pending'
    );

    // Get user details for each request
    const requestsWithDetails = await Promise.all(
      receivedRequests.map(async (req: any) => {
        const fromUser = await this.firebaseService.findById('users', req.fromUserId);
        return {
          id: req.id,
          fromUserId: req.fromUserId,
          fromUserName: `${fromUser.prenom} ${fromUser.nom}`,
          fromUserPhoto: fromUser.photoUrl,
          status: req.status,
          createdAt: req.createdAt
        };
      })
    );

    return requestsWithDetails;
  }

  async getMatchStatus(userId: string, otherUserId: string) {
    const allRequests = await this.firebaseService.findAll('matchRequests');
    
    const matchRequest = allRequests.find(
      (req: any) =>
        (req.fromUserId === userId && req.toUserId === otherUserId) ||
        (req.fromUserId === otherUserId && req.toUserId === userId)
    );

    if (!matchRequest) {
      return { status: 'none', requestId: null };
    }

    return {
      status: matchRequest.status,
      requestId: matchRequest.id,
      isSender: matchRequest.fromUserId === userId
    };
  }
}