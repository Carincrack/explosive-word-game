export class CreateLobbyDto {
  playerName: string;
  lobbyName: string;
  maxPlayers?: number;
  isPublic?: boolean;
}