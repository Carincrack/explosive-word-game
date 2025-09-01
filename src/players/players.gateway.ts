//player.geteway.ts

import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayersService } from './players.service';
import { GameService } from '../game/game.service';
import { Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({ 
  namespace: '/players', 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  } 
})
export class PlayersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io!: Server;

  constructor(
    private readonly playersService: PlayersService,
    @Inject(forwardRef(() => GameService))
    private readonly gameService: GameService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado a /players: ${client.id}`);
    client.emit('connected', { 
      id: client.id, 
      serverTime: Date.now(),
      message: 'Conectado al servidor de jugadores'
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado de /players: ${client.id}`);
    // La lógica de desconexión se maneja en GameGateway
  }

  @SubscribeMessage('getStats')
  getServerStats(@ConnectedSocket() client: Socket) {
    const stats = this.playersService.getStats();
    return {
      success: true,
      stats: {
        ...stats,
        serverUptime: process.uptime(),
        timestamp: Date.now()
      }
    };
  }

  @SubscribeMessage('getActiveRooms')
  getActiveRooms(@ConnectedSocket() client: Socket) {
    const rooms = this.playersService.getActiveRooms();
    const publicRooms = rooms
      .filter(room => room.status === 'lobby' && room.players.size < 8)
      .map(room => ({
        code: room.code,
        playerCount: room.players.size,
        maxPlayers: 8,
        options: room.options,
        createdAt: room.createdAt
      }))
      .slice(0, 20); // Limitar a 20 salas

    return {
      success: true,
      rooms: publicRooms
    };
  }

  @SubscribeMessage('ping')
  ping(@ConnectedSocket() client: Socket) {
    return {
      success: true,
      timestamp: Date.now(),
      pong: true
    };
  }
}