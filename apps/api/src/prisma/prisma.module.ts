import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Globalny moduł bazy danych — PrismaService dostępny w całej aplikacji
 * bez ponownego importowania w każdym module.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
