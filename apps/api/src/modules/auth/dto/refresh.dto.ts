import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token otrzymany przy logowaniu/rejestracji.' })
  @IsJWT()
  refreshToken!: string;
}
