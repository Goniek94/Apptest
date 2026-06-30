import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { ItemCondition } from '@prisma/client';

export class CreateListingDto {
  @IsString()
  @Length(3, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @Length(0, 4000)
  description?: string;

  /** Cena w groszach (np. 19900 = 199,00 zł). Limit: 99 999,99 zł = 9 999 999 groszy. */
  @IsInt()
  @Min(1)
  @Max(9_999_999)
  price!: number;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  brand?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  size?: string;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  color?: string;

  @IsOptional()
  @IsString()
  @Length(0, 60)
  material?: string;

  /** Szerokość w cm (opcjonalna). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  widthCm?: number;

  /** Długość w cm (opcjonalna). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  lengthCm?: number;

  @IsEnum(ItemCondition)
  condition!: ItemCondition;

  /** Czy kupujący może składać oferty cenowe (negocjacja). */
  @IsOptional()
  @IsBoolean()
  negotiable?: boolean;

  /** Przedmiot unisex. */
  @IsOptional()
  @IsBoolean()
  unisex?: boolean;

  /** Liczba identycznych sztuk (tylko konta firmowe; prywatne = 1). */
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  quantity?: number;

  /** Wystaw jako „Kup w grupie" (tylko konta firmowe). */
  @IsOptional()
  @IsBoolean()
  groupBuy?: boolean;

  @IsString()
  categoryId!: string;
}
