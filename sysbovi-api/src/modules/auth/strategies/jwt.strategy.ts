import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtAdminPayload, JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { RedisService } from '../../../redis/redis.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.['sysbovi_token'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload | JwtAdminPayload) {
    if (!payload.sub) throw new UnauthorizedException();

    const blacklisted = await this.redisService.exists(
      `blacklist:${payload.sub}:${payload.iat}`,
    );
    if (blacklisted) throw new UnauthorizedException('Token revogado.');

    return payload;
  }
}
