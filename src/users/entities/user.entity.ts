import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Availability } from '../../availabilities/entities/availability.entity.js';
import { CastAssignment } from '../../cast-assignments/entities/cast-assignment.entity.js';
import { Production } from '../../productions/entities/production.entity.js';

export enum UserRole {
  DIRECTOR = 'director',
  ACTOR = 'actor',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  fullName: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ length: 255, select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ACTOR,
  })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Production, (production) => production.director)
  productions: Relation<Production>[];

  @OneToMany(() => Availability, (availability) => availability.user)
  availabilities: Relation<Availability>[];

  @OneToMany(() => CastAssignment, (assignment) => assignment.actor)
  castAssignments: Relation<CastAssignment>[];
}
