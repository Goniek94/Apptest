import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum } from 'class-validator';
import { ListingStatus, Role } from '@prisma/client';

export class BanDto {
  @ApiProperty() @IsBoolean() banned!: boolean;
}

export class VerifyDto {
  @ApiProperty() @IsBoolean() verified!: boolean;
}

export class RoleDto {
  @ApiProperty({ enum: Role }) @IsEnum(Role) role!: Role;
}

export class ListingStatusDto {
  @ApiProperty({ enum: ListingStatus }) @IsEnum(ListingStatus) status!: ListingStatus;
}
