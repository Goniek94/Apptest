import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Moje ulubione ogłoszenia' })
  list(@CurrentUser('userId') userId: string) {
    return this.favorites.list(userId);
  }

  @Post(':listingId')
  @ApiOperation({ summary: 'Dodaj ogłoszenie do ulubionych' })
  add(@CurrentUser('userId') userId: string, @Param('listingId') listingId: string) {
    return this.favorites.add(userId, listingId);
  }

  @Delete(':listingId')
  @ApiOperation({ summary: 'Usuń z ulubionych' })
  remove(@CurrentUser('userId') userId: string, @Param('listingId') listingId: string) {
    return this.favorites.remove(userId, listingId);
  }
}
