import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../shared/firebase.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
export interface UserData {
    id: string;
    nom: string;
    prenom: string;
    age: number;
    email: string;
    password: string;
    photoUrl: string;
    isActive: boolean;
    role: string;
    favorites: any[];
    createdAt: string;
    updatedAt: string;
}
export declare class AuthService {
    private firebaseService;
    private jwtService;
    private cloudinaryService;
    constructor(firebaseService: FirebaseService, jwtService: JwtService, cloudinaryService: CloudinaryService);
    validateUser(payload: any): Promise<UserData | null>;
    register(registerDto: RegisterDto, photoFile?: Express.Multer.File): Promise<{
        access_token: string;
        userId: string;
        user: {
            id: string;
            nom: string;
            prenom: string;
            age: number;
            email: string;
            photoUrl: string;
            role: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        userId: any;
        user: {
            id: any;
            nom: any;
            prenom: any;
            age: any;
            email: any;
            photoUrl: any;
            role: any;
        };
    }>;
    updateUser(userId: string, updateData: AdminUpdateUserDto, photoFile?: Express.Multer.File): Promise<UserData>;
    updateUserByAdmin(userId: string, updateData: {
        prenom?: string;
        nom?: string;
        email?: string;
        isActive?: boolean;
    }): Promise<any>;
}
