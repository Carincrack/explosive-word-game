
//game.gateway.ts
import { 
  ConnectedSocket, 
  MessageBody, 
  SubscribeMessage, 
  WebSocketGateway, 
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe, Inject, forwardRef } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { PlayersService } from '../players/players.service';
import { GameService } from './game.service';
import { 
  CreateRoomDto, 
  JoinRoomDto, 
  SubmitWordDto, 
  ChatDto, 
  UpdateOptionsDto,
  ChatMessage,
  GameEvent 
} from './game.types';

@WebSocketGateway({ 
  namespace: '/game', 
  cors: { 
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  } 
})
@UsePipes(new ValidationPipe({ transform: true }))
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() io!: Server;

  constructor(
    @Inject(forwardRef(() => PlayersService))
    private readonly playersService: PlayersService,
    private readonly gameService: GameService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Cliente conectado: ${client.id}`);
    client.emit('connected', { 
      id: client.id, 
      serverTime: Date.now(),
      message: 'Conectado al servidor BombParty'
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado: ${client.id}`);
    const code = client.data.roomCode as string | undefined;
    if (!code) return;

    const room = this.playersService.getRoom(code);
    if (!room) return;

    const player = room.players.get(client.id);
    
    // Manejar timeout si era el turno del jugador que se desconectó
    if (room.status === 'playing' && room.currentPlayerId === client.id) {
      const event = this.gameService.handleTimeout(room);
      if (event) {
        this.io.to(code).emit('gameEvent', event);
      }
    }

    this.playersService.removePlayer(room, client.id);
    client.leave(code);

    // Emitir evento de jugador desconectado
    if (player) {
      const disconnectEvent: GameEvent = {
        type: 'player_left',
        playerId: client.id,
        playerName: player.nickname,
        timestamp: Date.now()
      };
      this.io.to(code).emit('gameEvent', disconnectEvent);
    }

    this.pushRoomState(code);
  }

  private pushRoomState(code: string) {
    const room = this.playersService.getRoom(code);
    if (!room) return;
    this.io.to(code).emit('roomState', this.playersService.toPublic(room));
  }

  @SubscribeMessage('createRoom')
  async createRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateRoomDto) {
    try {
      const room = this.playersService.createRoom(client.id, dto.nickname, {
        turnSeconds: dto.turnSeconds || 12,
        lives: dto.lives || 3,
        language: 'es'
      });

      client.data.nickname = dto.nickname;
      client.data.roomCode = room.code;
      client.join(room.code);

      this.pushRoomState(room.code);
      
      return { 
        success: true,
        roomCode: room.code, 
        you: { id: client.id, nickname: dto.nickname },
        room: this.playersService.toPublic(room)
      };
    } catch (error) {
      return { 
        success: false, 
        error: { code: 'create_failed', message: 'Error al crear la sala' } 
      };
    }
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinRoomDto) {
    const room = this.playersService.getRoom(dto.roomCode.toUpperCase());
    if (!room) {
      return { 
        success: false, 
        error: { code: 'room_not_found', message: 'Sala no existe' } 
      };
    }

    if (room.status !== 'lobby') {
      return { 
        success: false, 
        error: { code: 'already_started', message: 'La partida ya comenzó' } 
      };
    }

    if (room.players.size >= 8) {
      return { 
        success: false, 
        error: { code: 'room_full', message: 'La sala está llena' } 
      };
    }

    // Verificar si el nickname ya existe
    const nicknameExists = [...room.players.values()].some(p => 
      p.nickname.toLowerCase() === dto.nickname.toLowerCase()
    );
    if (nicknameExists) {
      return { 
        success: false, 
        error: { code: 'nickname_taken', message: 'Ese nombre ya está en uso' } 
      };
    }

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

    // Emitir evento de jugador unido
    const joinEvent: GameEvent = {
      type: 'player_joined',
      playerId: client.id,
      playerName: dto.nickname,
      timestamp: Date.now()
    };
    this.io.to(room.code).emit('gameEvent', joinEvent);

    this.pushRoomState(room.code);
    
    return { 
      success: true,
      room: this.playersService.toPublic(room), 
      you: { id: client.id, nickname: dto.nickname } 
    };
  }

  @SubscribeMessage('leaveRoom')
  leaveRoom(@ConnectedSocket() client: Socket) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { success: false, error: 'No estás en una sala' };

    const room = this.playersService.getRoom(code);
    if (!room) return { success: false, error: 'Sala no encontrada' };

    const player = room.players.get(client.id);
    
    // Manejar si era el turno del jugador
    if (room.status === 'playing' && room.currentPlayerId === client.id) {
      const event = this.gameService.handleTimeout(room);
      if (event) {
        this.io.to(code).emit('gameEvent', event);
      }
    }

    this.playersService.removePlayer(room, client.id);
    client.leave(code);
    client.data.roomCode = undefined;

    // Emitir evento de jugador que se fue
    if (player) {
      const leaveEvent: GameEvent = {
        type: 'player_left',
        playerId: client.id,
        playerName: player.nickname,
        timestamp: Date.now()
      };
      this.io.to(code).emit('gameEvent', leaveEvent);
    }

    this.pushRoomState(code);
    return { success: true };
  }

  @SubscribeMessage('updateOptions')
  updateOptions(@ConnectedSocket() client: Socket, @MessageBody() dto: UpdateOptionsDto) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { success: false, error: 'No estás en una sala' };

    const room = this.playersService.getRoom(code);
    if (!room) return { success: false, error: 'Sala no encontrada' };

    if (room.ownerId !== client.id) {
      return { success: false, error: 'Solo el owner puede cambiar opciones' };
    }

    if (room.status !== 'lobby') {
      return { success: false, error: 'No se pueden cambiar opciones durante el juego' };
    }

    if (dto.turnSeconds !== undefined) {
      room.options.turnSeconds = dto.turnSeconds;
    }
    if (dto.lives !== undefined) {
      room.options.lives = dto.lives;
      // Actualizar vidas de jugadores existentes
      for (const player of room.players.values()) {
        player.lives = dto.lives;
      }
    }

    this.pushRoomState(code);
    return { success: true, options: room.options };
  }

  @SubscribeMessage('startGame')
  async startGame(@ConnectedSocket() client: Socket) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { success: false, error: 'No estás en una sala' };

    const room = this.playersService.getRoom(code);
    if (!room) return { success: false, error: 'Sala no encontrada' };

    if (room.ownerId !== client.id) {
      return { success: false, error: 'Solo el owner puede iniciar' };
    }

    if (room.players.size < 2) {
      return { success: false, error: 'Se necesitan al menos 2 jugadores' };
    }

    if (room.status !== 'lobby') {
      return { success: false, error: 'El juego ya está en progreso' };
    }

    this.gameService.resetPlayerState(room);
    const event = await this.gameService.startGame(room);
    
    if (event) {
      this.io.to(code).emit('gameEvent', event);
    }

    this.pushRoomState(code);
    return { success: true, room: this.playersService.toPublic(room) };
  }

  @SubscribeMessage('submitWord')
  async submitWord(@ConnectedSocket() client: Socket, @MessageBody() dto: SubmitWordDto) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { success: false, error: 'No estás en una sala' };

    const room = this.playersService.getRoom(code);
    if (!room) return { success: false, error: 'Sala no encontrada' };

    const result = await this.gameService.submitWord(room, client.id, dto.word);
    
    if (result.event) {
      this.io.to(code).emit('gameEvent', result.event);
    }

    this.pushRoomState(code);

    if (!result.ok) {
      return { success: false, reason: result.reason };
    }

    return { success: true };
  }

  @SubscribeMessage('chat')
  chat(@ConnectedSocket() client: Socket, @MessageBody() dto: ChatDto) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { success: false, error: 'No estás en una sala' };

    const room = this.playersService.getRoom(code);
    if (!room) return { success: false, error: 'Sala no encontrada' };

    const message: ChatMessage = {
      from: client.data.nickname ?? 'Anónimo',
      message: dto.message.trim(),
      at: Date.now()
    };

    this.io.to(code).emit('chat', message);
    return { success: true };
  }

  @SubscribeMessage('getRoomState')
  getRoomState(@ConnectedSocket() client: Socket) {
    const code: string | undefined = client.data.roomCode;
    if (!code) return { success: false, error: 'No estás en una sala' };

    const room = this.playersService.getRoom(code);
    if (!room) return { success: false, error: 'Sala no encontrada' };

    return {
      success: true,
      room: this.playersService.toPublic(room),
      you: { id: client.id, nickname: client.data.nickname }
    };
  }
}