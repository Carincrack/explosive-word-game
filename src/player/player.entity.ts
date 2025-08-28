import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'player' }) // nombre EXACTO en MySQL
export class Player {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true, name: 'id' })
  id: number;

  // Si ya existe UNIQUE en BD, evita decoradores que creen otro índice
  // o nómbralos exactamente igual que en la BD:
  // @Index('uq_player_name', ['name'], { unique: true })
  @Column({ name: 'name', type: 'varchar', length: 30, nullable: false })
  name: string;
}
