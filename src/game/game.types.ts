import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export type ID = string;

export type GameStatus = 'lobby' | 'playing' | 'ended';

export interface Player {
  id: ID;
  nickname: string;
  lives: number;
  eliminated: boolean;
  joinedAt: number;
}

export interface RoomOptions {
  turnSeconds: number;
  lives: number;
  language: 'es'; // Solo español
}

export interface Room {
  code: string;
  ownerId: ID;
  status: GameStatus;
  players: Map<ID, Player>;
  usedWords: Set<string>;
  currentPrompt: string | null;
  currentPlayerId: ID | null;
  round: number;
  options: RoomOptions;
  createdAt: number;
  timer?: NodeJS.Timeout;
  turnEndsAt?: number;
}

export interface ClientUser {
  id: ID;
  nickname: string;
}

export interface PublicRoomState {
  code: string;
  ownerId: string;
  status: GameStatus;
  players: Array<Pick<Player, 'id' | 'nickname' | 'lives' | 'eliminated'>>;
  usedCount: number;
  currentPrompt: string | null;
  currentPlayerId: string | null;
  round: number;
  options: RoomOptions;
  turnEndsAt?: number;
}

export class CreateRoomDto {
  @IsString()
  @Length(2, 16)
  nickname!: string;

  @IsOptional()
  options?: Partial<{ turnSeconds: number; lives: number }>; // Sin language
}

export class JoinRoomDto {
  @IsString()
  @Length(4, 6)
  roomCode!: string;

  @IsString()
  @Length(2, 16)
  nickname!: string;
}

export class SubmitWordDto {
  @IsString()
  @Length(2, 40)
  word!: string;
}

export class ChatDto {
  @IsString()
  @Length(1, 200)
  message!: string;
}

export class UpdateOptionsDto {
  @IsOptional() @IsInt() @Min(5) @Max(30)
  turnSeconds?: number;

  @IsOptional() @IsInt() @Min(1) @Max(5)
  lives?: number;
}