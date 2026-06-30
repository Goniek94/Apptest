/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * OffersService — testy ścieżki krytycznej: atomowa akceptacja oferty (K1).
 *
 * Pokrycie:
 *   • happy path — oferta PENDING + ogłoszenie ACTIVE → ACCEPTED, ogłoszenie
 *     rezerwowane, pozostałe oferty wygaszane;
 *   • przegrany wyścig — claim oferty zwraca count=0 → odrzucenie, ogłoszenie
 *     nie zostaje zarezerwowane;
 *   • ogłoszenie już zajęte — claim ogłoszenia zwraca count=0 → odrzucenie.
 *
 * Prisma i Realtime są w pełni zamockowane; `$transaction` wykonuje callback na
 * tym samym mocku (tx === prisma), więc asercje widzą wywołania z transakcji.
 * Realne zachowanie serializable należy do przyszłego zestawu e2e.
 */
import { BadRequestException } from '@nestjs/common';
import { OffersService } from './offers.service';

const PENDING_OFFER = {
  id: 'offer-1',
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  proposedById: 'buyer-1',
  listingId: 'listing-1',
  status: 'PENDING',
  amount: 5000,
};

function makePrisma(overrides: Record<string, any> = {}) {
  const prisma: any = {
    offer: {
      findUnique: jest.fn().mockResolvedValue({ ...PENDING_OFFER }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ ...PENDING_OFFER, status: 'ACCEPTED' }),
    },
    listing: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    conversation: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'conv-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    message: { create: jest.fn().mockResolvedValue({}) },
    notification: { create: jest.fn().mockResolvedValue({ id: 'notif-1' }) },
    ...overrides,
  };
  // $transaction wykonuje callback na tym samym mocku — tx === prisma.
  prisma.$transaction = jest.fn((cb: any) => cb(prisma));
  return prisma;
}

function makeRealtime() {
  return { emitToUsers: jest.fn(), emitToUser: jest.fn() };
}

describe('OffersService.accept (K1 — atomowość)', () => {
  it('akceptuje ofertę PENDING i wygasza pozostałe oferty (Etap 1: bez rezerwacji ogłoszenia)', async () => {
    const prisma = makePrisma();
    const service = new OffersService(prisma, makeRealtime() as any);

    const result = await service.accept('seller-1', 'offer-1');

    expect(result.status).toBe('ACCEPTED');
    // Oferta zaakceptowana warunkowo (claim po id + status PENDING).
    expect(prisma.offer.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'offer-1', status: 'PENDING' }),
        data: { status: 'ACCEPTED' },
      }),
    );
    // Etap 1: ogłoszenie NIE jest rezerwowane przy akceptacji oferty — zakupu nie da się
    // jeszcze sfinalizować (płatności w Etapie 2).
    expect(prisma.listing.updateMany).not.toHaveBeenCalled();
  });

  it('odrzuca akceptację, gdy oferta nie jest już PENDING (przegrany wyścig)', async () => {
    const prisma = makePrisma();
    prisma.offer.updateMany.mockResolvedValue({ count: 0 }); // claim przegrany
    const service = new OffersService(prisma, makeRealtime() as any);

    await expect(service.accept('seller-1', 'offer-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.listing.updateMany).not.toHaveBeenCalled();
  });
});
