import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Rehearsal } from '../../rehearsals/entities/rehearsal.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('productions')
export class Production {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  directorId: number;

  @ManyToOne(() => User, (user) => user.productions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'directorId' })
  director: Relation<User>;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  venue: string | null;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Rehearsal, (rehearsal) => rehearsal.production)
  rehearsals: Relation<Rehearsal>[];
}
