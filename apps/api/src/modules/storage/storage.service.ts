import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import {
  ACCEPTED_INPUT_MIME,
  BUCKETS,
  BucketName,
  IMAGE,
  STORED_MIME,
} from './storage.config';

export interface UploadedImage {
  /** Ścieżka w buckecie (kanoniczna — trzymamy ją w bazie). */
  path: string;
  /** Publiczny URL — tylko dla bucketów publicznych; dla prywatnych `null`. */
  url: string | null;
}

interface NormalizeOptions {
  /** Kwadratowy przycinek o zadanym boku (awatary). Domyślnie skala z zachowaniem proporcji. */
  square?: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    this.client = createClient(
      this.config.getOrThrow<string>('SUPABASE_URL'),
      this.config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  /** Przy starcie zapewniamy istnienie wszystkich bucketów (idempotentnie). */
  async onModuleInit(): Promise<void> {
    await this.ensureBuckets();
  }

  /**
   * Tworzy brakujące buckety i utrzymuje ich konfigurację (publiczny/limit/typy).
   * Bezpieczne do wielokrotnego wywołania.
   */
  async ensureBuckets(): Promise<void> {
    const { data: existing, error } = await this.client.storage.listBuckets();
    if (error) {
      this.logger.error(`Nie udało się pobrać listy bucketów: ${error.message}`);
      return;
    }
    const have = new Set((existing ?? []).map((b) => b.name));

    for (const def of Object.values(BUCKETS)) {
      const options = {
        public: def.public,
        fileSizeLimit: def.fileSizeLimit,
        allowedMimeTypes: [STORED_MIME],
      };

      if (!have.has(def.name)) {
        const { error: createErr } = await this.client.storage.createBucket(
          def.name,
          options,
        );
        if (createErr) {
          this.logger.error(`Bucket "${def.name}" — błąd tworzenia: ${createErr.message}`);
        } else {
          this.logger.log(`Bucket "${def.name}" utworzony (public=${def.public}).`);
        }
      } else {
        // Synchronizujemy konfigurację, gdyby zmieniła się w kodzie.
        await this.client.storage.updateBucket(def.name, options);
      }
    }
  }

  /**
   * Normalizuje i wgrywa obraz. Zwraca ścieżkę + (dla publicznych) URL.
   * @throws BadRequestException dla niewspieranego typu / uszkodzonego pliku.
   */
  async uploadImage(
    bucket: BucketName,
    path: string,
    file: { buffer: Buffer; mimetype: string; size: number },
    opts: NormalizeOptions = {},
  ): Promise<UploadedImage> {
    this.assertAcceptedImage(file);

    const normalized = await this.normalize(file.buffer, opts);

    const { error } = await this.client.storage
      .from(bucket)
      .upload(path, normalized, {
        contentType: STORED_MIME,
        upsert: false,
        cacheControl: '3600',
      });

    if (error) {
      this.logger.error(`Upload do "${bucket}/${path}" nie powiódł się: ${error.message}`);
      throw new InternalServerErrorException('Nie udało się zapisać zdjęcia.');
    }

    return {
      path,
      url: BUCKETS[bucket].public ? this.publicUrl(bucket, path) : null,
    };
  }

  /** Stały publiczny URL (tylko buckety publiczne). */
  publicUrl(bucket: BucketName, path: string): string {
    return this.client.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /** Wygasający URL do bucketów prywatnych (wiadomości, spory). */
  async signedUrl(bucket: BucketName, path: string, expiresInSec = 3600): Promise<string> {
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSec);
    if (error || !data) {
      throw new InternalServerErrorException('Nie udało się wygenerować linku do pliku.');
    }
    return data.signedUrl;
  }

  /** Usuwa jeden lub wiele plików (np. przy kasowaniu oferty). */
  async remove(bucket: BucketName, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.client.storage.from(bucket).remove(paths);
    if (error) {
      this.logger.warn(`Nie udało się usunąć plików z "${bucket}": ${error.message}`);
    }
  }

  // ---------- helpery ----------

  private assertAcceptedImage(file?: { mimetype: string; size: number }): void {
    if (!file) {
      throw new BadRequestException('Brak pliku w żądaniu (oczekiwano pola "file").');
    }
    if (!ACCEPTED_INPUT_MIME.includes(file.mimetype as (typeof ACCEPTED_INPUT_MIME)[number])) {
      throw new BadRequestException(
        'Niewspierany format zdjęcia. Dozwolone: JPEG, PNG, WEBP, HEIC.',
      );
    }
  }

  /**
   * sharp: auto-orientacja wg EXIF, ograniczenie wymiarów, konwersja do webp.
   * Metadane (w tym geolokalizacja) są domyślnie usuwane — prywatność + mniejszy rozmiar.
   */
  private async normalize(buffer: Buffer, opts: NormalizeOptions): Promise<Buffer> {
    try {
      const pipeline = sharp(buffer, { failOn: 'error' }).rotate();

      if (opts.square) {
        pipeline.resize(opts.square, opts.square, { fit: 'cover', position: 'centre' });
      } else {
        pipeline.resize(IMAGE.maxWidth, IMAGE.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      return await pipeline.webp({ quality: IMAGE.webpQuality }).toBuffer();
    } catch {
      throw new BadRequestException('Nie udało się przetworzyć zdjęcia (uszkodzony plik?).');
    }
  }
}
