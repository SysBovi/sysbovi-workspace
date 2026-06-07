import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    // Preserva a mensagem original se já for uma UnauthorizedException
    // (ex: 'Token revogado.' vindo do JwtStrategy)
    if (err instanceof UnauthorizedException) throw err;
    if (err || !user) {
      throw new UnauthorizedException('Token inválido ou ausente.');
    }
    return user;
  }
}
