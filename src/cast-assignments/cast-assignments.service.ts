import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Availability,
  AvailabilityStatus,
} from '../availabilities/entities/availability.entity.js';
import { timesOverlap } from '../common/date-time.util.js';
import { Rehearsal } from '../rehearsals/entities/rehearsal.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { CreateCastAssignmentDto } from './dto/create-cast-assignment.dto.js';
import { QueryCastAssignmentsDto } from './dto/query-cast-assignments.dto.js';
import { UpdateCastAssignmentDto } from './dto/update-cast-assignment.dto.js';
import { CastAssignment } from './entities/cast-assignment.entity.js';

@Injectable()
export class CastAssignmentsService {
  constructor(
    @InjectRepository(CastAssignment)
    private readonly castAssignmentsRepo: Repository<CastAssignment>,
    @InjectRepository(Rehearsal)
    private readonly rehearsalsRepo: Repository<Rehearsal>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Availability)
    private readonly availabilitiesRepo: Repository<Availability>,
  ) {}

  findAll(query: QueryCastAssignmentsDto) {
    const where: Partial<Pick<CastAssignment, 'rehearsalId' | 'actorId'>> = {};

    if (query.rehearsalId !== undefined) {
      where.rehearsalId = query.rehearsalId;
    }
    if (query.actorId !== undefined) {
      where.actorId = query.actorId;
    }

    return this.castAssignmentsRepo.find({
      where,
      relations: {
        rehearsal: { production: true },
        actor: true,
      },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const assignment = await this.castAssignmentsRepo.findOne({
      where: { id },
      relations: {
        rehearsal: { production: true },
        actor: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException(`Cast assignment #${id} not found`);
    }

    return assignment;
  }

  async create(dto: CreateCastAssignmentDto) {
    const rehearsal = await this.rehearsalsRepo.findOne({
      where: { id: dto.rehearsalId },
    });
    if (!rehearsal) {
      throw new NotFoundException(`Rehearsal #${dto.rehearsalId} not found`);
    }

    const actor = await this.usersRepo.findOne({
      where: { id: dto.actorId },
    });
    if (!actor) {
      throw new NotFoundException(`Actor #${dto.actorId} not found`);
    }
    if (actor.role !== UserRole.ACTOR) {
      throw new BadRequestException(`User #${dto.actorId} is not an actor`);
    }

    const duplicate = await this.castAssignmentsRepo.findOne({
      where: { rehearsalId: dto.rehearsalId, actorId: dto.actorId },
    });
    if (duplicate) {
      throw new ConflictException(
        'Actor is already assigned to this rehearsal',
      );
    }

    const existingAssignments = await this.castAssignmentsRepo.find({
      where: { actorId: dto.actorId },
      relations: { rehearsal: true },
    });

    for (const other of existingAssignments) {
      if (
        other.rehearsal.rehearsalDate === rehearsal.rehearsalDate &&
        timesOverlap(
          rehearsal.startTime,
          rehearsal.endTime,
          other.rehearsal.startTime,
          other.rehearsal.endTime,
        )
      ) {
        throw new ConflictException(
          'Scheduling conflict: actor is already assigned to an overlapping rehearsal',
        );
      }
    }

    const unavailableBlocks = await this.availabilitiesRepo.find({
      where: {
        userId: dto.actorId,
        availableDate: rehearsal.rehearsalDate,
        status: AvailabilityStatus.UNAVAILABLE,
      },
    });

    for (const block of unavailableBlocks) {
      if (
        timesOverlap(
          rehearsal.startTime,
          rehearsal.endTime,
          block.startTime,
          block.endTime,
        )
      ) {
        throw new ConflictException(
          'Scheduling conflict: actor is marked unavailable during this rehearsal',
        );
      }
    }

    const assignment = this.castAssignmentsRepo.create({
      rehearsalId: dto.rehearsalId,
      actorId: dto.actorId,
      roleName: dto.roleName.trim(),
      notes: dto.notes?.trim() ?? null,
    });

    const saved = await this.castAssignmentsRepo.save(assignment);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateCastAssignmentDto) {
    const assignment = await this.castAssignmentsRepo.findOne({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException(`Cast assignment #${id} not found`);
    }

    if (dto.roleName !== undefined) {
      assignment.roleName = dto.roleName.trim();
    }
    if (dto.notes !== undefined) {
      assignment.notes = dto.notes.trim();
    }

    await this.castAssignmentsRepo.save(assignment);
    return this.findOne(id);
  }

  async remove(id: number) {
    const assignment = await this.castAssignmentsRepo.findOne({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException(`Cast assignment #${id} not found`);
    }

    await this.castAssignmentsRepo.remove(assignment);
  }
}
