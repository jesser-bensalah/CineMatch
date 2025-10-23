"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const firebase_service_1 = require("../shared/firebase.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const bcrypt = __importStar(require("bcryptjs"));
let AuthService = class AuthService {
    firebaseService;
    jwtService;
    cloudinaryService;
    constructor(firebaseService, jwtService, cloudinaryService) {
        this.firebaseService = firebaseService;
        this.jwtService = jwtService;
        this.cloudinaryService = cloudinaryService;
    }
    async validateUser(payload) {
        try {
            const user = await this.firebaseService.findById('users', payload.sub);
            if (!user) {
                return null;
            }
            return {
                id: user.id,
                nom: user.nom || '',
                prenom: user.prenom || '',
                age: user.age || 0,
                email: user.email || '',
                password: user.password || '',
                photoUrl: user.photoUrl || '',
                isActive: user.isActive !== undefined ? user.isActive : true,
                role: user.role || 'user',
                favorites: user.favorites || [],
                createdAt: user.createdAt || new Date().toISOString(),
                updatedAt: user.updatedAt || new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Error validating user:', error);
            return null;
        }
    }
    async register(registerDto, photoFile) {
        try {
            console.log('Starting registration for:', registerDto.email);
            if (!registerDto.email || !registerDto.password) {
                throw new common_1.BadRequestException('Email and password are required');
            }
            const existingUser = await this.firebaseService.findOneByField('users', 'email', registerDto.email);
            if (existingUser) {
                console.log('Email already exists:', registerDto.email);
                throw new common_1.ConflictException('Email déjà utilisé');
            }
            let photoUrl = '';
            if (photoFile) {
                console.log('Uploading photo...');
                try {
                    photoUrl = await this.cloudinaryService.uploadImage(photoFile);
                    console.log('Photo uploaded successfully:', photoUrl);
                }
                catch (error) {
                    console.error('Error uploading photo:', error);
                    throw new common_1.BadRequestException('Erreur lors de l\'upload de la photo');
                }
            }
            else {
                console.log('No photo provided, using default');
            }
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(registerDto.password, 12);
            const userData = {
                ...registerDto,
                password: hashedPassword,
                photoUrl,
                isActive: true,
                role: 'user',
                favorites: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            console.log('Creating user in Firebase...');
            const userRef = await this.firebaseService.create('users', userData);
            const payload = {
                sub: userRef.id,
                email: registerDto.email,
                role: 'user'
            };
            const token = this.jwtService.sign(payload);
            console.log('User registered successfully:', userRef.id);
            return {
                access_token: token,
                userId: userRef.id,
                user: {
                    id: userRef.id,
                    nom: registerDto.nom,
                    prenom: registerDto.prenom,
                    age: registerDto.age,
                    email: registerDto.email,
                    photoUrl,
                    role: 'user'
                }
            };
        }
        catch (error) {
            console.error('Registration error:', error);
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Une erreur est survenue lors de l\'inscription');
        }
    }
    async login(loginDto) {
        const user = await this.firebaseService.findOneByField('users', 'email', loginDto.email);
        if (!user) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        if (user.isActive === false) {
            throw new common_1.UnauthorizedException('Compte désactivé');
        }
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Email ou mot de passe incorrect');
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        return {
            access_token: this.jwtService.sign(payload),
            userId: user.id,
            user: {
                id: user.id,
                nom: user.nom,
                prenom: user.prenom,
                age: user.age,
                email: user.email,
                photoUrl: user.photoUrl,
                role: user.role
            }
        };
    }
    async updateUser(userId, updateData, photoFile) {
        try {
            const updatePayload = { ...updateData };
            if (photoFile) {
                const photoUrl = await this.cloudinaryService.uploadImage(photoFile);
                updatePayload.photoUrl = photoUrl;
            }
            delete updatePayload.photoFile;
            await this.firebaseService.update('users', userId, {
                ...updatePayload,
                updatedAt: new Date().toISOString(),
            });
            const updatedUser = await this.firebaseService.findOneByField('users', 'id', userId);
            if (!updatedUser) {
                throw new Error('User not found after update');
            }
            const { password, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            console.error('Error updating user:', error);
            throw new Error('Failed to update user profile');
        }
    }
    async updateUserByAdmin(userId, updateData) {
        try {
            const userDoc = await this.firebaseService.findById('users', userId);
            if (!userDoc) {
                throw new common_1.BadRequestException('Utilisateur non trouvé');
            }
            const updatePayload = {};
            if (updateData.prenom !== undefined)
                updatePayload.prenom = updateData.prenom;
            if (updateData.nom !== undefined)
                updatePayload.nom = updateData.nom;
            if (updateData.email !== undefined)
                updatePayload.email = updateData.email;
            if (updateData.isActive !== undefined)
                updatePayload.isActive = updateData.isActive;
            updatePayload.updatedAt = new Date().toISOString();
            await this.firebaseService.update('users', userId, updatePayload);
            const updatedUser = await this.firebaseService.findById('users', userId);
            if (!updatedUser) {
                throw new common_1.BadRequestException('Utilisateur non trouvé après mise à jour');
            }
            const { password, ...userWithoutPassword } = updatedUser;
            return userWithoutPassword;
        }
        catch (error) {
            console.error('Error updating user by admin:', error);
            throw error;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        jwt_1.JwtService,
        cloudinary_service_1.CloudinaryService])
], AuthService);
//# sourceMappingURL=auth.service.js.map