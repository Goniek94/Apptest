import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /**
   * Utwórz powiadomienie i wyślij je na żywo (badge przy dzwonku).
   * `dedupeKey` (anti-spam): jeśli istnieje **nieprzeczytane** powiadomienie tego samego
   * typu i klucza — aktualizujemy je (odświeżamy treść + czas) zamiast tworzyć nowe.
   * Np. 100 wiadomości z jednej rozmowy = jedno powiadomienie; lubię/odlubię w pętli = jedno.
   */
  async create(userId: string, type: string, payload: Record<string, unknown> = {}, dedupeKey?: string) {
    const data = { payload: payload as Prisma.InputJsonValue };

    if (dedupeKey) {
      const existing = await this.prisma.notification.findFirst({
        where: { userId, type, dedupeKey, readAt: null },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        const updated = await this.prisma.notification.update({
          where: { id: existing.id },
          data: { ...data, createdAt: new Date() },
        });
        this.realtime.emitToUser(userId, 'notification:new', updated);
        return updated;
      }
    }

    const n = await this.prisma.notification.create({
      data: { userId, type, dedupeKey: dedupeKey ?? null, ...data },
    });
    this.realtime.emitToUser(userId, 'notification:new', n);
    return n;
  }

  list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, readAt: null } }).then((count) => ({ count }));
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true as const };
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: new Date() } });
    return { success: true as const };
  }
}
