import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ description: 'Token z linku weryfikującego e-mail' })
  @IsString()
  @MinLength(10)
  token!: string;
}
