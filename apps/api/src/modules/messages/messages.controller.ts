import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

@ApiTags('messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista rozmów' })
  list(@CurrentUser('userId') userId: string) {
    return this.messages.listConversations(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Liczba nieprzeczytanych wiadomości (badge)' })
  unread(@CurrentUser('userId') userId: string) {
    return this.messages.unreadCount(userId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Rozpocznij rozmowę o ogłoszeniu' })
  start(@CurrentUser('userId') userId: string, @Query('listingId') listingId: string) {
    return this.messages.startWithListing(userId, listingId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Wątek rozmowy (oznacza jako przeczytane)' })
  thread(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.messages.getThread(userId, id);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Oznacz rozmowę jako przeczytaną' })
  read(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.messages.markRead(userId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Usuń rozmowę' })
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.messages.deleteConversation(userId, id);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Wyślij wiadomość' })
  send(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.sendMessage(userId, id, dto);
  }

  @Post(':id/messages/image')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Wyślij zdjęcie (pole pliku: "file")' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  sendImage(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messages.sendImage(userId, id, file);
  }
}
