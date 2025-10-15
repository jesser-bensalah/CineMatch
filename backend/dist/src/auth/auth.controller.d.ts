import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
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
}
