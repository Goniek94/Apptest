import { randomUUID } from 'crypto';

/**
 * Taksonomia ścieżek w storage — JEDNO miejsce, które decyduje, gdzie ląduje plik.
 * Dzięki temu układ folderów jest spójny i przewidywalny, a odnalezienie zasobów proste:
 *
 *   listings/{sellerId}/{listingId}/{id}.webp   → wszystkie zdjęcia oferty: listings/{seller}/{listing}/
 *   avatars/{userId}/{id}.webp
 *   messages/{conversationId}/{messageId}/{id}.webp  → wszystkie z rozmowy: messages/{conversation}/
 *   disputes/{disputeId}/{id}.webp
 *
 * Nazwy plików to UUID — brak kolizji i brak wycieku oryginalnej nazwy z urządzenia.
 */
const EXT = 'webp';

export const StoragePaths = {
  listingImage(sellerId: string, listingId: string, id: string = randomUUID()): string {
    return `${sellerId}/${listingId}/${id}.${EXT}`;
  },

  avatar(userId: string, id: string = randomUUID()): string {
    return `${userId}/${id}.${EXT}`;
  },

  messageImage(conversationId: string, messageId: string, id: string = randomUUID()): string {
    return `${conversationId}/${messageId}/${id}.${EXT}`;
  },

  disputeImage(disputeId: string, id: string = randomUUID()): string {
    return `${disputeId}/${id}.${EXT}`;
  },
} as const;
