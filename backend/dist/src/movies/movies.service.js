"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../shared/firebase.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const config_1 = require("@nestjs/config");
let MoviesService = class MoviesService {
    firebaseService;
    configService;
    cloudinaryService;
    moviedbApiKey;
    moviedbBaseUrl = 'https://api.themoviedb.org/3';
    constructor(firebaseService, configService, cloudinaryService) {
        this.firebaseService = firebaseService;
        this.configService = configService;
        this.cloudinaryService = cloudinaryService;
        this.moviedbApiKey = this.configService.get('MOVIEDB_API_KEY') || '';
    }
    async makeMovieDbRequest(endpoint, params = '') {
        try {
            const url = `${this.moviedbBaseUrl}${endpoint}?api_key=${this.moviedbApiKey}&language=fr-FR${params}`;
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`MovieDB API error: ${response.status}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error('MovieDB API Error:', error);
            throw new Error('Erreur lors de la récupération des données films');
        }
    }
    async searchMovies(query, page = 1) {
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
        }
        catch (error) {
            throw new common_1.BadRequestException('Erreur lors de la recherche de films');
        }
    }
    async getPopularMovies(page = 1) {
        try {
            const data = await this.makeMovieDbRequest('/movie/popular', `&page=${page}`);
            return {
                results: data.results || [],
                total_pages: data.total_pages || 0
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Erreur lors du chargement des films populaires');
        }
    }
    async getMovieDetails(movieId) {
        try {
            return await this.makeMovieDbRequest(`/movie/${movieId}`);
        }
        catch (error) {
            throw new common_1.BadRequestException('Erreur lors de la récupération des détails du film');
        }
    }
    async addToFavorites(userId, addFavoriteDto) {
        const userDoc = await this.firebaseService.doc('users', userId).get();
        if (!userDoc.exists) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const user = userDoc.data();
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const favorites = user.favorites || [];
        const existingFavorite = favorites.find((fav) => fav.movieId === addFavoriteDto.movieId);
        if (existingFavorite) {
            throw new common_1.BadRequestException('Film déjà dans les favoris');
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
    async removeFromFavorites(userId, movieId) {
        const userDoc = await this.firebaseService.doc('users', userId).get();
        if (!userDoc.exists) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const user = userDoc.data();
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const favorites = user.favorites || [];
        const updatedFavorites = favorites.filter((fav) => fav.movieId !== movieId);
        await this.firebaseService.update('users', userId, {
            favorites: updatedFavorites
        });
        return { message: 'Film retiré des favoris', movieId };
    }
    async getUserFavorites(userId) {
        const userDoc = await this.firebaseService.doc('users', userId).get();
        if (!userDoc.exists) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const user = userDoc.data();
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        return user.favorites || [];
    }
    async createMovie(createMovieDto, posterFile) {
        let genreIds = createMovieDto.genreIds;
        if (typeof genreIds === 'string') {
            try {
                genreIds = JSON.parse(genreIds);
            }
            catch (error) {
                console.log('❌ Erreur parsing genreIds JSON:', error);
                genreIds = [];
            }
        }
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
            genreIds,
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
    async findMatchingUsers(userId, threshold = 0.20) {
        const currentUserDoc = await this.firebaseService.doc('users', userId).get();
        if (!currentUserDoc.exists) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const currentUser = currentUserDoc.data();
        if (!currentUser) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        if (currentUser.role === 'admin') {
            console.log('⚠️ Admin user - no matches returned');
            return [];
        }
        const currentUserFavorites = currentUser.favorites || [];
        const currentUserMovieIds = new Set(currentUserFavorites.map((fav) => fav.movieId));
        console.log(`🔍 Finding matches for user ${userId}`);
        console.log(`📊 Current user has ${currentUserFavorites.length} favorites:`, [...currentUserMovieIds]);
        const allUsers = await this.firebaseService.findAll('users', {
            field: 'isActive',
            operator: '==',
            value: true
        });
        const matchingUsers = [];
        console.log(`👥 Found ${allUsers.length} active users to check`);
        for (const user of allUsers) {
            if (user.id === userId || user.role === 'admin')
                continue;
            const userFavorites = user.favorites || [];
            const userMovieIds = new Set(userFavorites.map((fav) => fav.movieId));
            const intersection = new Set([...currentUserMovieIds].filter(movieId => userMovieIds.has(movieId)));
            const union = new Set([...currentUserMovieIds, ...userMovieIds]);
            const similarity = union.size > 0 ? intersection.size / union.size : 0;
            console.log(`👤 User ${user.prenom} ${user.nom}:`);
            console.log(`   - Has ${userFavorites.length} favorites:`, [...userMovieIds]);
            console.log(`   - Common movies: ${intersection.size}/${union.size}`);
            console.log(`   - Similarity: ${Math.round(similarity * 100)}% (threshold: ${Math.round(threshold * 100)}%)`);
            if (similarity >= threshold) {
                console.log(`   ✅ MATCH! Adding to results`);
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
            }
            else {
                console.log(`   ❌ Below threshold`);
            }
        }
        console.log(`\n🎯 Total matches found: ${matchingUsers.length}`);
        return matchingUsers.sort((a, b) => b.similarity - a.similarity);
    }
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
    async toggleUserStatus(userId) {
        const userDoc = await this.firebaseService.doc('users', userId).get();
        if (!userDoc.exists) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const user = userDoc.data();
        if (!user) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
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
    async sendMatchRequest(fromUserId, toUserId) {
        const fromUser = await this.firebaseService.findById('users', fromUserId);
        const toUser = await this.firebaseService.findById('users', toUserId);
        if (!fromUser || !toUser) {
            throw new common_1.NotFoundException('Utilisateur non trouvé');
        }
        const existingRequests = await this.firebaseService.findAll('matchRequests');
        const existing = existingRequests.find((req) => (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
            (req.fromUserId === toUserId && req.toUserId === fromUserId));
        if (existing) {
            if (existing.status === 'pending') {
                throw new common_1.BadRequestException('Une demande est déjà en attente');
            }
            if (existing.status === 'accepted') {
                throw new common_1.BadRequestException('Vous êtes déjà matchés');
            }
            if (existing.status === 'declined') {
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
    async respondToMatchRequest(requestId, userId, status) {
        const requestDoc = await this.firebaseService.doc('matchRequests', requestId).get();
        if (!requestDoc.exists) {
            throw new common_1.NotFoundException('Demande non trouvée');
        }
        const request = requestDoc.data();
        if (!request) {
            throw new common_1.NotFoundException('Données de la demande introuvables');
        }
        console.log('🔍 Respond to match request:');
        console.log('   Request ID:', requestId);
        console.log('   Current User ID:', userId);
        console.log('   Request fromUserId:', request.fromUserId);
        console.log('   Request toUserId:', request.toUserId);
        console.log('   Request status:', request.status);
        if (request.toUserId !== userId) {
            console.log('❌ FORBIDDEN: User is not the recipient');
            throw new common_1.ForbiddenException('Vous ne pouvez pas répondre à cette demande');
        }
        if (request.status !== 'pending') {
            throw new common_1.BadRequestException('Cette demande a déjà été traitée');
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
    async getMatchRequests(userId) {
        const allRequests = await this.firebaseService.findAll('matchRequests');
        const receivedRequests = allRequests.filter((req) => req.toUserId === userId && req.status === 'pending');
        const requestsWithDetails = await Promise.all(receivedRequests.map(async (req) => {
            const fromUser = await this.firebaseService.findById('users', req.fromUserId);
            return {
                id: req.id,
                fromUserId: req.fromUserId,
                fromUserName: `${fromUser.prenom} ${fromUser.nom}`,
                fromUserPhoto: fromUser.photoUrl,
                status: req.status,
                createdAt: req.createdAt
            };
        }));
        return requestsWithDetails;
    }
    async getMatchStatus(userId, otherUserId) {
        const allRequests = await this.firebaseService.findAll('matchRequests');
        const matchRequest = allRequests.find((req) => (req.fromUserId === userId && req.toUserId === otherUserId) ||
            (req.fromUserId === otherUserId && req.toUserId === userId));
        if (!matchRequest) {
            return { status: 'none', requestId: null };
        }
        return {
            status: matchRequest.status,
            requestId: matchRequest.id,
            isSender: matchRequest.fromUserId === userId
        };
    }
};
exports.MoviesService = MoviesService;
exports.MoviesService = MoviesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        config_1.ConfigService,
        cloudinary_service_1.CloudinaryService])
], MoviesService);
//# sourceMappingURL=movies.service.js.map