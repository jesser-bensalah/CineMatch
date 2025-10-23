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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const auth_guard_1 = require("./auth.guard");
const admin_update_user_dto_1 = require("./dto/admin-update-user.dto");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const firebase_service_1 = require("../shared/firebase.service");
let AuthController = class AuthController {
    authService;
    cloudinaryService;
    firebaseService;
    constructor(authService, cloudinaryService, firebaseService) {
        this.authService = authService;
        this.cloudinaryService = cloudinaryService;
        this.firebaseService = firebaseService;
    }
    async register(registerDto, photoFile) {
        try {
            return await this.authService.register(registerDto, photoFile);
        }
        catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async validateToken(req) {
        if (req.user.isActive === false) {
            throw new common_1.UnauthorizedException('Compte désactivé');
        }
        return {
            valid: true,
            user: {
                id: req.user.id,
                nom: req.user.nom,
                prenom: req.user.prenom,
                email: req.user.email,
                photoUrl: req.user.photoUrl,
                role: req.user.role,
                isActive: req.user.isActive
            }
        };
    }
    async updateProfile(req, updateDto, photoFile) {
        try {
            const userId = req.user.id;
            return await this.authService.updateUser(userId, updateDto, photoFile);
        }
        catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }
    async updateUserByAdmin(userId, updateDto) {
        try {
            return await this.authService.updateUserByAdmin(userId, updateDto);
        }
        catch (error) {
            console.error('Admin update user error:', error);
            throw error;
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photo')),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('validate'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)(auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('photoFile')),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_update_user_dto_1.AdminUpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('admin/users/:userId'),
    (0, common_1.UseGuards)(auth_guard_1.AdminGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, admin_update_user_dto_1.AdminUpdateUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateUserByAdmin", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        cloudinary_service_1.CloudinaryService,
        firebase_service_1.FirebaseService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map