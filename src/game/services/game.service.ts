import { Injectable, NotFoundException } from '@nestjs/common';
import { Server } from 'socket.io';
import { LobbyService } from './lobby.service';
import { DictionaryService } from '../../dictionary.service';
import { GameConstants } from '../constants/game.constants';

@Injectable()
export class GameService {
  private currentSyllables: Map<string, string> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private usedWords: Map<string, Set<string>> = new Map();

  constructor(
    private readonly lobbyService: LobbyService,
    private readonly dictionaryService: DictionaryService
  ) {}

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

  // Validación usando DictionaryService
  async validateWord(lobbyId: string, word: string): Promise<{ isValid: boolean; reason?: string }> {
    const syllable = this.currentSyllables.get(lobbyId);
    const usedWords = this.usedWords.get(lobbyId);
    
    if (!syllable || !usedWords) {
      return { isValid: false, reason: 'Estado del juego inválido' };
    }
    
    const lowerWord = word.toLowerCase().trim();
    
    // Verificar si ya fue usada
    if (usedWords.has(lowerWord)) {
      return { isValid: false, reason: 'Palabra ya utilizada' };
    }

    // Usar el DictionaryService para validar
    const validation = await this.dictionaryService.validateWordWithSyllable(word, syllable);
    
    return validation;
  }

  async submitWord(lobbyId: string, playerId: string, word: string, server: Server): Promise<void> {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby || lobby.currentPlayerId !== playerId) {
      return;
    }

    // Verificar que el diccionario esté listo
    if (!this.dictionaryService.isReady()) {
      server.to(playerId).emit('wordRejected', {
        playerId,
        word,
        reason: 'Diccionario aún cargando, intenta de nuevo'
      });
      return;
    }

    const validation = await this.validateWord(lobbyId, word);
    const usedWords = this.usedWords.get(lobbyId);

    if (validation.isValid && usedWords) {
      // Palabra válida
      const cleanWord = word.toLowerCase().trim();
      usedWords.add(cleanWord);
      const player = lobby.getPlayer(playerId);
      
      // Calcular puntos basados en la longitud de la palabra
      const points = Math.max(1, Math.floor(cleanWord.length / 3));
      player?.addScore(points);

      server.to(lobbyId).emit('wordAccepted', {
        playerId,
        word: cleanWord,
        points,
        totalScore: player?.score,
        playerName: player?.name
      });

      // Pasar al siguiente turno inmediatamente
      const timer = this.timers.get(lobbyId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(lobbyId);
      }
      
      this.nextTurn(lobbyId, server);
    } else {
      // Palabra inválida
      server.to(playerId).emit('wordRejected', {
        playerId,
        word,
        reason: validation.reason || 'Palabra inválida'
      });
    }
  }

  endGame(lobbyId: string, server: Server): void {
    const lobby = this.lobbyService.getLobby(lobbyId);
    if (!lobby) return;

    lobby.status = 'finished';
    
    // Encontrar al ganador (jugador con más puntos)
    const players = Array.from(lobby.players.values());
    const winner = players.reduce((prev, current) => {
      return (current.score > prev.score) ? current : prev;
    }, players[0]);
    
    server.to(lobbyId).emit('gameEnded', {
      winner: winner ? {
        id: winner.id,
        name: winner.name,
        score: winner.score
      } : null,
      players: lobby.getPlayerList().sort((a, b) => b.score - a.score), // Ordenar por puntuación
      gameStats: {
        totalWordsUsed: this.usedWords.get(lobbyId)?.size || 0,
        dictionaryStats: this.dictionaryService.getStats()
      }
    });

    // Limpiar recursos
    const timer = this.timers.get(lobbyId);
    if (timer) {
      clearTimeout(timer);
    }
    this.timers.delete(lobbyId);
    this.currentSyllables.delete(lobbyId);
    this.usedWords.delete(lobbyId);
  }

  private generateSyllable(): string {
    const randomIndex = Math.floor(Math.random() * GameConstants.SYLLABLES.length);
    return GameConstants.SYLLABLES[randomIndex];
  }

  // Método para obtener estadísticas del juego
  getGameStats(lobbyId: string) {
    const currentSyllable = this.currentSyllables.get(lobbyId);
    const usedWords = this.usedWords.get(lobbyId);
    const dictionaryStats = this.dictionaryService.getStats();
    
    // Encontrar palabras ejemplo para la sílaba actual
    const exampleWords = currentSyllable ? 
      this.dictionaryService.findWordsWithSyllable(currentSyllable, 5) : [];

    return {
      currentSyllable,
      usedWordsCount: usedWords?.size || 0,
      usedWordsList: usedWords ? Array.from(usedWords) : [],
      dictionaryStats,
      exampleWords: exampleWords
    };
  }

  // Método para agregar palabras personalizadas al diccionario
  addCustomWords(words: string[]): void {
    this.dictionaryService.addWords(words);
  }

  // Método para testear una palabra sin afectar el juego
  async testWord(word: string, syllable: string): Promise<{
    isValid: boolean;
    reason?: string;
    inDictionary: boolean;
    containsSyllable: boolean;
  }> {
    const validation = await this.dictionaryService.validateWordWithSyllable(word, syllable);
    const inDictionary = await this.dictionaryService.isValidWord(word);
    const containsSyllable = word.toLowerCase().includes(syllable.toLowerCase());

    return {
      ...validation,
      inDictionary,
      containsSyllable
    };
  }
}