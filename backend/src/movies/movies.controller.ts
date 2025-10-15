import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Request as NestRequest,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Delete,
  Param,
  Req
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchingUser, MoviesService } from './movies.service';
import { JwtAuthGuard, AdminGuard } from '../auth/auth.guard';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { CreateMovieDto } from './dto/create-movie.dto';

// Type personnalisé pour éviter les conflits
type Request = ExpressRequest;

@Controller('movies')
export class MoviesController {
  constructor(private moviesService: MoviesService) { }

  // Routes publiques (avec auth)
  @UseGuards(JwtAuthGuard)
  @Post('favorites')
  @HttpCode(HttpStatus.CREATED)
  async addToFavorites(@Req() req: Request, @Body() addFavoriteDto: AddFavoriteDto) {
    return this.moviesService.addToFavorites((req as any).user.id, addFavoriteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('favorites/:movieId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFromFavorites(@Req() req: Request, @Param('movieId') movieId: string) {
    return this.moviesService.removeFromFavorites((req as any).user.id, movieId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async getUserFavorites(@Req() req: Request) {
    return this.moviesService.getUserFavorites((req as any).user.id);
  }

  @Get('popular')
  async getPopularMovies(@Query('page') page: number = 1) {
    return this.moviesService.getPopularMovies(page);
  }

  @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchMovies(@Query('q') query: string, @Query('page') page: number = 1) {
    return this.moviesService.searchMovies(query, page);
  }

  @UseGuards(JwtAuthGuard)
  @Get('matching-users')
  async getMatchingUsers(@Req() req: Request): Promise<MatchingUser[]> {
    return this.moviesService.findMatchingUsers((req as any).user.id);
  }

  // Route accessible à tous les utilisateurs authentifiés pour voir les films admin
  @UseGuards(JwtAuthGuard)
  @Get('admin/list')
  async getAdminMovies() {
    return this.moviesService.getAdminMovies();
  }

  // Routes Admin uniquement
  @UseGuards(AdminGuard)
  @Post('admin/create')
  @UseInterceptors(FileInterceptor('poster'))
  @HttpCode(HttpStatus.CREATED)
  async createMovie(
    @Body() createMovieDto: CreateMovieDto,
    @UploadedFile() posterFile: Express.Multer.File,
    @Req() req: Request
  ) {
    console.log(' Headers:', req.headers['content-type']);
    console.log(' Raw body:', (req as any).body);
    console.log(' Parsed DTO:', {
      ...createMovieDto,
      genreIds: createMovieDto.genreIds,
      genreIdsType: typeof createMovieDto.genreIds,
      isArray: Array.isArray(createMovieDto.genreIds)
    });

    if (!Array.isArray(createMovieDto.genreIds)) {
      console.error('❌ Error: genreIds is not an array', createMovieDto.genreIds);
      throw new BadRequestException('genreIds must be an array');
    }

    return this.moviesService.createMovie(createMovieDto, posterFile);
  }

  @UseGuards(AdminGuard)
  @Get('admin/users')
  async getAllUsers() {
    return this.moviesService.getAllUsers();
  }

  @UseGuards(AdminGuard)
  @Post('admin/users/:userId/toggle-status')
  @HttpCode(HttpStatus.OK)
  async toggleUserStatus(@Param('userId') userId: string) {
    return this.moviesService.toggleUserStatus(userId);
  }
}