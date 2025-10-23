import type { Request as ExpressRequest } from 'express';
import { MatchingUser, MoviesService } from './movies.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { CreateMovieDto } from './dto/create-movie.dto';
type Request = ExpressRequest;
export declare class MoviesController {
    private moviesService;
    constructor(moviesService: MoviesService);
    addToFavorites(req: Request, addFavoriteDto: AddFavoriteDto): Promise<{
        movieId: string;
        movieTitle: string;
        moviePoster: string | undefined;
        addedAt: string;
    }>;
    removeFromFavorites(req: Request, movieId: string): Promise<{
        message: string;
        movieId: string;
    }>;
    getUserFavorites(req: Request): Promise<any>;
    getPopularMovies(page?: number): Promise<{
        results: any;
        total_pages: any;
    }>;
    searchMovies(query: string, page?: number): Promise<{
        results: any;
        total_pages: any;
        total_results: any;
    }>;
    getMatchingUsers(req: Request): Promise<MatchingUser[]>;
    getAdminMovies(): Promise<any[]>;
    createMovie(createMovieDto: CreateMovieDto, posterFile: Express.Multer.File, req: Request): Promise<{
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
    sendMatchRequest(req: Request, targetUserId: string): Promise<{
        id: any;
        message: string;
    }>;
    respondToMatchRequest(req: Request, requestId: string, body: {
        status: 'accepted' | 'declined';
    }): Promise<{
        message: string;
        status: "accepted" | "declined";
    }>;
    getMatchRequests(req: Request): Promise<{
        id: any;
        fromUserId: any;
        fromUserName: string;
        fromUserPhoto: any;
        status: any;
        createdAt: any;
    }[]>;
}
export {};
