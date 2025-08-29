// src/players/dto/register-player.dto.ts
import { IsString, Length } from 'class-validator';
export class RegisterPlayerDto {
  @IsString() @Length(3, 30) name: string;
}
