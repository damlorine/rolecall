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
import { CastAssignment } from '../../cast-assignments/entities/cast-assignment.entity.js';
import { Production } from '../../productions/entities/production.entity.js';

@Entity('rehearsals')
export class Rehearsal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  productionId: number;

  @ManyToOne(() => Production, (production) => production.rehearsals, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'productionId' })
  production: Relation<Production>;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  location: string | null;

  @Column({ type: 'date' })
  rehearsalDate: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => CastAssignment, (assignment) => assignment.rehearsal)
  castAssignments: Relation<CastAssignment>[];
}
