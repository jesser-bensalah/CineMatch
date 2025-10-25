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
export declare class MoviesService {
    private firebaseService;
    private configService;
    private cloudinaryService;
    private moviedbApiKey;
    private moviedbBaseUrl;
    constructor(firebaseService: FirebaseService, configService: ConfigService, cloudinaryService: CloudinaryService);
    private makeMovieDbRequest;
    searchMovies(query: string, page?: number): Promise<{
        results: any;
        total_pages: any;
        total_results: any;
    }>;
    getPopularMovies(page?: number): Promise<{
        results: any;
        total_pages: any;
    }>;
    getMovieDetails(movieId: string): Promise<any>;
    addToFavorites(userId: string, addFavoriteDto: AddFavoriteDto): Promise<{
        movieId: string;
        movieTitle: string;
        moviePoster: string | undefined;
        addedAt: string;
    }>;
    removeFromFavorites(userId: string, movieId: string): Promise<{
        message: string;
        movieId: string;
    }>;
    getUserFavorites(userId: string): Promise<any>;
    createMovie(createMovieDto: CreateMovieDto, posterFile?: Express.Multer.File): Promise<{
        genreIds: number[];
        posterPath: string | undefined;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        title: string;
        overview?: string;
        releaseDate?: string;
        backdropPath?: string;
        originalLanguage?: string;
        id: string;
    }>;
    getAdminMovies(): Promise<{
        id: string;
    }[]>;
    deleteMovie(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateMovie(id: string, updateMovieDto: CreateMovieDto, posterFile?: Express.Multer.File): Promise<{
        id: string;
    }>;
    findMatchingUsers(userId: string, threshold?: number): Promise<MatchingUser[]>;
    getAllUsers(): Promise<{
        id: any;
        nom: any;
        prenom: any;
        email: any;
        age: any;
        photoUrl: any;
        isActive: any;
        favoritesCount: any;
        createdAt: any;
    }[]>;
    toggleUserStatus(userId: string): Promise<{
        message: string;
        isActive: boolean;
    }>;
    sendMatchRequest(fromUserId: string, toUserId: string): Promise<{
        id: any;
        message: string;
    }>;
    cancelMatchRequest(requestId: string, userId: string): Promise<{
        message: string;
        requestId: string;
    }>;
    respondToMatchRequest(requestId: string, userId: string, status: 'accepted' | 'declined'): Promise<{
        message: string;
        status: "accepted" | "declined";
    }>;
    getMatchRequests(userId: string): Promise<{
        id: any;
        fromUserId: any;
        fromUserName: string;
        fromUserPhoto: any;
        status: any;
        createdAt: any;
    }[]>;
    unmatch(requestId: string, userId: string): Promise<{
        message: string;
        requestId: string;
    }>;
    getMatchStatus(userId: string, otherUserId: string): Promise<{
        status: string;
        requestId: null;
        isSender?: undefined;
    } | {
        status: any;
        requestId: any;
        isSender: boolean;
    }>;
}
