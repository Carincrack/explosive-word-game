// src/socket/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class SocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.on('joinRoom', (code: string) => {
      if (typeof code === 'string') {
        void client.join(`room-${code}`);
        client.emit('joinedRoom', { roomCode: code });
      }
    });
  }

  notifyPlayerJoined(roomCode: string, playerName: string) {
    if (!this.server) return;
    this.server.to(`room-${roomCode}`).emit('playerJoined', { playerName });
  }
}
