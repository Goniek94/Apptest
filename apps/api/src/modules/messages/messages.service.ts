import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StorageService } from '../storage/storage.service';
import { StoragePaths } from '../storage/storage.paths';
import { SendMessageDto } from './dto/send-message.dto';

const IMAGE_URL_TTL = 24 * 60 * 60; // signed URL ważny 24h

const publicUser = {
  select: { id: true, displayName: true, avatarUrl: true, verified: true, accountType: true },
} satisfies Prisma.UserDefaultArgs;

const listingPreview = {
  select: {
    id: true,
    title: true,
    price: true,
    currency: true,
    images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } },
  },
} satisfies Prisma.ListingDefaultArgs;

// Oferta dołączona do wiadomości typu OFFER — minimum do narysowania karty + decyzji o akcjach.
const messageInclude = {
  offer: {
    select: { id: true, amount: true, status: true, proposedById: true, buyerId: true, sellerId: true },
  },
  reservation: {
    select: { id: true, hours: true, status: true, buyerId: true, sellerId: true, expiresAt: true },
  },
} satisfies Prisma.MessageInclude;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  /** Lista rozmów użytkownika z ostatnią wiadomością i liczbą nieprzeczytanych. */
  async listConversations(userId: string) {
    const convs = await this.prisma.conversation.findMany({
      where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
      include: {
        buyer: publicUser,
        seller: publicUser,
        listing: listingPreview,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return Promise.all(
      convs.map(async ({ messages, ...c }) => {
        const unread = await this.prisma.message.count({
          where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
        });
        return { ...c, lastMessage: messages[0] ?? null, unread };
      }),
    );
  }

  /** Wątek rozmowy — wiadomości (z kartami ofert) i oznaczenie jako przeczytane. */
  async getThread(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { buyer: publicUser, seller: publicUser, listing: listingPreview },
    });
    if (!conversation) throw new NotFoundException('Nie znaleziono rozmowy.');
    this.assertParticipant(conversation, userId);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: messageInclude,
      orderBy: { createdAt: 'asc' },
    });

    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    const withUrls = await Promise.all(messages.map((m) => this.withImageUrl(m)));
    return { conversation, messages: withUrls };
  }

  /** Wyślij zdjęcie (bucket prywatny „messages", URL podpisywany). */
  async sendImage(userId: string, conversationId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Brak pliku zdjęcia.');
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Nie znaleziono rozmowy.');
    this.assertParticipant(conversation, userId);

    // Najpierw tworzymy wiadomość (potrzebujemy id do ścieżki), potem wgrywamy plik.
    const created = await this.prisma.message.create({
      data: { conversationId, senderId: userId, type: 'IMAGE', body: '📷 Zdjęcie' },
    });
    const path = StoragePaths.messageImage(conversationId, created.id);
    await this.storage.uploadImage('messages', path, file);
    const message = await this.prisma.message.update({
      where: { id: created.id },
      data: { imagePath: path },
      include: messageInclude,
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const recipient = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    await this.notifications.create(recipient, 'MESSAGE', { conversationId, fromId: userId, fromName: await this.displayName(userId) }, `msg:${conversationId}`);
    this.realtime.emitToUsers([conversation.buyerId, conversation.sellerId], 'message:new', { conversationId });
    this.realtime.emitToUsers([conversation.buyerId, conversation.sellerId], 'conversation:update', { conversationId });
    return this.withImageUrl(message);
  }

  /** Dla wiadomości typu IMAGE dokleja świeży, podpisany URL do zdjęcia. */
  private async withImageUrl<T extends { type: string; imagePath: string | null }>(
    m: T,
  ): Promise<T & { imageUrl: string | null }> {
    const imageUrl =
      m.type === 'IMAGE' && m.imagePath ? await this.storage.signedUrl('messages', m.imagePath, IMAGE_URL_TTL) : null;
    return { ...m, imageUrl };
  }

  /** Wyślij wiadomość tekstową. */
  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) throw new NotFoundException('Nie znaleziono rozmowy.');
    this.assertParticipant(conversation, userId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, body: dto.body.trim(), type: 'TEXT' },
      include: messageInclude,
    });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    const recipient = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
    await this.notifications.create(recipient, 'MESSAGE', { conversationId, fromId: userId, fromName: await this.displayName(userId) }, `msg:${conversationId}`);

    // Live: obie strony dostają nową wiadomość + sygnał odświeżenia listy rozmów.
    this.realtime.emitToUsers([conversation.buyerId, conversation.sellerId], 'message:new', { conversationId, message });
    this.realtime.emitToUsers([conversation.buyerId, conversation.sellerId], 'conversation:update', { conversationId });
    return message;
  }

  /** Oznacz wszystkie wiadomości w rozmowie jako przeczytane (bez otwierania). */
  async markRead(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Nie znaleziono rozmowy.');
    this.assertParticipant(conv, userId);
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    this.realtime.emitToUser(userId, 'conversation:update', { conversationId });
    return { success: true as const };
  }

  /** Usuń rozmowę (wraz z wiadomościami — kasowane kaskadowo). */
  async deleteConversation(userId: string, conversationId: string) {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv) throw new NotFoundException('Nie znaleziono rozmowy.');
    this.assertParticipant(conv, userId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    this.realtime.emitToUsers([conv.buyerId, conv.sellerId], 'conversation:update', { conversationId });
    return { success: true as const };
  }

  /** Rozpocznij (lub znajdź) rozmowę z sprzedawcą o ogłoszeniu. */
  async startWithListing(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, sellerId: true },
    });
    if (!listing) throw new NotFoundException('Nie znaleziono ogłoszenia.');
    if (listing.sellerId === userId) throw new BadRequestException('To Twoje ogłoszenie.');

    const existing = await this.prisma.conversation.findFirst({
      where: { buyerId: userId, sellerId: listing.sellerId, listingId },
    });
    if (existing) return { id: existing.id };
    const created = await this.prisma.conversation.create({
      data: { buyerId: userId, sellerId: listing.sellerId, listingId },
    });
    return { id: created.id };
  }

  /** Łączna liczba nieprzeczytanych wiadomości (badge). */
  unreadCount(userId: string) {
    return this.prisma.message
      .count({
        where: {
          senderId: { not: userId },
          readAt: null,
          conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        },
      })
      .then((count) => ({ count }));
  }

  private assertParticipant(conv: { buyerId: string; sellerId: string }, userId: string) {
    if (conv.buyerId !== userId && conv.sellerId !== userId) {
      throw new ForbiddenException('Brak dostępu do tej rozmowy.');
    }
  }

  private displayName(userId: string): Promise<string | undefined> {
    return this.prisma.user
      .findUnique({ where: { id: userId }, select: { displayName: true } })
      .then((u) => u?.displayName ?? undefined);
  }
}
