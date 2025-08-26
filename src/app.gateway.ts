import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/', cors: { origin: '*' } })
export class AppGateway {
  @WebSocketServer() io!: Server;

  handleConnection(client: Socket) {
    client.emit('hello', { id: client.id, serverTime: Date.now() });
  }

  handleDisconnect(client: Socket) {
    // Delegar desconexión a players.gateway.ts si está en una sala
  }
}