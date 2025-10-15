import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }

   
    if (user.isActive === false) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return user;
  }
}

@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Token invalide ou expiré');
    }

    if (user.role !== 'admin') {
      throw new UnauthorizedException('Accès réservé aux administrateurs');
    }

   
    if (user.isActive === false) {
      throw new UnauthorizedException('Compte désactivé');
    }

    return user;
  }
}