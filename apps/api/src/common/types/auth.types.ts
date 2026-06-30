import { AccountType, Role } from '@prisma/client';

/** Zawartość tokena JWT (access/refresh). `sub` = id użytkownika. */
export interface JwtPayload {
  sub: string;
  role: Role;
  accountType: AccountType;
  type: 'access' | 'refresh';
}

/** Obiekt użytkownika wstrzykiwany do `request.user` przez strategię JWT. */
export interface AuthUser {
  userId: string;
  role: Role;
  accountType: AccountType;
}
