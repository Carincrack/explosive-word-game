// src/games/engine/game-engine.service.ts
import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { randomLetters3 } from 'src/common/utils/letters';

type PlayerInfo = {
  playerId: number;
  name: string;
  lives: number;
  eliminated: boolean;
};

export type GameState = {
  roomId: number;
  gameId: number;
  status: 'InProgress' | 'Finished';
  players: PlayerInfo[];
  currentIndex: number;
  roundNumber: number;
  letters: string;
  turnMs: number;
  turnTimer?: NodeJS.Timeout;
};

@Injectable()
export class GameEngineService {
  private io!: Server;
  private games = new Map<number, GameState>(); // gameId -> state
  private socketToGame = new Map<
    string,
    { gameId: number; playerId: number }
  >();

  attachServer(io: Server) {
    this.io = io;
  }

  createState(
    gameId: number,
    roomId: number,
    players: PlayerInfo[],
  ): GameState {
    const st: GameState = {
      roomId,
      gameId,
      status: 'InProgress',
      players,
      currentIndex: 0,
      roundNumber: 1,
      letters: randomLetters3(),
      turnMs: 15000,
    };
    this.games.set(gameId, st);
    return st;
  }

  private broadcast(gameId: number, event: string, payload: any) {
    const st = this.games.get(gameId);
    if (!st) return;
    this.io.to(this.roomChannel(st.roomId)).emit(event, payload);
  }

  roomChannel(roomId: number) {
    return `room-${roomId}`;
  }

  startTurn(gameId: number) {
    const st = this.games.get(gameId);
    if (!st) return;
    const current = st.players[st.currentIndex];
    if (current.eliminated) {
      this.nextPlayer(gameId);
      return;
    }
    // (re)programa timeout
    if (st.turnTimer) clearTimeout(st.turnTimer);
    const expiresAt = Date.now() + st.turnMs;
    this.broadcast(gameId, 'TurnChanged', {
      playerId: current.playerId,
      letters: st.letters,
      round: st.roundNumber,
      expiresAt,
    });
    st.turnTimer = setTimeout(
      () => this.failTurn(gameId, current.playerId, 'timeout'),
      st.turnMs,
    );
  }

  submitWord(gameId: number, playerId: number, word: string) {
    const st = this.games.get(gameId);
    if (!st) return;
    const current = st.players[st.currentIndex];
    if (current.playerId !== playerId) return; // no es su turno
    if (st.turnTimer) clearTimeout(st.turnTimer);

    const ok = wordSatisfiesLetters(word, st.letters);
    if (!ok) {
      this.loseLife(st, current, 'invalid', word);
    } else {
      this.broadcast(gameId, 'WordAccepted', {
        playerId,
        word,
        letters: st.letters,
      });
      st.roundNumber += 1;
      st.letters = randomLetters3();
      this.nextPlayer(gameId);
    }
  }

  private failTurn(gameId: number, playerId: number, reason: 'timeout') {
    const st = this.games.get(gameId)!;
    const current = st.players[st.currentIndex];
    if (current.playerId !== playerId) return;
    this.loseLife(st, current, reason, null);
    st.roundNumber += 1;
    st.letters = randomLetters3();
    this.nextPlayer(gameId);
  }

  private loseLife(
    st: GameState,
    p: PlayerInfo,
    reason: string,
    word: string | null,
  ) {
    p.lives -= 1;
    if (p.lives <= 0) {
      p.eliminated = true;
      this.broadcast(st.gameId, 'PlayerEliminated', {
        playerId: p.playerId,
        reason,
      });
    } else {
      this.broadcast(st.gameId, 'LifeLost', {
        playerId: p.playerId,
        left: p.lives,
        reason,
        word,
      });
    }
    this.checkEnd(st);
  }

  private nextPlayer(gameId: number) {
    const st = this.games.get(gameId)!;
    if (st.status === 'Finished') return;
    // avanza índice hasta encontrar vivo
    do {
      st.currentIndex = (st.currentIndex + 1) % st.players.length;
    } while (st.players[st.currentIndex].eliminated);
    this.startTurn(gameId);
  }

  private checkEnd(st: GameState) {
    const alive = st.players.filter((p) => !p.eliminated);
    if (alive.length === 1) {
      st.status = 'Finished';
      this.broadcast(st.gameId, 'GameEnded', {
        winnerPlayerId: alive[0].playerId,
      });
      if (st.turnTimer) clearTimeout(st.turnTimer);
    }
  }
}

function wordSatisfiesLetters(word: string, letters: string): boolean {
  // Ejemplo simple: valida si todas las letras están en la palabra
  const required = letters.toLowerCase().split('');
  const available = word.toLowerCase().split('');
  return required.every((char) => available.includes(char));
}
