import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
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
  @UseGuards(AdminGuard)
  @Get('admin/list')
  async getAdminMovies() {
    return this.moviesService.getAdminMovies();
  }

  @UseGuards(AdminGuard)
  @Delete('admin/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMovie(@Param('id') id: string) {
    await this.moviesService.deleteMovie(id);
    return { message: 'Movie deleted successfully' };
  }

  // Routes Admin uniquement
  @UseGuards(AdminGuard)
  @Patch('admin/:id')
  @UseInterceptors(FileInterceptor('poster'))
  @HttpCode(HttpStatus.OK)
  async updateMovie(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() posterFile: Express.Multer.File,
    @Req() req: Request
  ) {
    let updateData: any = {};
    
    // If we have a movie field, parse it as JSON
    if (body.movie) {
      updateData = JSON.parse(body.movie);
    } else {
      // Fallback to the entire body if no movie field
      updateData = { ...body };
    }
    
    return this.moviesService.updateMovie(id, updateData, posterFile);
  }

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

  // Match Request Routes
  @UseGuards(JwtAuthGuard)
  @Post('match-requests/:targetUserId')
  @HttpCode(HttpStatus.CREATED)
  async sendMatchRequest(
    @Req() req: Request,
    @Param('targetUserId') targetUserId: string
  ) {
    return this.moviesService.sendMatchRequest((req as any).user.id, targetUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('match-requests/:requestId/respond')
  @HttpCode(HttpStatus.OK)
  async respondToMatchRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
    @Body() body: { status: 'accepted' | 'declined' }
  ) {
    console.log('📥 Controller received respond request:');
    console.log('   Request ID:', requestId);
    console.log('   User from JWT:', (req as any).user);
    console.log('   Status:', body.status);
    return this.moviesService.respondToMatchRequest(requestId, (req as any).user.id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('match-requests')
  async getMatchRequests(@Req() req: Request) {
    return this.moviesService.getMatchRequests((req as any).user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('match-requests/:requestId')
  @HttpCode(HttpStatus.OK)
  async cancelMatchRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string
  ) {
    console.log('🔍 [cancelMatchRequest] Received request:', {
      method: req.method,
      url: req.url,
      originalUrl: (req as any).originalUrl,
      path: req.path,
      params: req.params,
      user: (req as any).user,
      headers: req.headers
    });
    return this.moviesService.cancelMatchRequest(requestId, (req as any).user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('match-requests/:requestId/unmatch')
  @HttpCode(HttpStatus.OK)
  async unmatch(
    @Req() req: Request,
    @Param('requestId') requestId: string
  ) {
    return this.moviesService.unmatch(requestId, (req as any).user.id);
  }
}