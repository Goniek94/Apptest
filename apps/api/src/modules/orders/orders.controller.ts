import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Moje transakcje (kupione i sprzedane)' })
  findMine(@CurrentUser('userId') userId: string) {
    return this.orders.findMine(userId);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'Podsumowanie portfela' })
  wallet(@CurrentUser('userId') userId: string) {
    return this.orders.wallet(userId);
  }
}
