import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PlayersService } from './players.service';
import { GameService } from '../game/game.service';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
export class PlayersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io!: Server;

  constructor(
    private readonly playersService: PlayersService,
    private readonly gameService: GameService,
  ) {}

  handleConnection(client: Socket) {
    client.emit('hello', { id: client.id, serverTime: Date.now() });
  }

  handleDisconnect(client: Socket) {
    const code = client.data.roomCode as string | undefined;
    if (!code) return;
    const room = this.playersService.getRoom(code);
    if (!room) return;
    this.playersService.removePlayer(room, client.id);

    if (room.status === 'playing' && room.currentPlayerId === client.id) {
      this.gameService.handleTimeout(room);
    }

    client.leave(code);
    this.io.to(code).emit('roomState', this.playersService.toPublic(room));
  }
}