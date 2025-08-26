import { Injectable } from '@nestjs/common';
import { PlayersService } from '../players/players.service';
import { WordlistService } from './wordlist';
import { ID, Player, Room } from './game.types';

@Injectable()
export class GameService {
  constructor(
    private readonly playersService: PlayersService,
    private readonly wordlistService: WordlistService,
  ) {}

  startGame(room: Room) {
    if (room.status === 'playing') return;
    room.status = 'playing';
    room.round = 1;
    room.usedWords.clear();
    room.currentPrompt = this.wordlistService.nextSyllable();
    room.currentPlayerId = this.firstAlive(room);
    this.startTurnTimer(room);
  }

  stopGame(room: Room, winnerId?: ID) {
    room.status = 'ended';
    room.turnEndsAt = undefined;
    room.currentPlayerId = null;
    room.currentPrompt = null;
    if (room.timer) clearTimeout(room.timer);
    room.timer = undefined;
  }

  submitWord(room: Room, playerId: ID, rawWord: string): { ok: boolean; reason?: string } {
    if (room.status !== 'playing') return { ok: false, reason: 'not_playing' };
    if (room.currentPlayerId !== playerId) return { ok: false, reason: 'not_your_turn' };

    const word = this.wordlistService.normalize(rawWord);
    if (!this.wordlistService.isAlpha(rawWord)) return { ok: false, reason: 'invalid_chars' };
    if (!room.currentPrompt || !this.wordlistService.containsPrompt(word, room.currentPrompt)) return { ok: false, reason: 'missing_prompt' };
    if (room.usedWords.has(word)) return { ok: false, reason: 'repeated' };

    room.usedWords.add(word);
    this.advanceTurn(room);
    return { ok: true };
  }

  handleTimeout(room: Room) {
    const pid = room.currentPlayerId;
    if (!pid) return;
    const player = room.players.get(pid);
    if (!player) return;
    player.lives -= 1;
    if (player.lives <= 0) player.eliminated = true;

    if (this.countAlive(room) <= 1) {
      const winnerId = this.firstAlive(room);
      this.stopGame(room, winnerId);
      return;
    }

    this.advanceTurn(room);
  }

  private advanceTurn(room: Room) {
    room.currentPlayerId = this.nextAlive(room, room.currentPlayerId ?? undefined);
    room.currentPrompt = this.wordlistService.nextSyllable();
    room.round += 1;
    this.startTurnTimer(room);
  }

  private startTurnTimer(room: Room) {
    if (room.timer) clearTimeout(room.timer);
    const ms = room.options.turnSeconds * 1000;
    room.turnEndsAt = Date.now() + ms;
    room.timer = setTimeout(() => this.handleTimeout(room), ms + 20);
  }

  resetPlayerState(room: Room) {
    for (const p of room.players.values()) {
      p.lives = room.options.lives;
      p.eliminated = false;
    }
  }

  private firstAlive(room: Room): ID {
    return [...room.players.values()].find(p => !p.eliminated)?.id ?? '';
  }

  private nextAlive(room: Room, after?: ID): ID {
    const arr = [...room.players.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    if (!arr.length) return '';
    let idx = after ? arr.findIndex(p => p.id === after) : -1;
    for (let i = 1; i <= arr.length; i++) {
      const p = arr[(idx + i) % arr.length];
      if (!p.eliminated) return p.id;
    }
    return arr[0].id;
  }

  countAlive(room: Room) { return [...room.players.values()].filter(p => !p.eliminated).length; }
}