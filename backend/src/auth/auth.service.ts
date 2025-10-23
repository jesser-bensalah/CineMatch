import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../shared/firebase.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

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

@Injectable()
export class AuthService {
  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async validateUser(payload: any): Promise<UserData | null> {
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
    } catch (error) {
      console.error('Error validating user:', error);
      return null;
    }
  }

  async register(registerDto: RegisterDto, photoFile?: Express.Multer.File) {
    try {
      console.log('Starting registration for:', registerDto.email);
      
      if (!registerDto.email || !registerDto.password) {
        throw new BadRequestException('Email and password are required');
      }

      const existingUser = await this.firebaseService.findOneByField('users', 'email', registerDto.email);
      if (existingUser) {
        console.log('Email already exists:', registerDto.email);
        throw new ConflictException('Email déjà utilisé');
      }

      let photoUrl = '';
      if (photoFile) {
        console.log('Uploading photo...');
        try {
          photoUrl = await this.cloudinaryService.uploadImage(photoFile);
          console.log('Photo uploaded successfully:', photoUrl);
        } catch (error) {
          console.error('Error uploading photo:', error);
          throw new BadRequestException('Erreur lors de l\'upload de la photo');
        }
      } else {
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
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Une erreur est survenue lors de l\'inscription');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.firebaseService.findOneByField('users', 'email', loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (user.isActive === false) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
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
}