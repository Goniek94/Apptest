import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';

/**
 * Globalny moduł storage — StorageService dostępny dla wszystkich modułów domenowych
 * (ogłoszenia, profil, wiadomości, spory) bez ponownego importu.
 */
@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
