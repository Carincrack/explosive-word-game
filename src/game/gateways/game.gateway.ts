import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from '../services/game.service';
import { LobbyService } from '../services/lobby.service';
import { CreateLobbyDto } from '../dtos/create-lobby.dto';
import { JoinLobbyDto } from '../dtos/join-lobby.dto';
import { SubmitWordDto } from '../dtos/submit-word.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly lobbyService: LobbyService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('connected', { 
      message: 'Connected to BombParty server',
      clientId: client.id 
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.lobbyService.removePlayerFromAllLobbies(client.id);
  }

  @SubscribeMessage('createLobby')
  handleCreateLobby(client: Socket, data: CreateLobbyDto) {
    try {
      const lobby = this.lobbyService.createLobby(
        data.lobbyName,
        client.id,
        data.playerName,
        data.maxPlayers
      );

      client.join(lobby.id);
      
      client.emit('lobbyCreated', {
        lobbyId: lobby.id,
        lobbyName: lobby.name,
        hostId: lobby.hostId
      });

      this.server.emit('lobbyListUpdated', this.lobbyService.getAllLobbies());

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('joinLobby')
  handleJoinLobby(client: Socket, data: JoinLobbyDto) {
    try {
      const lobby = this.lobbyService.joinLobby(data.lobbyId, client.id, data.playerName);
      client.join(lobby.id);

      client.emit('lobbyJoined', {
        lobbyId: lobby.id,
        lobbyName: lobby.name,
        players: lobby.getPlayerList()
      });

      this.server.to(lobby.id).emit('playerJoined', {
        playerId: client.id,
        playerName: data.playerName,
        players: lobby.getPlayerList()
      });

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('leaveLobby')
  handleLeaveLobby(client: Socket, lobbyId: string) {
    try {
      this.lobbyService.leaveLobby(lobbyId, client.id);
      client.leave(lobbyId);

      this.server.to(lobbyId).emit('playerLeft', {
        playerId: client.id,
        players: this.lobbyService.getLobby(lobbyId)?.getPlayerList() || []
      });

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('startGame')
  handleStartGame(client: Socket, lobbyId: string) {
    try {
      const lobby = this.lobbyService.getLobby(lobbyId);
      if (!lobby || lobby.hostId !== client.id) {
        throw new Error('Only the host can start the game');
      }

      this.gameService.startGame(lobbyId, this.server);

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('submitWord')
  handleSubmitWord(client: Socket, data: SubmitWordDto) {
    try {
      this.gameService.submitWord(data.lobbyId, client.id, data.word, this.server);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('getLobbies')
  handleGetLobbies(client: Socket) {
    client.emit('lobbyList', this.lobbyService.getAllLobbies());
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}