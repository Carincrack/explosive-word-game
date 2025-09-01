import { Player } from './player.entity';

export class Lobby {
  id: string;
  name: string;
  hostId: string;
  players: Map<string, Player>;
  isPublic: boolean;
  status: 'waiting' | 'in-game' | 'finished';
  currentPlayerId: string | null;
  maxPlayers: number;

  constructor(id: string, name: string, hostId: string, hostName: string, maxPlayers: number = 8) {
    this.id = id;
    this.name = name;
    this.hostId = hostId;
    this.players = new Map();
    this.isPublic = true;
    this.status = 'waiting';
    this.currentPlayerId = null;
    this.maxPlayers = maxPlayers;
    
    this.addPlayer(hostId, hostName, true);
    this.currentPlayerId = hostId;
  }

  addPlayer(playerId: string, name: string, isHost: boolean = false): boolean {
    if (this.players.size >= this.maxPlayers) return false;
    
    this.players.set(playerId, new Player(playerId, name, isHost));
    return true;
  }

  removePlayer(playerId: string): void {
    this.players.delete(playerId);
    
    // Si el host se va, asignar nuevo host
    if (playerId === this.hostId && this.players.size > 0) {
      const firstPlayer = Array.from(this.players.values())[0];
      this.hostId = firstPlayer.id;
      firstPlayer.isHost = true;
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  nextPlayer(): void {
    if (!this.currentPlayerId || this.players.size === 0) return;

    const playerIds = Array.from(this.players.keys());
    const currentIndex = playerIds.indexOf(this.currentPlayerId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    
    this.currentPlayerId = playerIds[nextIndex];
  }

  getPlayerList(): Player[] {
    return Array.from(this.players.values());
  }

  canStartGame(): boolean {
    return this.players.size >= 2 && this.status === 'waiting';
  }

  resetGame(): void {
    this.status = 'waiting';
    this.players.forEach(player => {
      player.score = 0;
      player.lives = 3;
    });
  }
}