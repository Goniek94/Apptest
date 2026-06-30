import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } }) // 10 / godz.
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Rejestracja (konto prywatne lub firmowe)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 20, ttl: 900_000 } }) // 20 / 15 min
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logowanie' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Odświeżenie tokenów (rotacja)' })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wylogowanie (unieważnia refresh token)' })
  async logout(@CurrentUser('userId') userId: string) {
    await this.auth.logout(userId);
    return { success: true };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 900_000 } }) // 5 / 15 min
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wyślij link resetu hasła (zawsze zwraca sukces)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.auth.forgotPassword(dto.email);
    return { success: true };
  }

  @Post('reset-password')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ustaw nowe hasło na podstawie tokenu z e-maila' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password);
    return { success: true };
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Potwierdź adres e-mail tokenem z linku' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.auth.verifyEmail(dto.token);
    return { success: true };
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 900_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Wyślij ponownie link weryfikacyjny e-mail (zalogowany)' })
  async resendVerification(@CurrentUser('userId') userId: string) {
    await this.auth.resendVerification(userId);
    return { success: true };
  }
}
