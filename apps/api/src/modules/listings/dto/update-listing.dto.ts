import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ListingStatus } from '@prisma/client';
import { CreateListingDto } from './create-listing.dto';

/** Aktualizacja ogłoszenia — wszystkie pola opcjonalne + zmiana statusu (np. ARCHIVED). */
export class UpdateListingDto extends PartialType(CreateListingDto) {
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;
}
