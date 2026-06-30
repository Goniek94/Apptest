import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista powiadomień' })
  list(@CurrentUser('userId') userId: string) {
    return this.notifications.list(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Liczba nieprzeczytanych (badge przy dzwonku)' })
  unread(@CurrentUser('userId') userId: string) {
    return this.notifications.unreadCount(userId);
  }

  @Patch('read')
  @ApiOperation({ summary: 'Oznacz wszystkie jako przeczytane' })
  readAll(@CurrentUser('userId') userId: string) {
    return this.notifications.markAllRead(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Oznacz powiadomienie jako przeczytane' })
  read(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.notifications.markRead(userId, id);
  }
}
