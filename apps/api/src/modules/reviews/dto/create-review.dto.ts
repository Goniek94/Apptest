import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewSentiment } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'clxorder123' })
  @IsString()
  orderId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1, { message: 'Ocena musi być od 1 do 5.' })
  @Max(5, { message: 'Ocena musi być od 1 do 5.' })
  rating!: number;

  @ApiProperty({ enum: ReviewSentiment, example: ReviewSentiment.POSITIVE })
  @IsEnum(ReviewSentiment)
  sentiment!: ReviewSentiment;

  @ApiPropertyOptional({ example: 'Szybka wysyłka, produkt zgodny z opisem.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
