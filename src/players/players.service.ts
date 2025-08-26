import { Injectable } from '@nestjs/common';
import { Player, Room, RoomOptions, PublicRoomState, ID } from '../game/game.types';

function randomCode(len = 5) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
}

@Injectable()
export class PlayersService {
  private rooms = new Map<string, Room>();

  createRoom(ownerId: ID, nickname: string, opt?: Partial<RoomOptions>): Room {
    const code = this.generateUniqueCode();
    const options: RoomOptions = {
      turnSeconds: opt?.turnSeconds ?? 12,
      lives: opt?.lives ?? 3,
      language: 'es', // Fijo en español
    };
    const owner: Player = {
      id: ownerId,
      nickname,
      lives: options.lives,
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
      options,
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  private generateUniqueCode(): string {
    let code = randomCode();
    while (this.rooms.has(code)) code = randomCode();
    return code;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  deleteRoom(code: string) {
    this.rooms.delete(code);
  }

  toPublic(room: Room): PublicRoomState {
    return {
      code: room.code,
      ownerId: room.ownerId,
      status: room.status,
      players: [...room.players.values()].map(p => ({ id: p.id, nickname: p.nickname, lives: p.lives, eliminated: p.eliminated })),
      usedCount: room.usedWords.size,
      currentPrompt: room.currentPrompt,
      currentPlayerId: room.currentPlayerId,
      round: room.round,
      options: room.options,
      turnEndsAt: room.turnEndsAt,
    };
  }

  addPlayer(room: Room, player: Player) {
    room.players.set(player.id, player);
  }

  removePlayer(room: Room, playerId: ID) {
    room.players.delete(playerId);
    if (room.ownerId === playerId) {
      const remaining = [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
      room.ownerId = remaining[0]?.id ?? '';
    }
    if (room.players.size === 0) this.deleteRoom(room.code);
  }
}