import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'anna.kowalska@example.com' })
  @IsEmail({}, { message: 'Niepoprawny adres e-mail.' })
  email!: string;

  @ApiProperty({ example: 'TajneHaslo123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Hasło musi mieć min. 8 znaków.' })
  @MaxLength(72)
  password!: string;

  @ApiProperty({ example: 'Anna Kowalska' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  displayName!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.PRIVATE })
  @IsEnum(AccountType)
  accountType!: AccountType;

  @ApiPropertyOptional({ description: 'Wymagane dla konta firmowego.', example: 'AdBox Sp. z o.o.' })
  @ValidateIf((o: RegisterDto) => o.accountType === AccountType.BUSINESS)
  @IsString()
  @MinLength(2, { message: 'Podaj nazwę firmy.' })
  @MaxLength(120)
  companyName?: string;

  @ApiPropertyOptional({ description: 'NIP (10 cyfr) — wymagane dla konta firmowego.', example: '1234563218' })
  @ValidateIf((o: RegisterDto) => o.accountType === AccountType.BUSINESS)
  @Matches(/^\d{10}$/, { message: 'NIP musi składać się z 10 cyfr.' })
  nip?: string;
}
