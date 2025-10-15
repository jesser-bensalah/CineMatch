import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpCode, HttpStatus, UseGuards, Get, Request, UnauthorizedException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
}