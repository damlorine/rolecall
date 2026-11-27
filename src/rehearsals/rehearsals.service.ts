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
import { CastAssignment } from '../cast-assignments/entities/cast-assignment.entity.js';
import { isValidDateString, timesOverlap } from '../common/date-time.util.js';
import { MailService } from '../mail/mail.service.js';
import { Production } from '../productions/entities/production.entity.js';
import { CreateRehearsalDto } from './dto/create-rehearsal.dto.js';
import { QueryRehearsalsDto } from './dto/query-rehearsals.dto.js';
import { UpdateRehearsalDto } from './dto/update-rehearsal.dto.js';
import { Rehearsal } from './entities/rehearsal.entity.js';

@Injectable()
export class RehearsalsService {
  constructor(
    @InjectRepository(Rehearsal)
    private readonly rehearsalsRepo: Repository<Rehearsal>,
    @InjectRepository(Production)
    private readonly productionsRepo: Repository<Production>,
    @InjectRepository(CastAssignment)
    private readonly castAssignmentsRepo: Repository<CastAssignment>,
    @InjectRepository(Availability)
    private readonly availabilitiesRepo: Repository<Availability>,
    private readonly mailService: MailService,
  ) {}

  async findAll(query: QueryRehearsalsDto) {
    if (query.rehearsalDate && !isValidDateString(query.rehearsalDate)) {
      throw new BadRequestException('Invalid rehearsalDate filter');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Partial<Pick<Rehearsal, 'productionId' | 'rehearsalDate'>> =
      {};

    if (query.productionId !== undefined) {
      where.productionId = query.productionId;
    }
    if (query.rehearsalDate !== undefined) {
      where.rehearsalDate = query.rehearsalDate;
    }

    const [data, total] = await this.rehearsalsRepo.findAndCount({
      where,
      relations: { production: true },
      order: { rehearsalDate: 'ASC', startTime: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const rehearsal = await this.rehearsalsRepo.findOne({
      where: { id },
      relations: {
        production: true,
        castAssignments: { actor: true },
      },
    });

    if (!rehearsal) {
      throw new NotFoundException(`Rehearsal #${id} not found`);
    }

    return rehearsal;
  }

  async create(dto: CreateRehearsalDto) {
    this.validateDateTime(dto.rehearsalDate, dto.startTime, dto.endTime);

    const production = await this.productionsRepo.findOne({
      where: { id: dto.productionId },
    });
    if (!production) {
      throw new NotFoundException(`Production #${dto.productionId} not found`);
    }

    const location = dto.location?.trim() ?? null;
    await this.checkScheduleConflicts(
      dto.productionId,
      dto.rehearsalDate,
      dto.startTime,
      dto.endTime,
      location,
    );

    const rehearsal = this.rehearsalsRepo.create({
      productionId: dto.productionId,
      title: dto.title.trim(),
      location,
      rehearsalDate: dto.rehearsalDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      notes: dto.notes?.trim() ?? null,
    });

    const saved = await this.rehearsalsRepo.save(rehearsal);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateRehearsalDto) {
    const rehearsal = await this.rehearsalsRepo.findOne({ where: { id } });
    if (!rehearsal) {
      throw new NotFoundException(`Rehearsal #${id} not found`);
    }

    const nextProductionId = dto.productionId ?? rehearsal.productionId;
    if (dto.productionId !== undefined) {
      const production = await this.productionsRepo.findOne({
        where: { id: dto.productionId },
      });
      if (!production) {
        throw new NotFoundException(
          `Production #${dto.productionId} not found`,
        );
      }
    }

    const nextDate = dto.rehearsalDate ?? rehearsal.rehearsalDate;
    const nextStart = dto.startTime ?? rehearsal.startTime;
    const nextEnd = dto.endTime ?? rehearsal.endTime;
    const nextLocation =
      dto.location !== undefined ? dto.location.trim() : rehearsal.location;

    this.validateDateTime(nextDate, nextStart, nextEnd);

    await this.checkScheduleConflicts(
      nextProductionId,
      nextDate,
      nextStart,
      nextEnd,
      nextLocation,
      id,
    );

    await this.checkAssignedActorsConflicts(id, nextDate, nextStart, nextEnd);

    rehearsal.productionId = nextProductionId;
    rehearsal.rehearsalDate = nextDate;
    rehearsal.startTime = nextStart;
    rehearsal.endTime = nextEnd;
    rehearsal.location = nextLocation;

    if (dto.title !== undefined) {
      rehearsal.title = dto.title.trim();
    }
    if (dto.notes !== undefined) {
      rehearsal.notes = dto.notes.trim();
    }

    await this.rehearsalsRepo.save(rehearsal);
    const updated = await this.findOne(id);

    for (const assignment of updated.castAssignments ?? []) {
      if (assignment.actor?.email) {
        await this.mailService.sendRehearsalUpdateNotification({
          to: assignment.actor.email,
          actorName: assignment.actor.fullName,
          rehearsalTitle: updated.title,
          rehearsalDate: updated.rehearsalDate,
          startTime: updated.startTime,
          endTime: updated.endTime,
          location: updated.location,
        });
      }
    }

    return updated;
  }

  async remove(id: number) {
    const rehearsal = await this.rehearsalsRepo.findOne({ where: { id } });
    if (!rehearsal) {
      throw new NotFoundException(`Rehearsal #${id} not found`);
    }

    const assignmentCount = await this.castAssignmentsRepo.count({
      where: { rehearsalId: id },
    });
    if (assignmentCount > 0) {
      throw new ConflictException(
        'Cannot delete rehearsal that still has cast assignments',
      );
    }

    await this.rehearsalsRepo.remove(rehearsal);
  }

  private validateDateTime(
    rehearsalDate: string,
    startTime: string,
    endTime: string,
  ) {
    if (!isValidDateString(rehearsalDate)) {
      throw new BadRequestException('Invalid rehearsalDate provided');
    }
    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be later than startTime');
    }
  }

  private async checkScheduleConflicts(
    productionId: number,
    rehearsalDate: string,
    startTime: string,
    endTime: string,
    location: string | null,
    ignoreRehearsalId?: number,
  ) {
    const sameDay = await this.rehearsalsRepo.find({
      where: { rehearsalDate },
    });

    for (const existing of sameDay) {
      if (ignoreRehearsalId && existing.id === ignoreRehearsalId) {
        continue;
      }

      if (!timesOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
        continue;
      }

      if (existing.productionId === productionId) {
        throw new ConflictException(
          'Scheduling conflict: another rehearsal for this production overlaps this time slot',
        );
      }

      if (
        location &&
        existing.location &&
        existing.location.toLowerCase() === location.toLowerCase()
      ) {
        throw new ConflictException(
          'Scheduling conflict: rehearsal location is already booked for this time slot',
        );
      }
    }
  }

  private async checkAssignedActorsConflicts(
    rehearsalId: number,
    rehearsalDate: string,
    startTime: string,
    endTime: string,
  ) {
    const assignments = await this.castAssignmentsRepo.find({
      where: { rehearsalId },
    });

    for (const assignment of assignments) {
      const otherAssignments = await this.castAssignmentsRepo.find({
        where: { actorId: assignment.actorId },
        relations: { rehearsal: true },
      });

      for (const other of otherAssignments) {
        if (other.rehearsalId === rehearsalId) {
          continue;
        }
        if (
          other.rehearsal.rehearsalDate === rehearsalDate &&
          timesOverlap(
            startTime,
            endTime,
            other.rehearsal.startTime,
            other.rehearsal.endTime,
          )
        ) {
          throw new ConflictException(
            `Scheduling conflict: assigned actor #${assignment.actorId} has another overlapping rehearsal`,
          );
        }
      }

      const unavailableBlocks = await this.availabilitiesRepo.find({
        where: {
          userId: assignment.actorId,
          availableDate: rehearsalDate,
          status: AvailabilityStatus.UNAVAILABLE,
        },
      });

      for (const block of unavailableBlocks) {
        if (timesOverlap(startTime, endTime, block.startTime, block.endTime)) {
          throw new ConflictException(
            `Scheduling conflict: assigned actor #${assignment.actorId} is unavailable during this time slot`,
          );
        }
      }
    }
  }
}
