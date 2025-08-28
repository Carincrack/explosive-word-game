import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity('player')
@Unique(['name'])
export class Player {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 30 }) name: string;
}
