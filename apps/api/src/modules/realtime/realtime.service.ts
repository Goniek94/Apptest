import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

/**
 * Cienka warstwa nad serwerem socket.io — pozwala serwisom (offers, messages)
 * emitować zdarzenia do konkretnych użytkowników bez znajomości gatewaya.
 * Każdy zalogowany klient dołącza do pokoju `user:<id>`.
 */
@Injectable()
export class RealtimeService {
  private server?: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown): void {
    const unique = [...new Set(userIds)];
    for (const id of unique) this.emitToUser(id, event, payload);
  }
}
