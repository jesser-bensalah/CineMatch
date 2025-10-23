import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpCode, HttpStatus, UseGuards, Get, Request, UnauthorizedException, Put, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService, UserData } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard, AdminGuard } from './auth.guard';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FirebaseService } from '../shared/firebase.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private cloudinaryService: CloudinaryService,
    private firebaseService: FirebaseService,
  ) { }

  @Post('register')
  @UseInterceptors(FileInterceptor('photo'))
  async register(
    @Body() registerDto: RegisterDto,
    @UploadedFile() photoFile?: Express.Multer.File,
  ) {
    try {
      return await this.authService.register(registerDto, photoFile);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(@Request() req) {

    if (req.user.isActive === false) {
      throw new UnauthorizedException('Compte désactivé');
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

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('photoFile'))
  async updateProfile(
    @Request() req,
    @Body() updateDto: AdminUpdateUserDto,
    @UploadedFile() photoFile?: Express.Multer.File,
  ) {
    try {
      const userId = req.user.id;
      return await this.authService.updateUser(userId, updateDto, photoFile);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  @Put('admin/users/:userId')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updateUserByAdmin(
    @Param('userId') userId: string,
    @Body() updateDto: AdminUpdateUserDto,
  ) {
    try {
      return await this.authService.updateUserByAdmin(userId, updateDto);
    } catch (error) {
      console.error('Admin update user error:', error);
      throw error;
    }
  }
}