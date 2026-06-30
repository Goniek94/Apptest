/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * AuthService — testy ścieżki krytycznej: rotacja refresh tokenów.
 *
 * Nasz model jest prostszy niż wielosesyjny RefreshSession z drugiego projektu:
 * trzymamy pojedynczy `hashedRefreshToken` (SHA-256 ostatnio wydanego tokenu) na
 * userze i rotujemy go przy każdym `refresh()`. Testy pokrywają:
 *   • happy rotation — ważny token zgodny z zapisanym hashem → nowa para,
 *     a hash zostaje zrotowany (zapisany nowy);
 *   • reuse/stale — token nie zgadza się z zapisanym hashem → 401 i unieważnienie
 *     sesji (hash kasowany do null);
 *   • brak sesji — `hashedRefreshToken=null` → 401;
 *   • zły typ tokenu (access podany jako refresh) → 401.
 *
 * Users / Jwt / Config / Prisma / Mail są w pełni zamockowane.
 */
import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

const VALID_REFRESH = 'valid.refresh.jwt';
const USER = {
  id: 'user-1',
  role: 'USER',
  accountType: 'PRIVATE',
  hashedRefreshToken: sha256(VALID_REFRESH),
};

function makeConfig() {
  return {
    getOrThrow: jest.fn((key: string) => `secret-for-${key}`),
    get: jest.fn((_key: string, fallback?: any) => fallback),
  };
}

function makeJwt(payload: any = { sub: 'user-1', type: 'refresh', role: 'USER', accountType: 'PRIVATE' }) {
  return {
    verifyAsync: jest.fn().mockResolvedValue(payload),
    signAsync: jest.fn().mockImplementation((p: any) => Promise.resolve(`signed-${p.type}`)),
  };
}

function makeUsers(user: any = { ...USER }) {
  return {
    findById: jest.fn().mockResolvedValue(user),
    setRefreshTokenHash: jest.fn().mockResolvedValue(undefined),
    toPublic: jest.fn((u: any) => u),
  };
}

function build(over: { users?: any; jwt?: any } = {}) {
  const users = over.users ?? makeUsers();
  const jwt = over.jwt ?? makeJwt();
  const config = makeConfig();
  const service = new AuthService(users as any, jwt as any, config as any, {} as any, {} as any);
  return { service, users, jwt };
}

describe('AuthService.refresh (rotacja refresh tokenów)', () => {
  it('happy path: rotuje sesję i zapisuje NOWY hash refresh tokenu', async () => {
    const { service, users } = build();

    const tokens = await service.refresh(VALID_REFRESH);

    expect(tokens.accessToken).toBe('signed-access');
    expect(tokens.refreshToken).toBe('signed-refresh');
    // Rotacja: zapisany został hash nowego tokenu (nie null).
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith('user-1', sha256('signed-refresh'));
  });

  it('reuse/stale: token niezgodny z zapisanym hashem → 401 i unieważnienie sesji', async () => {
    const { service, users } = build();

    await expect(service.refresh('stale.token.that.differs')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    // Sesja wypalona — hash skasowany do null.
    expect(users.setRefreshTokenHash).toHaveBeenCalledWith('user-1', null);
  });

  it('brak aktywnej sesji (hashedRefreshToken=null) → 401', async () => {
    const users = makeUsers({ ...USER, hashedRefreshToken: null });
    const { service } = build({ users });

    await expect(service.refresh(VALID_REFRESH)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('zły typ tokenu (access podany jako refresh) → 401', async () => {
    const jwt = makeJwt({ sub: 'user-1', type: 'access', role: 'USER', accountType: 'PRIVATE' });
    const { service } = build({ jwt });

    await expect(service.refresh(VALID_REFRESH)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
