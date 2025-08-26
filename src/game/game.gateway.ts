import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlayersService } from '../players/players.service';
import { GameService } from './game.service';
import { CreateRoomDto, JoinRoomDto, SubmitWordDto, ChatDto, UpdateOptionsDto } from './game.types';

@WebSocketGateway({ namespace: '/game', cors: { origin: '*' } })
@UsePipes(new ValidationPipe({ transform: true }))
export class GameGateway {
  @WebSocketServer() io!: Server;
constructor(
  private readonly playersService: PlayersService,
  private readonly gameService: GameService,
) {}


  private pushRoomState(code: string) {
    const room = this.playersService.getRoom(code);
    if (!room) return;
    this.io.to(code).emit('roomState', this.playersService.toPublic(room));
  }

  @SubscribeMessage('createRoom')
  createRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateRoomDto) {
    const room = this.playersService.createRoom(client.id, dto.nickname, { ...dto.options, language: 'es' });
    client.data.nickname = dto.nickname;
    client.data.roomCode = room.code;
    client.join(room.code);
    this.pushRoomState(room.code);
    return { roomCode: room.code, you: { id: client.id, nickname: dto.nickname } };
  }

  @SubscribeMessage('joinRoom')
  joinRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinRoomDto) {
    const room = this.playersService.getRoom(dto.roomCode);
    if (!room) return { error: { code: 'room_not_found', message: 'Sala no existe' } };
    if (room.status !== 'lobby') return { error: { code: 'already_started', message: 'La partida ya comenzó' } };

    const player = {
      id: client.id,
      nickname: dto.nickname,
      lives: room.options.lives,
      eliminated: false,
      joinedAt: Date.now(),
    };

    this.playersService.addPlayer(room, player);
    client.data.nickname = dto.nickname;
    client.data.roomCode = room.code;
    client.join(room.code);
    this.pushRoomState(room.code);
    return { room: this.playersService.toPublic(room), you: { id: client.id, nickname: dto.nickname } };
  }

  @SubscribeMessage('leaveRoom')
  leaveRoom(@ConnectedSocket() client: Socket) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return;
    const room = this.playersService.getRoom(code);
    if (!room) return;
    this.playersService.removePlayer(room, client.id);

    if (room.status === 'playing' && room.currentPlayerId === client.id) {
      this.gameService.handleTimeout(room);
    }

    client.leave(code);
    client.data.roomCode = undefined;
    this.pushRoomState(code);
    return { ok: true };
  }

  @SubscribeMessage('updateOptions')
  updateOptions(@ConnectedSocket() client: Socket, @MessageBody() dto: UpdateOptionsDto) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { error: { code: 'no_room', message: 'No estás en una sala' } };
    const room = this.playersService.getRoom(code);
    if (!room) return { error: { code: 'no_room', message: 'No estás en una sala' } };
    if (room.ownerId !== client.id) return { error: { code: 'forbidden', message: 'Solo el owner puede cambiar opciones' } };

    room.options.turnSeconds = dto.turnSeconds ?? room.options.turnSeconds;
    room.options.lives = dto.lives ?? room.options.lives;
    this.pushRoomState(code);
    return { ok: true, room: this.playersService.toPublic(room) };
  }

  @SubscribeMessage('startGame')
  startGame(@ConnectedSocket() client: Socket) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { error: { code: 'no_room', message: 'No estás en una sala' } };
    const room = this.playersService.getRoom(code);
    if (!room) return { error: { code: 'no_room', message: 'No estás en una sala' } };
    if (room.ownerId !== client.id) return { error: { code: 'forbidden', message: 'Solo el owner puede iniciar' } };

    this.gameService.resetPlayerState(room);
    this.gameService.startGame(room);
    this.pushRoomState(code);
    return { room: this.playersService.toPublic(room) };
  }

  @SubscribeMessage('submitWord')
  submitWord(@ConnectedSocket() client: Socket, @MessageBody() dto: SubmitWordDto) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { error: { code: 'no_room', message: 'No estás en una sala' } };
    const room = this.playersService.getRoom(code);
    if (!room) return { error: { code: 'no_room', message: 'No estás en una sala' } };

    const result = this.gameService.submitWord(room, client.id, dto.word);
    this.pushRoomState(code);

    if (!result.ok) return { ok: false, reason: result.reason };
    return { ok: true, room: this.playersService.toPublic(room) };
  }

  @SubscribeMessage('chat')
  chat(@ConnectedSocket() client: Socket, @MessageBody() dto: ChatDto) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { error: { code: 'no_room', message: 'No estás en una sala' } };
    const msg = { from: client.data.nickname ?? 'anon', message: dto.message, at: Date.now() };
    this.io.to(code).emit('chat', msg);
    return { ok: true };
  }
}