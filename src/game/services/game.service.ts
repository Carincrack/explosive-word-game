import { Injectable, NotFoundException } from '@nestjs/common';
import { Server } from 'socket.io';
import { LobbyService } from './lobby.service';
import { GameConstants } from '../constants/game.constants';

@Injectable()
export class GameService {
  private currentSyllables: Map<string, string> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private usedWords: Map<string, Set<string>> = new Map();

  constructor(private readonly lobbyService: LobbyService) {}

  startGame(lobbyId: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby) {
      throw new NotFoundException('Lobby not found');
    }

    if (!lobby.canStartGame()) {
      throw new Error('Not enough players to start game');
    }

    lobby.status = 'in-game';
    this.usedWords.set(lobbyId, new Set());
    
    server.to(lobbyId).emit('gameStarted', {
      message: 'Game started!',
      players: lobby.getPlayerList(),
      currentPlayer: lobby.currentPlayerId
    });

    this.startTurn(lobbyId, server);
  }

  startTurn(lobbyId: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby || lobby.status !== 'in-game') return;

    const syllable = this.generateSyllable();
    this.currentSyllables.set(lobbyId, syllable);

    server.to(lobbyId).emit('newTurn', {
      syllable,
      currentPlayer: lobby.currentPlayerId,
      timeLeft: GameConstants.TURN_TIME,
      playerName: lobby.getPlayer(lobby.currentPlayerId!)?.name
    });

    // Configurar temporizador para el turno
    const timer = setTimeout(() => {
      this.endTurn(lobbyId, server);
    }, GameConstants.TURN_TIME * 1000);

    this.timers.set(lobbyId, timer);
  }

  endTurn(lobbyId: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby) return;

    const currentPlayer = lobby.getPlayer(lobby.currentPlayerId!);
    if (currentPlayer) {
      currentPlayer.removeLife();
      
      server.to(lobbyId).emit('playerLostLife', {
        playerId: currentPlayer.id,
        lives: currentPlayer.lives,
        word: null
      });

      if (!currentPlayer.isAlive()) {
        server.to(lobbyId).emit('playerEliminated', {
          playerId: currentPlayer.id,
          playerName: currentPlayer.name
        });
        
        lobby.removePlayer(currentPlayer.id);
      }
    }

    this.nextTurn(lobbyId, server);
  }

  nextTurn(lobbyId: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby) return;

    // Verificar si el juego terminó
    if (lobby.players.size <= 1) {
      this.endGame(lobbyId, server);
      return;
    }

    lobby.nextPlayer();
    this.startTurn(lobbyId, server);
  }

  validateWord(lobbyId: string, word: string): boolean {
    const syllable = this.currentSyllables.get(lobbyId);
    const usedWords = this.usedWords.get(lobbyId);
    
    if (!syllable || !usedWords) return false;
    
    const lowerWord = word.toLowerCase();
    const lowerSyllable = syllable.toLowerCase();
    
    // Verificar si la palabra contiene la sílaba y no ha sido usada
    return lowerWord.includes(lowerSyllable) && !usedWords.has(lowerWord);
  }

  submitWord(lobbyId: string, playerId: string, word: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby || lobby.currentPlayerId !== playerId) return;

    const isValid = this.validateWord(lobbyId, word);
    const usedWords = this.usedWords.get(lobbyId);

    if (isValid && usedWords) {
      // Palabra válida
      usedWords.add(word.toLowerCase());
      const player = lobby.getPlayer(playerId);
      player?.addScore(1);

      server.to(lobbyId).emit('wordAccepted', {
        playerId,
        word,
        score: player?.score
      });

      // Pasar al siguiente turno inmediatamente
      clearTimeout(this.timers.get(lobbyId));
      this.nextTurn(lobbyId, server);
    } else {
      // Palabra inválida
      server.to(lobbyId).emit('wordRejected', {
        playerId,
        word,
        reason: !this.currentSyllables.get(lobbyId) ? 'No syllable' : 
                usedWords?.has(word.toLowerCase()) ? 'Word already used' : 
                'Word does not contain syllable'
      });
    }
  }

  endGame(lobbyId: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby) return;

    lobby.status = 'finished';
    
    // Encontrar al ganador
    const winner = Array.from(lobby.players.values())[0];
    
    server.to(lobbyId).emit('gameEnded', {
      winner: winner ? {
        id: winner.id,
        name: winner.name,
        score: winner.score
      } : null,
      players: lobby.getPlayerList()
    });

    // Limpiar recursos
    this.timers.delete(lobbyId);
    this.currentSyllables.delete(lobbyId);
    this.usedWords.delete(lobbyId);
  }

  private generateSyllable(): string {
    const randomIndex = Math.floor(Math.random() * GameConstants.SYLLABLES.length);
    return GameConstants.SYLLABLES[randomIndex];
  }
}