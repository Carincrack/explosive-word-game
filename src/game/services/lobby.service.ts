import { Injectable, NotFoundException } from '@nestjs/common';
import { Lobby } from '../entities/lobby.entity';
import { GameConstants } from '../constants/game.constants';

@Injectable()
export class LobbyService {
  private lobbies: Map<string, Lobby> = new Map();

  createLobby(name: string, hostId: string, hostName: string, maxPlayers: number = GameConstants.MAX_PLAYERS): Lobby {
    const id = this.generateLobbyId();
    const lobby = new Lobby(id, name, hostId, hostName, maxPlayers);
    this.lobbies.set(id, lobby);
    return lobby;
  }

  joinLobby(lobbyId: string, playerId: string, playerName: string): Lobby {
    const lobby = this.lobbies.get(lobbyId);
    if (!lobby) {
      throw new NotFoundException('Lobby not found');
    }

    if (lobby.players.size >= lobby.maxPlayers) {
      throw new Error('Lobby is full');
    }

    if (lobby.status !== 'waiting') {
      throw new Error('Game already started');
    }

    const success = lobby.addPlayer(playerId, playerName);
    if (!success) {
      throw new Error('Failed to join lobby');
    }

    return lobby;
  }

  leaveLobby(lobbyId: string, playerId: string): void {
    const lobby = this.lobbies.get(lobbyId);
    if (lobby) {
      lobby.removePlayer(playerId);
      
      // Si no quedan jugadores, eliminar la sala
      if (lobby.players.size === 0) {
        this.lobbies.delete(lobbyId);
      }
    }
  }

  getLobby(lobbyId: string): Lobby | undefined {
    return this.lobbies.get(lobbyId);
  }

  getAllLobbies(): Lobby[] {
    return Array.from(this.lobbies.values()).filter(lobby => lobby.isPublic);
  }

  removePlayerFromAllLobbies(playerId: string): void {
    this.lobbies.forEach((lobby, lobbyId) => {
      if (lobby.players.has(playerId)) {
        this.leaveLobby(lobbyId, playerId);
      }
    });
  }

  canStartGame(lobbyId: string): boolean {
    const lobby = this.getLobby(lobbyId);
    return lobby ? lobby.canStartGame() : false;
  }

  private generateLobbyId(): string {
    const characters = '';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
}