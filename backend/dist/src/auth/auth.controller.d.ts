import { AuthService, UserData } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FirebaseService } from '../shared/firebase.service';
export declare class AuthController {
    private authService;
    private cloudinaryService;
    private firebaseService;
    constructor(authService: AuthService, cloudinaryService: CloudinaryService, firebaseService: FirebaseService);
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
    validateToken(req: any): Promise<{
        valid: boolean;
        user: {
            id: any;
            nom: any;
            prenom: any;
            email: any;
            photoUrl: any;
            role: any;
            isActive: any;
        };
    }>;
    updateProfile(req: any, updateDto: AdminUpdateUserDto, photoFile?: Express.Multer.File): Promise<UserData>;
    updateUserByAdmin(userId: string, updateDto: AdminUpdateUserDto): Promise<any>;
}
