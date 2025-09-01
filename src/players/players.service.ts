//player.service.ts

import { Injectable } from '@nestjs/common';
import { Player, Room, RoomOptions, PublicRoomState, ID } from '../game/game.types';

function randomCode(length = 5): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

@Injectable()
export class PlayersService {
  private rooms = new Map<string, Room>();
  private readonly MAX_ROOMS = 1000; // Límite de salas
  private readonly ROOM_CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutos

  constructor() {
    // Limpiar salas inactivas cada 30 minutos
    setInterval(() => this.cleanupInactiveRooms(), this.ROOM_CLEANUP_INTERVAL);
  }

  createRoom(ownerId: ID, nickname: string, options?: Partial<RoomOptions>): Room {
    // Limpiar si hay demasiadas salas
    if (this.rooms.size >= this.MAX_ROOMS) {
      this.cleanupInactiveRooms();
    }

    const code = this.generateUniqueCode();
    const roomOptions: RoomOptions = {
      turnSeconds: options?.turnSeconds ?? 12,
      lives: options?.lives ?? 3,
      language: 'es',
    };

    const owner: Player = {
      id: ownerId,
      nickname: nickname.trim(),
      lives: roomOptions.lives,
      eliminated: false,
      joinedAt: Date.now(),
    };

    const room: Room = {
      code,
      ownerId,
      status: 'lobby',
      players: new Map([[ownerId, owner]]),
      usedWords: new Set(),
      currentPrompt: null,
      currentPlayerId: null,
      round: 0,
      options: roomOptions,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    console.log(`Sala creada: ${code} por ${nickname}`);
    return room;
  }

  private generateUniqueCode(): string {
    let code = randomCode();
    let attempts = 0;
    while (this.rooms.has(code) && attempts < 10) {
      code = randomCode();
      attempts++;
    }
    if (attempts >= 10) {
      throw new Error('No se pudo generar un código único para la sala');
    }
    return code;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteRoom(code: string): boolean {
    const deleted = this.rooms.delete(code);
    if (deleted) {
      console.log(`Sala eliminada: ${code}`);
    }
    return deleted;
  }

  toPublic(room: Room): PublicRoomState {
    return {
      code: room.code,
      ownerId: room.ownerId,
      status: room.status,
      players: [...room.players.values()].map(p => ({
        id: p.id,
        nickname: p.nickname,
        lives: p.lives,
        eliminated: p.eliminated
      })),
      usedCount: room.usedWords.size,
      currentPrompt: room.currentPrompt,
      currentPlayerId: room.currentPlayerId,
      round: room.round,
      options: room.options,
      turnEndsAt: room.turnEndsAt,
    };
  }

  addPlayer(room: Room, player: Player): void {
    if (room.players.size >= 8) {
      throw new Error('La sala está llena');
    }
    room.players.set(player.id, player);
    console.log(`Jugador ${player.nickname} se unió a la sala ${room.code}`);
  }

  removePlayer(room: Room, playerId: ID): void {
    const player = room.players.get(playerId);
    const removed = room.players.delete(playerId);
    
    if (removed && player) {
      console.log(`Jugador ${player.nickname} salió de la sala ${room.code}`);
      
      // Si era el owner, transferir propiedad
      if (room.ownerId === playerId) {
        const remainingPlayers = [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
        if (remainingPlayers.length > 0) {
          room.ownerId = remainingPlayers[0].id;
          console.log(`Propiedad de sala ${room.code} transferida a ${remainingPlayers[0].nickname}`);
        }
      }
      
      // Eliminar sala si no quedan jugadores
      if (room.players.size === 0) {
        this.deleteRoom(room.code);
      }
    }
  }

  getAllRooms(): Room[] {
    return [...this.rooms.values()];
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getActiveRooms(): Room[] {
    return [...this.rooms.values()].filter(room => room.status === 'playing');
  }

  private cleanupInactiveRooms(): void {
    const now = Date.now();
    const INACTIVE_THRESHOLD = 2 * 60 * 60 * 1000; // 2 horas
    let cleanedCount = 0;

    for (const [code, room] of this.rooms.entries()) {
      const isInactive = (now - room.createdAt) > INACTIVE_THRESHOLD;
      const isEmpty = room.players.size === 0;
      const isEndedLongAgo = room.status === 'ended' && (now - room.createdAt) > (30 * 60 * 1000); // 30 min

      if (isInactive || isEmpty || isEndedLongAgo) {
        // Limpiar timer si existe
        if (room.timer) {
          clearTimeout(room.timer);
        }
        this.rooms.delete(code);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Limpieza completada: ${cleanedCount} salas eliminadas`);
    }
  }

  // Método para obtener estadísticas del servidor
  getStats() {
    const rooms = [...this.rooms.values()];
    return {
      totalRooms: rooms.length,
      activeGames: rooms.filter(r => r.status === 'playing').length,
      lobbies: rooms.filter(r => r.status === 'lobby').length,
      endedGames: rooms.filter(r => r.status === 'ended').length,
      totalPlayers: rooms.reduce((sum, room) => sum + room.players.size, 0),
    };
  }
}