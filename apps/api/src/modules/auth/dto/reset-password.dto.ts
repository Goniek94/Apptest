import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token z linku resetującego' })
  @IsString()
  @MinLength(10)
  token!: string;

  @ApiProperty({ example: 'NoweTajneHaslo123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
