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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoviesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const movies_service_1 = require("./movies.service");
const auth_guard_1 = require("../auth/auth.guard");
const add_favorite_dto_1 = require("./dto/add-favorite.dto");
const create_movie_dto_1 = require("./dto/create-movie.dto");
let MoviesController = class MoviesController {
    moviesService;
    constructor(moviesService) {
        this.moviesService = moviesService;
    }
    async addToFavorites(req, addFavoriteDto) {
        return this.moviesService.addToFavorites(req.user.id, addFavoriteDto);
    }
    async removeFromFavorites(req, movieId) {
        return this.moviesService.removeFromFavorites(req.user.id, movieId);
    }
    async getUserFavorites(req) {
        return this.moviesService.getUserFavorites(req.user.id);
    }
    async getPopularMovies(page = 1) {
        return this.moviesService.getPopularMovies(page);
    }
    async searchMovies(query, page = 1) {
        return this.moviesService.searchMovies(query, page);
    }
    async getMatchingUsers(req) {
        return this.moviesService.findMatchingUsers(req.user.id);
    }
    async getAdminMovies() {
        return this.moviesService.getAdminMovies();
    }
    async updateMovie(id, body, posterFile, req) {
        let updateData = {};
        if (body.movie) {
            updateData = JSON.parse(body.movie);
        }
        else {
            updateData = { ...body };
        }
        return this.moviesService.updateMovie(id, updateData, posterFile);
    }
    async createMovie(createMovieDto, posterFile, req) {
        console.log(' Headers:', req.headers['content-type']);
        console.log(' Raw body:', req.body);
        console.log(' Parsed DTO:', {
            ...createMovieDto,
            genreIds: createMovieDto.genreIds,
            genreIdsType: typeof createMovieDto.genreIds,
            isArray: Array.isArray(createMovieDto.genreIds)
        });
        if (!Array.isArray(createMovieDto.genreIds)) {
            console.error('❌ Error: genreIds is not an array', createMovieDto.genreIds);
            throw new common_1.BadRequestException('genreIds must be an array');
        }
        return this.moviesService.createMovie(createMovieDto, posterFile);
    }
    async getAllUsers() {
        return this.moviesService.getAllUsers();
    }
    async toggleUserStatus(userId) {
        return this.moviesService.toggleUserStatus(userId);
    }
    async sendMatchRequest(req, targetUserId) {
        return this.moviesService.sendMatchRequest(req.user.id, targetUserId);
    }
    async respondToMatchRequest(req, requestId, body) {
        console.log('📥 Controller received respond request:');
        console.log('   Request ID:', requestId);
        console.log('   User from JWT:', req.user);
        console.log('   Status:', body.status);
        return this.moviesService.respondToMatchRequest(requestId, req.user.id, body.status);
    }
    async getMatchRequests(req) {
        return this.moviesService.getMatchRequests(req.user.id);
    }
    async cancelMatchRequest(req, requestId) {
        console.log('🔍 [cancelMatchRequest] Received request:', {
            method: req.method,
            url: req.url,
            originalUrl: req.originalUrl,
            path: req.path,
            params: req.params,
            user: req.user,
            headers: req.headers
        });
        return this.moviesService.cancelMatchRequest(requestId, req.user.id);
    }
    async unmatch(req, requestId) {
        return this.moviesService.unmatch(requestId, req.user.id);
    }
};
exports.MoviesController = MoviesController;
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('favorites'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, add_favorite_dto_1.AddFavoriteDto]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "addToFavorites", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('favorites/:movieId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('movieId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "removeFromFavorites", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('favorites'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getUserFavorites", null);
__decorate([
    (0, common_1.Get)('popular'),
    __param(0, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getPopularMovies", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "searchMovies", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('matching-users'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getMatchingUsers", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('admin/list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getAdminMovies", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AdminGuard),
    (0, common_1.Patch)('admin/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('poster')),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "updateMovie", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AdminGuard),
    (0, common_1.Post)('admin/create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('poster')),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_movie_dto_1.CreateMovieDto, Object, Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "createMovie", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AdminGuard),
    (0, common_1.Get)('admin/users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.AdminGuard),
    (0, common_1.Post)('admin/users/:userId/toggle-status'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "toggleUserStatus", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('match-requests/:targetUserId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('targetUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "sendMatchRequest", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('match-requests/:requestId/respond'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "respondToMatchRequest", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('match-requests'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "getMatchRequests", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('match-requests/:requestId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "cancelMatchRequest", null);
__decorate([
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)('match-requests/:requestId/unmatch'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('requestId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MoviesController.prototype, "unmatch", null);
exports.MoviesController = MoviesController = __decorate([
    (0, common_1.Controller)('movies'),
    __metadata("design:paramtypes", [movies_service_1.MoviesService])
], MoviesController);
//# sourceMappingURL=movies.controller.js.map