import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Dodaj do ulubionych (idempotentnie — ponowne dodanie nie zgłasza błędu). */
  async add(userId: string, listingId: string): Promise<{ success: true }> {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');

    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!existing) {
      await this.prisma.favorite.create({ data: { userId, listingId } });
      // Powiadom właściciela (nie powiadamiamy o polubieniu własnego ogłoszenia).
      if (listing.sellerId !== userId) {
        await this.notifications.create(
          listing.sellerId, 'LISTING_LIKED',
          { listingId, title: listing.title, fromId: userId },
          `like:${listingId}`,
        );
      }
    }
    return { success: true };
  }

  async remove(userId: string, listingId: string): Promise<{ success: true }> {
    await this.prisma.favorite.deleteMany({ where: { userId, listingId } });
    return { success: true };
  }

  /** Lista ulubionych — zwraca ogłoszenia (najnowsze zapisy na górze). */
  async list(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          include: {
            images: { orderBy: { order: 'asc' } },
            seller: { select: { id: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    });
    return favorites.map((f) => f.listing);
  }
}
