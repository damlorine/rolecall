import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Rehearsal } from '../../rehearsals/entities/rehearsal.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('cast_assignments')
@Unique(['rehearsalId', 'actorId'])
export class CastAssignment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  rehearsalId: number;

  @ManyToOne(() => Rehearsal, (rehearsal) => rehearsal.castAssignments, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'rehearsalId' })
  rehearsal: Relation<Rehearsal>;

  @Column()
  actorId: number;

  @ManyToOne(() => User, (user) => user.castAssignments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'actorId' })
  actor: Relation<User>;

  @Column({ length: 100 })
  roleName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
