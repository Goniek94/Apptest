/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ReservationsService — testy ścieżki krytycznej: atomowość rezerwacji (K2).
 *
 * Pokrycie:
 *   • accept happy path — rezerwacja PENDING + ogłoszenie ACTIVE → ACCEPTED,
 *     ogłoszenie rezerwowane, pozostałe pending odrzucane;
 *   • accept przegrany wyścig — claim rezerwacji count=0 → odrzucenie, ogłoszenie
 *     nietknięte;
 *   • accept ogłoszenie zajęte — claim ogłoszenia count=0 → odrzucenie;
 *   • cancel zaakceptowanej — ogłoszenie zwalniane RESERVED→ACTIVE.
 *
 * Prisma, Realtime i Notifications zamockowane; `$transaction` wykonuje callback
 * na tym samym mocku (tx === prisma). Realne zachowanie serializable → e2e.
 */
import { BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

const PENDING_RES = {
  id: 'res-1',
  buyerId: 'buyer-1',
  sellerId: 'seller-1',
  listingId: 'listing-1',
  status: 'PENDING',
  hours: 24,
};

function makePrisma(overrides: Record<string, any> = {}) {
  const prisma: any = {
    reservation: {
      findUnique: jest.fn().mockResolvedValue({ ...PENDING_RES }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUniqueOrThrow: jest
        .fn()
        .mockResolvedValue({ ...PENDING_RES, status: 'ACCEPTED' }),
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
    ...overrides,
  };
  prisma.$transaction = jest.fn((cb: any) => cb(prisma));
  return prisma;
}

const makeRealtime = () => ({ emitToUsers: jest.fn(), emitToUser: jest.fn() });
const makeNotifications = () => ({ create: jest.fn().mockResolvedValue({}) });

function build(prisma: any) {
  return new ReservationsService(
    prisma,
    makeRealtime() as any,
    makeNotifications() as any,
  );
}

describe('ReservationsService (K2 — atomowość)', () => {
  it('accept: akceptuje PENDING, rezerwuje ogłoszenie i odrzuca pozostałe pending', async () => {
    const prisma = makePrisma();
    const service = build(prisma);

    const result = await service.accept('seller-1', 'res-1');

    expect(result.status).toBe('ACCEPTED');
    expect(prisma.reservation.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'res-1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'ACCEPTED' }),
      }),
    );
    expect(prisma.listing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'listing-1', status: 'ACTIVE' },
        data: { status: 'RESERVED' },
      }),
    );
  });

  it('accept: odrzuca, gdy rezerwacja nie jest już PENDING (przegrany wyścig) i NIE rusza ogłoszenia', async () => {
    const prisma = makePrisma();
    prisma.reservation.updateMany.mockResolvedValue({ count: 0 });
    const service = build(prisma);

    await expect(service.accept('seller-1', 'res-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.listing.updateMany).not.toHaveBeenCalled();
  });

  it('accept: odrzuca, gdy ogłoszenie jest już zajęte (claim ogłoszenia count=0)', async () => {
    const prisma = makePrisma();
    prisma.listing.updateMany.mockResolvedValue({ count: 0 });
    const service = build(prisma);

    await expect(service.accept('seller-1', 'res-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('cancel: wycofanie zaakceptowanej rezerwacji zwalnia ogłoszenie RESERVED→ACTIVE', async () => {
    const prisma = makePrisma();
    prisma.reservation.findUnique.mockResolvedValue({ ...PENDING_RES, status: 'ACCEPTED' });
    prisma.reservation.findUniqueOrThrow.mockResolvedValue({ ...PENDING_RES, status: 'CANCELLED' });
    const service = build(prisma);

    const result = await service.cancel('buyer-1', 'res-1');

    expect(result.status).toBe('CANCELLED');
    expect(prisma.listing.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'listing-1', status: 'RESERVED' },
        data: { status: 'ACTIVE' },
      }),
    );
  });
});
