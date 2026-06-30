import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Offer, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CounterOfferDto } from './dto/counter-offer.dto';

const OFFER_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dni

const publicUser = {
  select: {
    id: true,
    displayName: true,
    avatarUrl: true,
    verified: true,
    ratingAvg: true,
    accountType: true,
  },
} satisfies Prisma.UserDefaultArgs;

const offerInclude = {
  buyer: publicUser,
  seller: publicUser,
  listing: {
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
    },
  },
} satisfies Prisma.OfferInclude;

function zl(grosze: number): string {
  return `${(grosze / 100).toFixed(2).replace('.', ',')} zł`;
}

@Injectable()
export class OffersService {
  private readonly logger = new Logger(OffersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Oferty użytkownika (wysłane jako kupujący + otrzymane jako sprzedający). */
  findMine(userId: string) {
    return this.prisma.offer.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: offerInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Kupujący składa ofertę cenową. Tworzy konwersację + kartę oferty w czacie + powiadomienie. */
  async create(buyerId: string, dto: CreateOfferDto): Promise<Offer> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, sellerId: true, price: true, status: true, negotiable: true, title: true },
    });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    if (listing.status !== 'ACTIVE') throw new BadRequestException('To ogłoszenie nie jest aktywne.');
    if (!listing.negotiable) throw new BadRequestException('Sprzedawca wyłączył negocjację ceny.');
    if (listing.sellerId === buyerId) throw new BadRequestException('Nie możesz złożyć oferty na własne ogłoszenie.');
    if (dto.amount >= listing.price) throw new BadRequestException('Oferta musi być niższa od ceny ogłoszenia.');

    // Tylko jedna aktywna oferta tego kupującego na to ogłoszenie.
    await this.prisma.offer.updateMany({
      where: { listingId: listing.id, buyerId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    const offer = await this.prisma.offer.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        proposedById: buyerId,
        amount: dto.amount,
        message: dto.message?.trim() || null,
        expiresAt: new Date(Date.now() + OFFER_TTL_MS),
      },
      include: offerInclude,
    });

    const convId = await this.postOfferMessage(offer, buyerId, `Złożono ofertę: ${zl(offer.amount)}`);
    await this.notify(listing.sellerId, 'OFFER_RECEIVED', {
      offerId: offer.id,
      listingId: listing.id,
      listingTitle: listing.title,
      amount: offer.amount,
      fromId: buyerId,
      fromName: offer.buyer.displayName,
      conversationId: convId,
    });

    this.logger.log(`Nowa oferta ${offer.id} na ogłoszenie ${listing.id}`);
    return offer;
  }

  /** Druga strona akceptuje ofertę. */
  async accept(userId: string, offerId: string): Promise<Offer> {
    // Walidacja uprawnień (uczestnik, nie własna propozycja). Autorytatywnym
    // strażnikiem współbieżności jest jednak warunkowy claim w transakcji niżej.
    const offer = await this.getPendingForResponder(userId, offerId);

    // Akceptacja musi być atomowa: równoległe „Akceptuj" na tej samej ofercie
    // oraz dwie zaakceptowane oferty na tym samym ogłoszeniu są niedozwolone.
    // Wzorzec: claim po `id+status` (count=0 ⇒ przegrana wyścigu) + rezerwacja
    // ogłoszenia ACTIVE→RESERVED w tej samej transakcji (rollback przy konflikcie).
    const updated = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.offer.updateMany({
        where: { id: offerId, status: 'PENDING' },
        data: { status: 'ACCEPTED' },
      });
      if (claimed.count === 0) {
        throw new BadRequestException('Ta oferta nie oczekuje już na decyzję.');
      }

      // Etap 1: NIE rezerwujemy ogłoszenia przy akceptacji oferty — zakupu nie da się jeszcze
      // sfinalizować (płatności = Etap 2). Akceptacja = zgoda na cenę; kupujący dostaje
      // „Kup teraz" → checkout. Ogłoszenie zostaje ACTIVE. (Rezerwacja wróci z realnym checkoutem.)

      // Pozostałe oczekujące oferty na to ogłoszenie tracą ważność.
      await tx.offer.updateMany({
        where: { listingId: offer.listingId, status: 'PENDING', NOT: { id: offerId } },
        data: { status: 'EXPIRED' },
      });

      return tx.offer.findUniqueOrThrow({ where: { id: offerId }, include: offerInclude });
    });

    // Efekty uboczne dopiero po zatwierdzeniu transakcji — rollback ich nie cofa.
    await this.postSystem(updated, userId, `Oferta ${zl(updated.amount)} została zaakceptowana — można sfinalizować zakup w tej cenie.`);
    await this.notify(this.otherParty(offer, userId), 'OFFER_ACCEPTED', { offerId, amount: updated.amount });
    return updated;
  }

  /** Druga strona odrzuca ofertę. */
  async reject(userId: string, offerId: string): Promise<Offer> {
    const offer = await this.getPendingForResponder(userId, offerId);
    const updated = await this.prisma.offer.update({
      where: { id: offerId },
      data: { status: 'REJECTED' },
      include: offerInclude,
    });
    await this.postSystem(updated, userId, `Oferta ${zl(updated.amount)} została odrzucona.`);
    await this.notify(this.otherParty(offer, userId), 'OFFER_REJECTED', { offerId, amount: updated.amount });
    return updated;
  }

  /** Składający wycofuje własną ofertę. */
  async cancel(userId: string, offerId: string): Promise<Offer> {
    const offer = await this.findOr404(offerId);
    if (offer.proposedById !== userId) throw new ForbiddenException('Możesz wycofać tylko własną ofertę.');
    if (offer.status !== 'PENDING') throw new BadRequestException('Tej oferty nie można już wycofać.');
    return this.prisma.offer.update({ where: { id: offerId }, data: { status: 'CANCELLED' }, include: offerInclude });
  }

  /** Kontroferta — bieżąca oferta (PENDING) dostaje status COUNTERED, powstaje nowa.
   *  Można też kontrofertować po odrzuceniu (REJECTED) — wtedy po prostu powstaje nowa propozycja. */
  async counter(userId: string, offerId: string, dto: CounterOfferDto): Promise<Offer> {
    const offer = await this.findOr404(offerId);
    const participant = userId === offer.buyerId || userId === offer.sellerId;
    if (!participant) throw new ForbiddenException('Brak dostępu do tej oferty.');
    if (offer.status === 'PENDING' && offer.proposedById === userId) {
      throw new BadRequestException('Czekasz na decyzję drugiej strony.');
    }
    if (!['PENDING', 'REJECTED', 'COUNTERED'].includes(offer.status)) {
      throw new BadRequestException('Tej oferty nie można już kontrować.');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: offer.listingId },
      select: { price: true, status: true },
    });
    if (!listing || listing.status !== 'ACTIVE') throw new BadRequestException('To ogłoszenie nie jest już aktywne.');
    if (dto.amount < 1 || dto.amount > listing.price) throw new BadRequestException('Kwota kontroferty jest nieprawidłowa.');

    if (offer.status === 'PENDING') {
      await this.prisma.offer.update({ where: { id: offerId }, data: { status: 'COUNTERED' } });
    }

    const counter = await this.prisma.offer.create({
      data: {
        listingId: offer.listingId,
        buyerId: offer.buyerId,
        sellerId: offer.sellerId,
        proposedById: userId,
        parentId: offerId,
        amount: dto.amount,
        message: dto.message?.trim() || null,
        expiresAt: new Date(Date.now() + OFFER_TTL_MS),
      },
      include: offerInclude,
    });

    await this.postOfferMessage(counter, userId, `Kontroferta: ${zl(counter.amount)}`);
    await this.notify(this.otherParty(offer, userId), 'OFFER_COUNTERED', {
      offerId: counter.id,
      amount: counter.amount,
    });
    return counter;
  }

  // ---------- helpery ----------

  private async findOr404(offerId: string): Promise<Offer> {
    const offer = await this.prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) throw new NotFoundException('Nie znaleziono oferty.');
    return offer;
  }

  /** Zwraca ofertę PENDING, na którą `userId` może odpowiedzieć (jest drugą stroną). */
  private async getPendingForResponder(userId: string, offerId: string): Promise<Offer> {
    const offer = await this.findOr404(offerId);
    const participant = userId === offer.buyerId || userId === offer.sellerId;
    if (!participant) throw new ForbiddenException('Brak dostępu do tej oferty.');
    if (offer.status !== 'PENDING') throw new BadRequestException('Ta oferta nie oczekuje już na decyzję.');
    if (offer.proposedById === userId) throw new BadRequestException('Czekasz na decyzję drugiej strony.');
    return offer;
  }

  private otherParty(offer: Offer, userId: string): string {
    return userId === offer.buyerId ? offer.sellerId : offer.buyerId;
  }

  /** Konwersacja kupujący↔sprzedający dla ogłoszenia (tworzona w razie potrzeby). */
  private async ensureConversation(buyerId: string, sellerId: string, listingId: string): Promise<string> {
    const existing = await this.prisma.conversation.findFirst({ where: { buyerId, sellerId, listingId } });
    if (existing) return existing.id;
    const created = await this.prisma.conversation.create({ data: { buyerId, sellerId, listingId } });
    return created.id;
  }

  private async postOfferMessage(offer: Offer, senderId: string, body: string): Promise<string> {
    const convId = await this.ensureConversation(offer.buyerId, offer.sellerId, offer.listingId);
    await this.prisma.message.create({
      data: { conversationId: convId, senderId, type: 'OFFER', offerId: offer.id, body },
    });
    // Opcjonalna wiadomość od składającego ofertę/kontrofertę — jako zwykły bąbelek tekstowy,
    // żeby treść była widoczna w rozmowie (wcześniej zapisywała się tylko na ofercie).
    if (offer.message) {
      await this.prisma.message.create({
        data: { conversationId: convId, senderId, type: 'TEXT', body: offer.message },
      });
    }
    await this.prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    this.broadcast(offer, convId);
    return convId;
  }

  private async postSystem(offer: Offer, senderId: string, body: string): Promise<void> {
    const convId = await this.ensureConversation(offer.buyerId, offer.sellerId, offer.listingId);
    await this.prisma.message.create({
      data: { conversationId: convId, senderId, type: 'SYSTEM', body },
    });
    await this.prisma.conversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    this.broadcast(offer, convId);
  }

  /** Live: powiadom obie strony o nowej wiadomości/zmianie oferty w wątku. */
  private broadcast(offer: Offer, conversationId: string): void {
    const parties = [offer.buyerId, offer.sellerId];
    this.realtime.emitToUsers(parties, 'message:new', { conversationId });
    this.realtime.emitToUsers(parties, 'conversation:update', { conversationId });
    this.realtime.emitToUsers(parties, 'offer:update', { offerId: offer.id });
  }

  private async notify(userId: string, type: string, payload: Record<string, unknown>): Promise<void> {
    const n = await this.prisma.notification.create({ data: { userId, type, payload: payload as Prisma.InputJsonValue } });
    this.realtime.emitToUser(userId, 'notification:new', n);
  }
}
