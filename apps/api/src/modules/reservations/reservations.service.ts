import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Reservation } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateReservationDto } from './dto/create-reservation.dto';

const ALLOWED_HOURS = [24, 48, 72, 120]; // 1 / 2 / 3 / 5 dni (max 5)

const publicUser = {
  select: { id: true, displayName: true, avatarUrl: true, verified: true, accountType: true },
} satisfies Prisma.UserDefaultArgs;

const reservationInclude = {
  buyer: publicUser,
  seller: publicUser,
  listing: {
    select: {
      id: true, title: true, price: true, currency: true,
      images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
    },
  },
} satisfies Prisma.ReservationInclude;

function periodLabel(hours: number): string {
  return hours >= 24 && hours % 24 === 0 ? `${hours / 24} ${hours / 24 === 1 ? 'dzień' : 'dni'}` : `${hours} godz.`;
}

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
  ) {}

  findMine(userId: string) {
    return this.sweepExpired().then(() =>
      this.prisma.reservation.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        include: reservationInclude,
        orderBy: { createdAt: 'desc' },
      }),
    );
  }

  /** Kupujący prosi o rezerwację na wybrany okres. */
  async create(buyerId: string, dto: CreateReservationDto): Promise<Reservation> {
    if (!ALLOWED_HOURS.includes(dto.hours)) {
      throw new BadRequestException('Dozwolony okres: 24h, 48h, 3 dni lub 5 dni.');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, sellerId: true, status: true, title: true },
    });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('To ogłoszenie nie jest już dostępne.');
    if (listing.sellerId === buyerId) throw new BadRequestException('Nie możesz zarezerwować własnego ogłoszenia.');

    const active = await this.prisma.reservation.findFirst({
      where: { listingId: listing.id, buyerId, status: { in: ['PENDING', 'ACCEPTED'] } },
    });
    if (active) throw new BadRequestException('Masz już aktywną rezerwację tego przedmiotu.');

    const reservation = await this.prisma.reservation.create({
      data: { listingId: listing.id, buyerId, sellerId: listing.sellerId, hours: dto.hours, message: dto.message?.trim() || null },
      include: reservationInclude,
    });

    await this.postCard(reservation, buyerId, `Prośba o rezerwację: ${periodLabel(reservation.hours)}`);
    await this.notifications.create(listing.sellerId, 'RESERVATION_REQUESTED', {
      reservationId: reservation.id, listingId: listing.id, title: listing.title, hours: reservation.hours, fromId: buyerId,
    });
    this.logger.log(`Nowa prośba o rezerwację ${reservation.id}`);
    return reservation;
  }

  /** Sprzedający akceptuje — przedmiot rezerwowany na `hours`, ogłoszenie → RESERVED. */
  async accept(userId: string, id: string): Promise<Reservation> {
    // Walidacja uprawnień; autorytatywny strażnik współbieżności to claim w transakcji.
    const r = await this.getPendingForSeller(userId, id);
    const expiresAt = new Date(Date.now() + r.hours * 3600 * 1000);

    // Atomowo: dla jednego ogłoszenia nie może powstać wiele zaakceptowanych
    // rezerwacji przez równoległe żądania. Wzorzec: claim rezerwacji po
    // `id+status` + rezerwacja ogłoszenia ACTIVE→RESERVED w tej samej transakcji
    // (count=0 ⇒ konflikt, rollback) + odrzucenie pozostałych pending.
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.reservation.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'ACCEPTED', expiresAt },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('Ta rezerwacja nie oczekuje już na decyzję.');
      }

      const reserved = await tx.listing.updateMany({
        where: { id: r.listingId, status: 'ACTIVE' },
        data: { status: 'RESERVED' },
      });
      if (reserved.count === 0) {
        throw new BadRequestException('To ogłoszenie nie jest już dostępne.');
      }

      // Pozostałe oczekujące rezerwacje tego ogłoszenia zostają odrzucone.
      await tx.reservation.updateMany({
        where: { listingId: r.listingId, status: 'PENDING', NOT: { id } },
        data: { status: 'REJECTED' },
      });

      return tx.reservation.findUniqueOrThrow({ where: { id }, include: reservationInclude });
    });

    await this.postSystem(updated, userId, `Rezerwacja zaakceptowana — przedmiot zarezerwowany na ${periodLabel(r.hours)}.`);
    await this.notifications.create(r.buyerId, 'RESERVATION_ACCEPTED', { reservationId: id, listingId: r.listingId, hours: r.hours });
    return updated;
  }

  async reject(userId: string, id: string): Promise<Reservation> {
    const r = await this.getPendingForSeller(userId, id);
    const updated = await this.prisma.reservation.update({ where: { id }, data: { status: 'REJECTED' }, include: reservationInclude });
    await this.postSystem(updated, userId, 'Prośba o rezerwację została odrzucona.');
    await this.notifications.create(r.buyerId, 'RESERVATION_REJECTED', { reservationId: id, listingId: r.listingId });
    return updated;
  }

  /** Kupujący wycofuje własną rezerwację (PENDING lub ACCEPTED). */
  async cancel(userId: string, id: string): Promise<Reservation> {
    const r = await this.findOr404(id);
    if (r.buyerId !== userId) throw new ForbiddenException('Możesz wycofać tylko własną rezerwację.');
    if (!['PENDING', 'ACCEPTED'].includes(r.status)) throw new BadRequestException('Tej rezerwacji nie można już wycofać.');

    // Atomowo: claim rezerwacji + (jeśli była ACCEPTED) zwolnienie ogłoszenia
    // RESERVED→ACTIVE w tej samej transakcji, by status nie rozjechał się przy
    // równoległym wygaśnięciu/akceptacji.
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.reservation.updateMany({
        where: { id, status: { in: ['PENDING', 'ACCEPTED'] } },
        data: { status: 'CANCELLED' },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('Tej rezerwacji nie można już wycofać.');
      }
      if (r.status === 'ACCEPTED') {
        await tx.listing.updateMany({
          where: { id: r.listingId, status: 'RESERVED' },
          data: { status: 'ACTIVE' },
        });
      }
      return tx.reservation.findUniqueOrThrow({ where: { id }, include: reservationInclude });
    });

    await this.postSystem(updated, userId, 'Rezerwacja została wycofana przez kupującego.');
    await this.notifications.create(r.sellerId, 'RESERVATION_CANCELLED', { reservationId: id, listingId: r.listingId });
    return updated;
  }

  // ---------- helpery ----------

  /** Wygasłe rezerwacje → EXPIRED, ogłoszenie wraca do ACTIVE (lazy, bez crona). */
  private async sweepExpired(): Promise<void> {
    const overdue = await this.prisma.reservation.findMany({
      where: { status: 'ACCEPTED', expiresAt: { lt: new Date() } },
      select: { id: true, listingId: true },
    });
    for (const r of overdue) {
      // Każde wygaśnięcie atomowo: claim ACCEPTED→EXPIRED + zwolnienie
      // ogłoszenia RESERVED→ACTIVE. Gdy ktoś inny domknął rezerwację w tym
      // czasie (count=0), nie ruszamy ogłoszenia.
      await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.reservation.updateMany({
          where: { id: r.id, status: 'ACCEPTED' },
          data: { status: 'EXPIRED' },
        });
        if (claimed.count === 0) return;
        await tx.listing.updateMany({
          where: { id: r.listingId, status: 'RESERVED' },
          data: { status: 'ACTIVE' },
        });
      });
    }
  }

  private async findOr404(id: string): Promise<Reservation> {
    const r = await this.prisma.reservation.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Nie znaleziono rezerwacji.');
    return r;
  }

  private async getPendingForSeller(userId: string, id: string): Promise<Reservation> {
    const r = await this.findOr404(id);
    if (r.sellerId !== userId) throw new ForbiddenException('Tylko sprzedający może rozpatrzyć tę rezerwację.');
    if (r.status !== 'PENDING') throw new BadRequestException('Ta rezerwacja nie oczekuje już na decyzję.');
    return r;
  }

  private async ensureConversation(buyerId: string, sellerId: string, listingId: string): Promise<string> {
    const existing = await this.prisma.conversation.findFirst({ where: { buyerId, sellerId, listingId } });
    if (existing) return existing.id;
    const created = await this.prisma.conversation.create({ data: { buyerId, sellerId, listingId } });
    return created.id;
  }

  private async postCard(r: Reservation, senderId: string, body: string): Promise<void> {
    const convId = await this.ensureConversation(r.buyerId, r.sellerId, r.listingId);
    await this.prisma.message.create({ data: { conversationId: convId, senderId, type: 'RESERVATION', reservationId: r.id, body } });
    await this.prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    this.broadcast(r, convId);
  }

  private async postSystem(r: Reservation, senderId: string, body: string): Promise<void> {
    const convId = await this.ensureConversation(r.buyerId, r.sellerId, r.listingId);
    await this.prisma.message.create({ data: { conversationId: convId, senderId, type: 'SYSTEM', body } });
    await this.prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    this.broadcast(r, convId);
  }

  private broadcast(r: Reservation, conversationId: string): void {
    const parties = [r.buyerId, r.sellerId];
    this.realtime.emitToUsers(parties, 'message:new', { conversationId });
    this.realtime.emitToUsers(parties, 'conversation:update', { conversationId });
    this.realtime.emitToUsers(parties, 'reservation:update', { reservationId: r.id });
  }
}
