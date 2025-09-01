// src/gateway/game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameEngineService } from '../engine/game-engine.service';
import { GamesService } from '../game.service';

@WebSocketGateway({
  namespace: '/game', // <- ✅ IMPORTANTE: separa namespace
  cors: { origin: '*' },
  path: '/socket.io', // <- ✅ asegúrate que use el mismo path
})
export class GameGateway {
  @WebSocketServer() io: Server;
  private roomOf = new Map<string, number>();
  private playerOf = new Map<string, number>();

  constructor(
    private engine: GameEngineService,
    private games: GamesService,
  ) {}

  afterInit() {
    this.engine.attachServer(this.io);
  }

  @SubscribeMessage('JoinRoom')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: number; playerId: number; name: string },
  ) {
    const roomChannel = `room-${data.roomId}`;
    void client.join(roomChannel);
    this.roomOf.set(client.id, data.roomId);
    this.playerOf.set(client.id, data.playerId);
    this.io
      .to(roomChannel)
      .emit('PlayerJoined', { playerId: data.playerId, name: data.name });
  }

  @SubscribeMessage('StartGame')
  async handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomCode: string },
  ) {
    const { gameId, roomId } = await this.games.createAndStartByCode(
      data.roomCode,
    );
    this.io.to(`room-${roomId}`).emit('GameStarted', { gameId });
  }

  @SubscribeMessage('SubmitWord')
  onWord(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { gameId: number; word: string },
  ) {
    const playerId = this.playerOf.get(client.id)!;
    void this.engine.submitWord(data.gameId, playerId, data.word);
  }
}
