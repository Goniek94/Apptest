import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { QueryListingsDto } from './dto/query-listings.dto';
import { ListingsService } from './listings.service';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista ogłoszeń (wyszukiwanie, filtry, sortowanie, paginacja)' })
  findAll(@Query() query: QueryListingsDto) {
    return this.listings.findAll(query);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moje ogłoszenia' })
  findMine(@CurrentUser('userId') userId: string) {
    return this.listings.findMine(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Szczegóły ogłoszenia' })
  findOne(@Param('id') id: string) {
    return this.listings.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dodaj ogłoszenie' })
  create(@CurrentUser('userId') userId: string, @Body() dto: CreateListingDto) {
    return this.listings.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Edytuj ogłoszenie (tylko właściciel)' })
  update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listings.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuń ogłoszenie (tylko właściciel)' })
  remove(@CurrentUser('userId') userId: string, @Param('id') id: string) {
    return this.listings.remove(userId, id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Dodaj zdjęcie do ogłoszenia (pole pliku: "file")' })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES } }))
  addImage(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.listings.addImage(userId, id, file);
  }

  @Delete('images/:imageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Usuń zdjęcie z ogłoszenia (tylko właściciel)' })
  removeImage(@CurrentUser('userId') userId: string, @Param('imageId') imageId: string) {
    return this.listings.removeImage(userId, imageId);
  }

  @Patch('images/:imageId/cover')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ustaw zdjęcie jako główne / okładkę (tylko właściciel)' })
  setCover(@CurrentUser('userId') userId: string, @Param('imageId') imageId: string) {
    return this.listings.setCoverImage(userId, imageId);
  }
}
