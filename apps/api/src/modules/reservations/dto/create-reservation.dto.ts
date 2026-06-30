import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID ogłoszenia' })
  @IsString()
  listingId!: string;

  @ApiProperty({ description: 'Okres rezerwacji w godzinach (24/48/72/120)', example: 48 })
  @IsInt()
  hours!: number;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
