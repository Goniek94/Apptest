/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * RolesGuard — testy kontroli ról (dostęp do endpointów admina).
 *
 *   • brak wymaganych ról → przepuszcza (endpoint publiczny dla zalogowanych);
 *   • wymagany ADMIN + użytkownik ADMIN → przepuszcza;
 *   • wymagany ADMIN + zwykły USER → Forbidden;
 *   • wymagany ADMIN + brak usera w request → Forbidden.
 */
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

function makeCtx(user: any): any {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
}

function makeReflector(required: Role[] | undefined): any {
  return { getAllAndOverride: jest.fn().mockReturnValue(required) };
}

describe('RolesGuard', () => {
  it('przepuszcza, gdy endpoint nie wymaga żadnej roli', () => {
    const guard = new RolesGuard(makeReflector(undefined));
    expect(guard.canActivate(makeCtx({ role: Role.USER }))).toBe(true);
  });

  it('przepuszcza administratora na endpoint @Roles(ADMIN)', () => {
    const guard = new RolesGuard(makeReflector([Role.ADMIN]));
    expect(guard.canActivate(makeCtx({ role: Role.ADMIN }))).toBe(true);
  });

  it('blokuje zwykłego użytkownika na endpoint @Roles(ADMIN)', () => {
    const guard = new RolesGuard(makeReflector([Role.ADMIN]));
    expect(() => guard.canActivate(makeCtx({ role: Role.USER }))).toThrow(
      ForbiddenException,
    );
  });

  it('blokuje, gdy brak zalogowanego użytkownika', () => {
    const guard = new RolesGuard(makeReflector([Role.ADMIN]));
    expect(() => guard.canActivate(makeCtx(undefined))).toThrow(ForbiddenException);
  });
});
