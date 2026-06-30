import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { JwtPayload } from '../../common/types/auth.types';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { PublicUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const RESET_TTL_MS = 60 * 60 * 1000; // 1 godz.
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 godz.

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult extends AuthTokens {
  user: PublicUser;
}

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();

    if (await this.users.findByEmail(email)) {
      throw new ConflictException('Konto z tym adresem e-mail już istnieje.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.users.create({
      email,
      passwordHash,
      displayName: dto.displayName.trim(),
      accountType: dto.accountType,
      companyName: dto.companyName?.trim() ?? null,
      nip: dto.nip?.trim() ?? null,
    });

    this.logger.log(`Zarejestrowano użytkownika: ${user.id}`);
    // Wyślij link weryfikacyjny (zaślepka maila nie blokuje rejestracji).
    try {
      await this.sendVerificationEmail(user.id, user.email);
    } catch (e) {
      this.logger.error(`Nie udało się wysłać maila weryfikacyjnego: ${String(e)}`);
    }
    return this.buildAuthResult(user);
  }

  // ---------- reset hasła / weryfikacja e-mail ----------

  /** Krok 1 resetu: zawsze zwraca sukces (nie zdradzamy, czy konto istnieje). */
  async forgotPassword(email: string): Promise<void> {
    const normalized = email.toLowerCase().trim();
    const user = await this.users.findByEmail(normalized);
    if (!user) return;
    const raw = await this.issueToken(user.id, AuthTokenType.PASSWORD_RESET, RESET_TTL_MS);
    const url = `${this.appUrl()}/reset-hasla?token=${raw}`;
    await this.mail.sendPasswordReset(user.email, url);
    this.logger.log(`Wysłano link resetu hasła: ${user.id}`);
  }

  /** Krok 2 resetu: ustaw nowe hasło i unieważnij wszystkie sesje. */
  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const token = await this.consumeToken(rawToken, AuthTokenType.PASSWORD_RESET);
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash, hashedRefreshToken: null },
    });
    this.logger.log(`Zresetowano hasło: ${token.userId}`);
  }

  /** Potwierdza e-mail na podstawie tokenu z linku. */
  async verifyEmail(rawToken: string): Promise<void> {
    const token = await this.consumeToken(rawToken, AuthTokenType.EMAIL_VERIFICATION);
    await this.prisma.user.update({
      where: { id: token.userId },
      data: { emailVerifiedAt: new Date() },
    });
    this.logger.log(`Potwierdzono e-mail: ${token.userId}`);
  }

  /** Ponowne wysłanie linku weryfikacyjnego (dla zalogowanego). */
  async resendVerification(userId: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException();
    if (user.emailVerifiedAt) return; // już potwierdzony
    await this.sendVerificationEmail(user.id, user.email);
  }

  private async sendVerificationEmail(userId: string, email: string): Promise<void> {
    const raw = await this.issueToken(userId, AuthTokenType.EMAIL_VERIFICATION, VERIFY_TTL_MS);
    const url = `${this.appUrl()}/potwierdz-email?token=${raw}`;
    await this.mail.sendEmailVerification(email, url);
  }

  /** Generuje surowy token, zapisuje jego hash i unieważnia poprzednie tego typu. */
  private async issueToken(userId: string, type: AuthTokenType, ttlMs: number): Promise<string> {
    const raw = randomBytes(32).toString('hex');
    await this.prisma.authToken.updateMany({
      where: { userId, type, usedAt: null },
      data: { usedAt: new Date() },
    });
    await this.prisma.authToken.create({
      data: { userId, type, tokenHash: this.sha256(raw), expiresAt: new Date(Date.now() + ttlMs) },
    });
    return raw;
  }

  /** Weryfikuje i zużywa token (jednorazowy, niewygasły, właściwego typu). */
  private async consumeToken(rawToken: string, type: AuthTokenType) {
    const token = await this.prisma.authToken.findUnique({
      where: { tokenHash: this.sha256(rawToken) },
    });
    if (!token || token.type !== type || token.usedAt || token.expiresAt < new Date()) {
      throw new BadRequestException('Link jest nieprawidłowy lub wygasł.');
    }
    await this.prisma.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    return token;
  }

  private appUrl(): string {
    return this.config.get<string>('FRONTEND_URL', 'http://localhost:5173');
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.users.findByEmail(email);

    // Stały komunikat — nie zdradzamy, czy istnieje konto (anti user-enumeration).
    const invalid = new UnauthorizedException('Niepoprawny e-mail lub hasło.');
    if (!user) throw invalid;

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw invalid;

    if (user.bannedAt) {
      throw new ForbiddenException('Konto zostało zablokowane przez administratora.');
    }

    this.logger.log(`Zalogowano użytkownika: ${user.id}`);
    return this.buildAuthResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Nieprawidłowy refresh token.');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Nieprawidłowy typ tokena.');
    }

    const user = await this.users.findById(payload.sub);
    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Sesja wygasła. Zaloguj się ponownie.');
    }

    // Rotacja: token musi zgadzać się z ostatnio wydanym.
    if (this.sha256(refreshToken) !== user.hashedRefreshToken) {
      // Token nieaktualny/skradziony — unieważniamy sesję.
      await this.users.setRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Refresh token nieaktualny.');
    }

    const tokens = await this.signTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.users.setRefreshTokenHash(userId, null);
    this.logger.log(`Wylogowano użytkownika: ${userId}`);
  }

  // ---------- helpery ----------

  private async buildAuthResult(user: User): Promise<AuthResult> {
    const tokens = await this.signTokens(user);
    await this.persistRefreshToken(user.id, tokens.refreshToken);
    return { user: this.users.toPublic(user), ...tokens };
  }

  private async signTokens(user: User): Promise<AuthTokens> {
    const base = {
      sub: user.id,
      role: user.role,
      accountType: user.accountType,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { ...base, type: 'access' },
        {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      ),
      this.jwt.signAsync(
        { ...base, type: 'refresh' },
        {
          secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private persistRefreshToken(userId: string, refreshToken: string) {
    // Refresh token to wysokoentropijny sekret — wystarczy SHA-256
    // (bcrypt ma limit 72 bajtów i obcinałby długi JWT).
    return this.users.setRefreshTokenHash(userId, this.sha256(refreshToken));
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
