import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { StoragePaths } from '../storage/storage.paths';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { ListingSort, QueryListingsDto } from './dto/query-listings.dto';

const MAX_LIMIT = 50;
const MAX_IMAGES = 10;

/** Stały kształt zwracanego ogłoszenia: zdjęcia (po kolejności) + publiczny sprzedawca. */
const listingInclude = {
  images: { orderBy: { order: 'asc' } },
  category: { select: { id: true, name: true, slug: true } },
  seller: {
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      ratingAvg: true,
      ratingCount: true,
      verified: true,
      accountType: true,
    },
  },
} satisfies Prisma.ListingInclude;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateListingDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new NotFoundException('Wybrana kategoria nie istnieje.');

    // Ilość > 1 i „Kup w grupie" są dostępne tylko dla kont firmowych.
    const seller = await this.prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
    const isBusiness = seller?.accountType === 'BUSINESS';

    const created = await this.prisma.listing.create({
      data: {
        sellerId: userId,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        price: dto.price,
        brand: dto.brand?.trim() ?? null,
        size: dto.size?.trim() ?? null,
        color: dto.color?.trim() ?? null,
        material: dto.material?.trim() ?? null,
        widthCm: dto.widthCm ?? null,
        lengthCm: dto.lengthCm ?? null,
        condition: dto.condition,
        negotiable: dto.negotiable ?? true,
        unisex: dto.unisex ?? false,
        quantity: isBusiness ? (dto.quantity ?? 1) : 1,
        groupBuy: isBusiness ? (dto.groupBuy ?? false) : false,
        categoryId: dto.categoryId,
      },
      include: listingInclude,
    });

    await this.notifications.create(userId, 'LISTING_PUBLISHED', { listingId: created.id, title: created.title });
    return created;
  }

  /** Publiczne listowanie z wyszukiwaniem, filtrami, sortowaniem i paginacją. */
  async findAll(query: QueryListingsDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, query.limit ?? 20));

    const where: Prisma.ListingWhereInput = { status: 'ACTIVE' };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { brand: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    // Slug może wskazywać kategorię główną (łap też jej podkategorie) lub konkretną podkategorię.
    if (query.categorySlug) {
      where.category = {
        OR: [
          { slug: query.categorySlug },
          { parent: { slug: query.categorySlug } },
          { parent: { parent: { slug: query.categorySlug } } },
        ],
      };
    }
    if (query.brand) where.brand = { equals: query.brand, mode: 'insensitive' };
    if (query.size) where.size = { equals: query.size, mode: 'insensitive' };
    if (query.color) where.color = { contains: query.color, mode: 'insensitive' };
    if (query.condition) where.condition = query.condition;
    if (query.minPrice != null || query.maxPrice != null) {
      where.price = {
        ...(query.minPrice != null ? { gte: query.minPrice } : {}),
        ...(query.maxPrice != null ? { lte: query.maxPrice } : {}),
      };
    }

    const orderBy = this.buildOrderBy(query.sort);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    // licznik odsłon — fire-and-forget (nie blokuje odpowiedzi)
    this.prisma.listing.update({ where: { id }, data: { views: { increment: 1 } } }).catch(() => undefined);
    return listing;
  }

  findMine(userId: string) {
    return this.prisma.listing.findMany({
      where: { sellerId: userId },
      include: {
        ...listingInclude,
        // Niezakończone transakcje (w trasie / dostarczone / spór / zwrot / opłacone, ale nierozliczone).
        orders: {
          where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'REFUNDED'] } },
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: UpdateListingDto) {
    await this.assertOwner(userId, id);
    const seller = await this.prisma.user.findUnique({ where: { id: userId }, select: { accountType: true } });
    const isBusiness = seller?.accountType === 'BUSINESS';
    return this.prisma.listing.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() ?? null } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand?.trim() ?? null } : {}),
        ...(dto.size !== undefined ? { size: dto.size?.trim() ?? null } : {}),
        ...(dto.color !== undefined ? { color: dto.color?.trim() ?? null } : {}),
        ...(dto.material !== undefined ? { material: dto.material?.trim() ?? null } : {}),
        ...(dto.widthCm !== undefined ? { widthCm: dto.widthCm ?? null } : {}),
        ...(dto.lengthCm !== undefined ? { lengthCm: dto.lengthCm ?? null } : {}),
        ...(dto.condition !== undefined ? { condition: dto.condition } : {}),
        ...(dto.negotiable !== undefined ? { negotiable: dto.negotiable } : {}),
        ...(dto.unisex !== undefined ? { unisex: dto.unisex } : {}),
        ...(isBusiness && dto.quantity !== undefined ? { quantity: dto.quantity } : {}),
        ...(isBusiness && dto.groupBuy !== undefined ? { groupBuy: dto.groupBuy } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: listingInclude,
    });
  }

  async remove(userId: string, id: string): Promise<{ success: true }> {
    const listing = await this.assertOwner(userId, id);
    // Sprzątamy pliki ze storage (te z zapisaną ścieżką).
    const paths = listing.images.map((i) => i.path).filter((p): p is string => !!p);
    if (paths.length) await this.storage.remove('listings', paths);
    await this.prisma.listing.delete({ where: { id } });
    return { success: true };
  }

  // ---------- zdjęcia ----------

  async addImage(userId: string, listingId: string, file: Express.Multer.File) {
    const listing = await this.assertOwner(userId, listingId);
    if (listing.images.length >= MAX_IMAGES) {
      throw new ForbiddenException(`Maksymalnie ${MAX_IMAGES} zdjęć na ogłoszenie.`);
    }

    const path = StoragePaths.listingImage(userId, listingId);
    const { url } = await this.storage.uploadImage('listings', path, file);

    return this.prisma.listingImage.create({
      data: {
        listingId,
        url: url ?? '',
        path,
        order: listing.images.length,
      },
    });
  }

  async removeImage(userId: string, imageId: string): Promise<{ success: true }> {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!image) throw new NotFoundException('Nie znaleziono zdjęcia.');
    if (image.listing.sellerId !== userId) {
      throw new ForbiddenException('Brak uprawnień do tego zdjęcia.');
    }

    // Reguła: ogłoszenie musi mieć co najmniej 1 zdjęcie — nie pozwalamy usunąć ostatniego.
    const count = await this.prisma.listingImage.count({ where: { listingId: image.listingId } });
    if (count <= 1) {
      throw new BadRequestException('Ogłoszenie musi mieć co najmniej 1 zdjęcie. Dodaj inne, zanim usuniesz to.');
    }

    if (image.path) await this.storage.remove('listings', [image.path]);
    await this.prisma.listingImage.delete({ where: { id: imageId } });
    return { success: true };
  }

  /** Ustaw zdjęcie jako główne (okładka) — przesuwa je na początek, reszta przesuwa się dalej. */
  async setCoverImage(userId: string, imageId: string): Promise<{ success: true }> {
    const image = await this.prisma.listingImage.findUnique({
      where: { id: imageId },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!image) throw new NotFoundException('Nie znaleziono zdjęcia.');
    if (image.listing.sellerId !== userId) {
      throw new ForbiddenException('Brak uprawnień do tego zdjęcia.');
    }

    const images = await this.prisma.listingImage.findMany({
      where: { listingId: image.listingId },
      orderBy: { order: 'asc' },
    });
    const orderedIds = [imageId, ...images.filter((i) => i.id !== imageId).map((i) => i.id)];
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.listingImage.update({ where: { id }, data: { order: idx } }),
      ),
    );
    return { success: true };
  }

  // ---------- helpery ----------

  private buildOrderBy(sort?: ListingSort): Prisma.ListingOrderByWithRelationInput {
    switch (sort) {
      case ListingSort.PRICE_ASC:
        return { price: 'asc' };
      case ListingSort.PRICE_DESC:
        return { price: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  /** Zwraca ogłoszenie (ze zdjęciami) tylko gdy należy do użytkownika. */
  private async assertOwner(userId: string, id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    if (listing.sellerId !== userId) {
      throw new ForbiddenException('Brak uprawnień do tego ogłoszenia.');
    }
    return listing;
  }
}
