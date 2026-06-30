import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const publicUser = {
  select: { id: true, displayName: true, avatarUrl: true, verified: true, accountType: true },
} satisfies Prisma.UserDefaultArgs;

const orderInclude = {
  listing: {
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
    },
  },
  buyer: publicUser,
  seller: publicUser,
} satisfies Prisma.OrderInclude;

// Statusy „w toku" (środki w grze, jeszcze nierozliczone) i „zakończone".
const IN_PROGRESS: OrderStatus[] = ['PAID', 'SHIPPED', 'DELIVERED', 'DISPUTED'];

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /** Wszystkie transakcje użytkownika (jako kupujący i sprzedający). */
  findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Podsumowanie portfela sprzedającego (kwoty w groszach). */
  async wallet(userId: string) {
    const sales = await this.prisma.order.findMany({
      where: { sellerId: userId },
      select: { amount: true, commission: true, status: true },
    });
    const net = (o: { amount: number; commission: number }) => o.amount - o.commission;

    let available = 0;
    let pending = 0;
    let earnedTotal = 0;
    let salesCount = 0;
    for (const o of sales) {
      if (o.status === 'COMPLETED') {
        available += net(o);
        earnedTotal += net(o);
        salesCount += 1;
      } else if (IN_PROGRESS.includes(o.status)) {
        pending += net(o);
      }
    }
    return { available, pending, earnedTotal, salesCount, currency: 'PLN' };
  }
}
