import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Oceny otrzymane przez użytkownika (publiczne)' })
  listForUser(@Param('userId') userId: string) {
    return this.reviews.listForUser(userId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Statystyki ocen użytkownika (średnia, % pozytywnych)' })
  stats(@Param('userId') userId: string) {
    return this.reviews.stats(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('pending')
  @ApiOperation({ summary: 'Moje zakończone transakcje do oceny' })
  pending(@CurrentUser('userId') userId: string) {
    return this.reviews.pendingForMe(userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Wystaw ocenę drugiej stronie transakcji' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(userId, dto);
  }
}
