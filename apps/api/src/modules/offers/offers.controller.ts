import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';
import { OffersService } from './offers.service';

@ApiTags('offers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Moje oferty (wysłane i otrzymane)' })
  findMine(@CurrentUser('userId') userId: string) {
    return this.offers.findMine(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Złóż ofertę cenową' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateOfferDto) {
    return this.offers.create(userId, dto);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Akceptuj ofertę' })
  accept(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.offers.accept(userId, id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Odrzuć ofertę' })
  reject(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.offers.reject(userId, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Wycofaj własną ofertę' })
  cancel(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.offers.cancel(userId, id);
  }

  @Post(':id/counter')
  @ApiOperation({ summary: 'Złóż kontrofertę' })
  counter(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: CounterOfferDto,
  ) {
    return this.offers.counter(userId, id, dto);
  }
}
