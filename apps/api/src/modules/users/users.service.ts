import { Injectable, NotFoundException } from '@nestjs/common';
import { AccountType, Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

export type PublicUser = Omit<User, 'passwordHash' | 'hashedRefreshToken'>;

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  displayName: string;
  accountType: AccountType;
  role?: Role;
  companyName?: string | null;
  nip?: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('Użytkownik nie istnieje.');
    return user;
  }

  create(input: CreateUserInput): Promise<User> {
    const data: Prisma.UserCreateInput = {
      email: input.email,
      passwordHash: input.passwordHash,
      displayName: input.displayName,
      accountType: input.accountType,
      role: input.role ?? Role.USER,
      companyName: input.companyName ?? null,
      nip: input.nip ?? null,
    };
    return this.prisma.user.create({ data });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    await this.getByIdOrThrow(id);
    const { settings, ...rest } = dto;
    return this.prisma.user.update({
      where: { id },
      data: { ...rest, ...(settings !== undefined ? { settings: settings as Prisma.InputJsonValue } : {}) },
    });
  }

  /** Zapisuje hash refresh tokena (rotacja). `null` = wylogowanie / unieważnienie. */
  setRefreshTokenHash(id: string, hashedRefreshToken: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { hashedRefreshToken },
    });
  }

  /** Usuwa pola wrażliwe przed zwróceniem użytkownika na zewnątrz. */
  toPublic(user: User): PublicUser {
    const { passwordHash: _p, hashedRefreshToken: _r, ...rest } = user;
    void _p;
    void _r;
    return rest;
  }
}
