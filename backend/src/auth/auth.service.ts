import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../shared/firebase.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
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
  async updateUser(
  userId: string,
  updateData: AdminUpdateUserDto,
  photoFile?: Express.Multer.File,
): Promise<UserData> {
  try {
    const updatePayload: any = { ...updateData };
    
    // Handle file upload if a new photo is provided
    if (photoFile) {
      const photoUrl = await this.cloudinaryService.uploadImage(photoFile);
      updatePayload.photoUrl = photoUrl;
    }

    // Remove the photoFile property as it's not part of the user document
    delete updatePayload.photoFile;

    // Update the user in Firebase
    await this.firebaseService.update('users', userId, {
      ...updatePayload,
      updatedAt: new Date().toISOString(),
    });

    // Fetch the updated user document
    const updatedUser = await this.firebaseService.findOneByField('users', 'id', userId);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    // Return the updated user data (excluding sensitive information)
    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user profile');
  }
}

  async updateUserByAdmin(
    userId: string,
    updateData: { prenom?: string; nom?: string; email?: string; isActive?: boolean }
  ) {
    try {
      const userDoc = await this.firebaseService.findById('users', userId);
      
      if (!userDoc) {
        throw new BadRequestException('Utilisateur non trouvé');
      }

      // Build update payload with only provided fields
      const updatePayload: any = {};
      if (updateData.prenom !== undefined) updatePayload.prenom = updateData.prenom;
      if (updateData.nom !== undefined) updatePayload.nom = updateData.nom;
      if (updateData.email !== undefined) updatePayload.email = updateData.email;
      if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
      
      updatePayload.updatedAt = new Date().toISOString();

      // Update the user in Firebase
      await this.firebaseService.update('users', userId, updatePayload);

      // Fetch the updated user document
      const updatedUser = await this.firebaseService.findById('users', userId);
      if (!updatedUser) {
        throw new BadRequestException('Utilisateur non trouvé après mise à jour');
      }

      // Return the updated user data (excluding sensitive information)
      const { password, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user by admin:', error);
      throw error;
    }
  }
}