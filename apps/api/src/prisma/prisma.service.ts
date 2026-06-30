import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

/**
 * Pojedyncza, wstrzykiwana instancja PrismaClient z kontrolowanym cyklem życia.
 * URL bazy bierzemy jawnie z konfiguracji (nie polegamy na kolejności ładowania process.env).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: ConfigService) {
    super({
      datasources: { db: { url: config.getOrThrow<string>('DATABASE_URL') } },
      log:
        config.get<string>('NODE_ENV') === 'development'
          ? ['warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Połączono z bazą danych (Supabase Postgres).');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
