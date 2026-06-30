import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListingStatus, Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { BanDto, ListingStatusDto, RoleDto, VerifyDto } from './dto/admin.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Statystyki panelu' })
  stats() {
    return this.admin.stats();
  }

  // ----- użytkownicy -----

  @Get('users')
  @ApiOperation({ summary: 'Lista użytkowników (szukaj po email/nazwie)' })
  users(@Query('q') q?: string) {
    return this.admin.listUsers(q);
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Zablokuj / odblokuj konto' })
  ban(@CurrentUser('userId') adminId: string, @Param('id') id: string, @Body() dto: BanDto) {
    return this.admin.setBan(adminId, id, dto.banned);
  }

  @Patch('users/:id/verify')
  @ApiOperation({ summary: 'Oznacz / cofnij „zweryfikowany"' })
  verifyUser(@Param('id') id: string, @Body() dto: VerifyDto) {
    return this.admin.setVerified(id, dto.verified);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Zmień rolę użytkownika' })
  role(@CurrentUser('userId') adminId: string, @Param('id') id: string, @Body() dto: RoleDto) {
    return this.admin.setRole(adminId, id, dto.role);
  }

  // ----- ogłoszenia -----

  @Get('listings')
  @ApiOperation({ summary: 'Lista ogłoszeń (filtr statusu / szukaj)' })
  listings(@Query('status') status?: ListingStatus, @Query('q') q?: string) {
    return this.admin.listListings(status, q);
  }

  @Patch('listings/:id/verify')
  @ApiOperation({ summary: 'Oznacz / cofnij weryfikację ogłoszenia' })
  verifyListing(@Param('id') id: string, @Body() dto: VerifyDto) {
    return this.admin.setListingVerified(id, dto.verified);
  }

  @Patch('listings/:id/status')
  @ApiOperation({ summary: 'Zmień status ogłoszenia (np. ARCHIVED)' })
  listingStatus(@Param('id') id: string, @Body() dto: ListingStatusDto) {
    return this.admin.setListingStatus(id, dto.status);
  }

  @Delete('listings/:id')
  @ApiOperation({ summary: 'Usuń ogłoszenie (moderacja)' })
  removeListing(@Param('id') id: string) {
    return this.admin.removeListing(id);
  }
}
