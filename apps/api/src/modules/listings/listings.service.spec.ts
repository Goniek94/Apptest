/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ListingsService — testy ścieżki krytycznej: kontrola właściciela ogłoszenia.
 *
 * `update`/`remove` przechodzą przez prywatny `assertOwner`, który:
 *   • rzuca NotFound, gdy ogłoszenia nie ma;
 *   • rzuca Forbidden, gdy `sellerId` ≠ wykonawca;
 *   • przepuszcza właściciela.
 */
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ListingsService } from './listings.service';

function makePrisma(over: Record<string, any> = {}) {
  return {
    listing: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({ id: 'listing-1', title: 'Po zmianie' }),
      delete: jest.fn().mockResolvedValue({}),
    },
    user: { findUnique: jest.fn().mockResolvedValue({ accountType: 'PRIVATE' }) },
    ...over,
  };
}

const makeStorage = () => ({ remove: jest.fn().mockResolvedValue(undefined) });
const makeNotifications = () => ({ create: jest.fn() });

function build(prisma: any) {
  return new ListingsService(prisma, makeStorage() as any, makeNotifications() as any);
}

describe('ListingsService — ownership', () => {
  it('update: obcy użytkownik dostaje Forbidden i NIE modyfikuje ogłoszenia', async () => {
    const prisma = makePrisma();
    prisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'owner-1', images: [] });
    const service = build(prisma);

    await expect(service.update('intruder', 'listing-1', {} as any)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.listing.update).not.toHaveBeenCalled();
  });

  it('remove: nieistniejące ogłoszenie → NotFound', async () => {
    const prisma = makePrisma();
    prisma.listing.findUnique.mockResolvedValue(null);
    const service = build(prisma);

    await expect(service.remove('owner-1', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.listing.delete).not.toHaveBeenCalled();
  });

  it('update: właściciel przechodzi i zapisuje zmianę', async () => {
    const prisma = makePrisma();
    prisma.listing.findUnique.mockResolvedValue({ id: 'listing-1', sellerId: 'owner-1', images: [] });
    const service = build(prisma);

    await service.update('owner-1', 'listing-1', { title: 'Po zmianie' } as any);
    expect(prisma.listing.update).toHaveBeenCalled();
  });
});
