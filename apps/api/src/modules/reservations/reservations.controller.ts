import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservations: ReservationsService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Moje rezerwacje (jako kupujący i sprzedający)' })
  findMine(@CurrentUser('userId') userId: string) {
    return this.reservations.findMine(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Poproś o rezerwację przedmiotu' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateReservationDto) {
    return this.reservations.create(userId, dto);
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Akceptuj rezerwację (sprzedający)' })
  accept(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.reservations.accept(userId, id);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Odrzuć rezerwację (sprzedający)' })
  reject(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.reservations.reject(userId, id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Wycofaj rezerwację (kupujący)' })
  cancel(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.reservations.cancel(userId, id);
  }
}
