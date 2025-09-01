import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Combination } from 'src/combinations/combination.entity';

@Entity()
export class Word {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  word: string;

  @ManyToOne(() => Combination, (combo) => combo.words, { eager: true })
  combination: Combination;
}
