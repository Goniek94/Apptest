import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma, ReviewSentiment } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReviewDto } from './dto/create-review.dto';

// Ocenić można dopiero, gdy transakcja faktycznie doszła do skutku.
const REVIEWABLE: OrderStatus[] = ['DELIVERED', 'COMPLETED'];

const authorSelect = {
  select: { id: true, displayName: true, avatarUrl: true, accountType: true },
} satisfies Prisma.UserDefaultArgs;

const reviewInclude = {
  author: authorSelect,
  order: { select: { id: true, listing: { select: { id: true, title: true } } } },
} satisfies Prisma.ReviewInclude;

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Wystawienie oceny drugiej stronie zakończonej transakcji. */
  async create(authorId: string, dto: CreateReviewDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: { id: true, buyerId: true, sellerId: true, status: true },
    });
    if (!order) throw new NotFoundException('Zamówienie nie istnieje.');

    if (authorId !== order.buyerId && authorId !== order.sellerId) {
      throw new ForbiddenException('Możesz oceniać tylko własne transakcje.');
    }
    if (!REVIEWABLE.includes(order.status)) {
      throw new BadRequestException('Ocenę można wystawić dopiero po zakończeniu transakcji.');
    }

    const targetId = authorId === order.buyerId ? order.sellerId : order.buyerId;

    const existing = await this.prisma.review.findFirst({
      where: { orderId: order.id, authorId },
      select: { id: true },
    });
    if (existing) throw new BadRequestException('Już oceniłeś tę transakcję.');

    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          orderId: order.id,
          authorId,
          targetId,
          rating: dto.rating,
          sentiment: dto.sentiment,
          comment: dto.comment?.trim() || null,
        },
        include: reviewInclude,
      });
      await this.recomputeRating(targetId, tx);
      return created;
    });

    await this.notifications.create(
      targetId,
      'REVIEW_RECEIVED',
      { rating: dto.rating, fromName: review.author.displayName, orderId: order.id },
      `review:${order.id}`,
    );

    return review;
  }

  /** Przelicza średnią i liczbę ocen użytkownika z otrzymanych recenzji. */
  private async recomputeRating(targetId: string, tx: Prisma.TransactionClient) {
    const agg = await tx.review.aggregate({
      where: { targetId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await tx.user.update({
      where: { id: targetId },
      data: {
        ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100,
        ratingCount: agg._count.rating,
      },
    });
  }

  /** Statystyki ocen użytkownika: średnia, rozkład sentymentu, % pozytywnych. */
  async stats(userId: string) {
    const [agg, groups] = await Promise.all([
      this.prisma.review.aggregate({
        where: { targetId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
      this.prisma.review.groupBy({
        by: ['sentiment'],
        where: { targetId: userId },
        _count: { sentiment: true },
      }),
    ]);
    const by = (s: ReviewSentiment) => groups.find((g) => g.sentiment === s)?._count.sentiment ?? 0;
    const total = agg._count.rating;
    const positive = by('POSITIVE');
    return {
      total,
      average: Math.round((agg._avg.rating ?? 0) * 100) / 100,
      positive,
      neutral: by('NEUTRAL'),
      negative: by('NEGATIVE'),
      positivePercentage: total ? Math.round((positive / total) * 100) : 0,
    };
  }

  /** Publiczna lista ocen otrzymanych przez użytkownika (na profil). */
  async listForUser(userId: string) {
    return this.prisma.review.findMany({
      where: { targetId: userId },
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Zakończone transakcje zalogowanego, których jeszcze nie ocenił (do podpowiedzi „Oceń"). */
  async pendingForMe(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { in: REVIEWABLE },
        OR: [{ buyerId: userId }, { sellerId: userId }],
        review: { none: { authorId: userId } },
      },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        listing: { select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } } },
        buyer: authorSelect,
        seller: authorSelect,
      },
      orderBy: { updatedAt: 'desc' },
    });
    // Druga strona, którą będę oceniać.
    return orders.map((o) => ({
      orderId: o.id,
      listing: o.listing,
      counterparty: o.buyerId === userId ? o.seller : o.buyer,
      role: o.buyerId === userId ? 'BUYER' : 'SELLER',
    }));
  }
}
