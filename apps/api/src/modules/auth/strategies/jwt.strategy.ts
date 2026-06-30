import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser, JwtPayload } from '../../../common/types/auth.types';

/**
 * Weryfikuje access token (Bearer) i ustawia `request.user`.
 * Tokeny przekazujemy nagłówkiem Authorization (mobile-first — Expo + secure-store).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthUser {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Nieprawidłowy typ tokena.');
    }
    return {
      userId: payload.sub,
      role: payload.role,
      accountType: payload.accountType,
    };
  }
}
