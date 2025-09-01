//geme serivice

import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PlayersService } from '../players/players.service';
import { WordlistService } from '../wordlist/wordlist.service';
import { ID, Player, Room, GameEvent } from './game.types';

@Injectable()
export class GameService {
  constructor(
    @Inject(forwardRef(() => PlayersService))
    private readonly playersService: PlayersService,
    private readonly wordlistService: WordlistService,
  ) {}

  async startGame(room: Room): Promise<GameEvent | null> {
    if (room.status === 'playing') return null;
    
    room.status = 'playing';
    room.round = 1;
    room.usedWords.clear();
    room.currentPrompt = await this.wordlistService.nextSyllable();
    room.currentPlayerId = this.firstAlive(room);
    
    this.startTurnTimer(room);
    
    return {
      type: 'game_started',
      timestamp: Date.now()
    };
  }

  stopGame(room: Room, winnerId?: ID): GameEvent {
    room.status = 'ended';
    room.turnEndsAt = undefined;
    room.currentPlayerId = null;
    room.currentPrompt = null;
    
    if (room.timer) {
      clearTimeout(room.timer);
      room.timer = undefined;
    }

    return {
      type: 'game_ended',
      winnerId,
      timestamp: Date.now()
    };
  }

  async submitWord(room: Room, playerId: ID, rawWord: string): Promise<{ ok: boolean; reason?: string; event?: GameEvent }> {
    if (room.status !== 'playing') {
      return { ok: false, reason: 'not_playing' };
    }
    
    if (room.currentPlayerId !== playerId) {
      return { ok: false, reason: 'not_your_turn' };
    }

    const word = this.wordlistService.normalize(rawWord);
    
    if (!this.wordlistService.isAlpha(rawWord)) {
      return { ok: false, reason: 'invalid_chars' };
    }
    
    if (!room.currentPrompt || !this.wordlistService.containsPrompt(word, room.currentPrompt)) {
      return { ok: false, reason: 'missing_prompt' };
    }
    
    if (room.usedWords.has(word)) {
      return { ok: false, reason: 'repeated' };
    }

    // Validar palabra en diccionario
    const isValid = await this.wordlistService.isValidWord(word);
    if (!isValid) {
      return { ok: false, reason: 'invalid_word' };
    }

    room.usedWords.add(word);
    await this.advanceTurn(room);
    
    const player = room.players.get(playerId);
    return {
      ok: true,
      event: {
        type: 'word_submitted',
        playerId,
        playerName: player?.nickname,
        word: rawWord,
        timestamp: Date.now()
      }
    };
  }

  handleTimeout(room: Room): GameEvent | null {
    const pid = room.currentPlayerId;
    if (!pid) return null;
    
    const player = room.players.get(pid);
    if (!player) return null;

    player.lives -= 1;
    if (player.lives <= 0) {
      player.eliminated = true;
    }

    const event: GameEvent = {
      type: 'turn_timeout',
      playerId: pid,
      playerName: player.nickname,
      timestamp: Date.now()
    };

    if (this.countAlive(room) <= 1) {
      const winnerId = this.firstAlive(room);
      const endEvent = this.stopGame(room, winnerId);
      return endEvent;
    }

    this.advanceTurn(room);
    return event;
  }

  private async advanceTurn(room: Room) {
    room.currentPlayerId = this.nextAlive(room, room.currentPlayerId ?? undefined);
    room.currentPrompt = await this.wordlistService.nextSyllable();
    room.round += 1;
    this.startTurnTimer(room);
  }

  private startTurnTimer(room: Room) {
    if (room.timer) clearTimeout(room.timer);
    
    const ms = room.options.turnSeconds * 1000;
    room.turnEndsAt = Date.now() + ms;
    
    room.timer = setTimeout(() => {
      this.handleTimeout(room);
      // Aquí deberías emitir el evento a través del gateway
    }, ms + 100); // +100ms de margen
  }

  resetPlayerState(room: Room) {
    for (const player of room.players.values()) {
      player.lives = room.options.lives;
      player.eliminated = false;
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
      const player = arr[(idx + i) % arr.length];
      if (!player.eliminated) return player.id;
    }
    
    return arr[0].id;
  }

  countAlive(room: Room): number {
    return [...room.players.values()].filter(p => !p.eliminated).length;
  }

  getRoomStats(room: Room) {
    return {
      totalPlayers: room.players.size,
      alivePlayers: this.countAlive(room),
      wordsUsed: room.usedWords.size,
      currentRound: room.round,
      gameTime: Date.now() - room.createdAt
    };
  }
}