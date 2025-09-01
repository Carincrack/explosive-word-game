import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Word } from './word.entity';

@Entity()
export class Combination {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 3, unique: true })
  code: string;

  @OneToMany(() => Word, (word) => word.combination)
  words: Word[];
}
