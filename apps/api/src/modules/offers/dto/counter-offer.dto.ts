import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, Max, MaxLength } from 'class-validator';

export class CounterOfferDto {
  @ApiProperty({ description: 'Nowa proponowana cena w groszach', example: 11000 })
  @IsInt()
  @Min(1)
  @Max(9_999_999) // 99 999,99 zł
  amount!: number;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
