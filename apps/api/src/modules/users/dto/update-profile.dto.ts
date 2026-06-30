import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUrl, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Anna Kowalska' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nazwa musi mieć co najmniej 2 znaki.' })
  @MaxLength(80)
  displayName?: string;

  @ApiPropertyOptional({ example: 'Miłośniczka mody premium.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'https://cdn.modamarket.pl/avatars/abc.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'AdBox Sp. z o.o.' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Nazwa firmy musi mieć co najmniej 2 znaki.' })
  @MaxLength(120)
  companyName?: string;

  @ApiPropertyOptional({ example: '1234563218' })
  @IsOptional()
  @Matches(/^\d{10}$/, { message: 'NIP musi składać się z 10 cyfr.' })
  nip?: string;

  @ApiPropertyOptional({ description: 'Preferencje: powiadomienia / prywatność / język-waluta.' })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;
}
