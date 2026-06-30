import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';

const adminUserSelect = {
  id: true,
  email: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  accountType: true,
  verified: true,
  bannedAt: true,
  emailVerifiedAt: true,
  ratingAvg: true,
  createdAt: true,
  _count: { select: { listings: true } },
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Kafelki na dashboardzie. */
  async stats() {
    const [users, listings, activeListings, unverifiedListings, offers, banned] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.listing.count(),
        this.prisma.listing.count({ where: { status: 'ACTIVE' } }),
        this.prisma.listing.count({ where: { status: 'ACTIVE', verified: false } }),
        this.prisma.offer.count(),
        this.prisma.user.count({ where: { bannedAt: { not: null } } }),
      ]);
    return { users, listings, activeListings, unverifiedListings, offers, banned };
  }

  // ---------- użytkownicy ----------

  listUsers(q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {},
      select: adminUserSelect,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async setBan(adminId: string, userId: string, banned: boolean) {
    const user = await this.getUserOr404(userId);
    if (user.id === adminId) throw new BadRequestException('Nie możesz zablokować własnego konta.');
    if (user.role === Role.ADMIN) throw new ForbiddenException('Nie można zablokować administratora.');
    const updated = await this.prisma.user.update({
      where: { id: userId },
      // Blokada wylogowuje (kasujemy refresh token).
      data: { bannedAt: banned ? new Date() : null, ...(banned ? { hashedRefreshToken: null } : {}) },
      select: adminUserSelect,
    });
    await this.notifications.create(
      userId,
      banned ? 'ACCOUNT_BANNED' : 'ACCOUNT_UNBANNED',
      {},
    );
    return updated;
  }

  async setVerified(userId: string, verified: boolean) {
    await this.getUserOr404(userId);
    return this.prisma.user.update({ where: { id: userId }, data: { verified }, select: adminUserSelect });
  }

  async setRole(adminId: string, userId: string, role: Role) {
    const user = await this.getUserOr404(userId);
    if (user.id === adminId) throw new BadRequestException('Nie możesz zmienić własnej roli.');
    return this.prisma.user.update({ where: { id: userId }, data: { role }, select: adminUserSelect });
  }

  // ---------- ogłoszenia ----------

  listListings(status?: ListingStatus, q?: string) {
    return this.prisma.listing.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),
      },
      include: {
        images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
        seller: { select: { id: true, displayName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async setListingVerified(id: string, verified: boolean) {
    await this.getListingOr404(id);
    return this.prisma.listing.update({ where: { id }, data: { verified } });
  }

  async setListingStatus(id: string, status: ListingStatus) {
    const listing = await this.prisma.listing.findUnique({ where: { id }, select: { id: true, sellerId: true, title: true } });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    const updated = await this.prisma.listing.update({ where: { id }, data: { status } });
    if (status === 'ARCHIVED') {
      await this.notifications.create(listing.sellerId, 'LISTING_HIDDEN', { listingId: id, title: listing.title });
    }
    return updated;
  }

  async removeListing(id: string): Promise<{ success: true }> {
    const listing = await this.prisma.listing.findUnique({ where: { id }, include: { images: true } });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    const paths = listing.images.map((i) => i.path).filter((p): p is string => !!p);
    if (paths.length) {
      try { await this.storage.remove('listings', paths); } catch { /* best-effort */ }
    }
    await this.prisma.listing.delete({ where: { id } });
    return { success: true };
  }

  // ---------- helpery ----------

  private async getUserOr404(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) throw new NotFoundException('Nie znaleziono użytkownika.');
    return user;
  }

  private async getListingOr404(id: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id }, select: { id: true } });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    return listing;
  }
}
