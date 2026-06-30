import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Wymaga ważnego access tokena. Stosować przez `@UseGuards(JwtAuthGuard)`. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
