// src/socket/socket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type JoinRoomPayload = { code: string; playerName: string };

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/socket.io',
})
export class SocketGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;

  handleConnection(client: Socket) {
    console.log('✅ Cliente conectado:', client.id);

    client.on('joinRoom', (payload: JoinRoomPayload) => {
      const { code, playerName } = payload ?? {};
      if (!code || !playerName) return;

      const room = `room-${code}`;
      void client.join(room);

      // Opcional: avisar al que entra que ya está adentro
      client.emit('joinedRoom', { roomCode: code });

      // 🔔 Avisar a TODOS en la sala (incluyendo al que entró)
      this.server.to(room).emit('playerJoined', { playerName });

      console.log(`🎮 ${playerName} (${client.id}) se unió a ${room}`);
    });
  }

  // (Puedes mantener este método si lo usas en otros flujos)
  notifyPlayerJoined(roomCode: string, playerName: string) {
    this.server.to(`room-${roomCode}`).emit('playerJoined', { playerName });
  }
}
