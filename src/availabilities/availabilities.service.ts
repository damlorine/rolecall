import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUser } from '../auth/guards/jwt-auth.guard.js';
import { isValidDateString, timesOverlap } from '../common/date-time.util.js';
import { User } from '../users/entities/user.entity.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { QueryAvailabilitiesDto } from './dto/query-availabilities.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';
import {
  Availability,
  AvailabilityStatus,
} from './entities/availability.entity.js';

@Injectable()
export class AvailabilitiesService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilitiesRepo: Repository<Availability>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll(query: QueryAvailabilitiesDto) {
    if (query.availableDate && !isValidDateString(query.availableDate)) {
      throw new BadRequestException('Invalid availableDate filter');
    }

    const where: Partial<
      Pick<Availability, 'userId' | 'availableDate' | 'status'>
    > = {};

    if (query.userId !== undefined) {
      where.userId = query.userId;
    }
    if (query.availableDate !== undefined) {
      where.availableDate = query.availableDate;
    }
    if (query.status !== undefined) {
      where.status = query.status;
    }

    return this.availabilitiesRepo.find({
      where,
      relations: { user: true },
      order: { availableDate: 'ASC', startTime: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const record = await this.availabilitiesRepo.findOne({
      where: { id },
      relations: { user: true },
    });

    if (!record) {
      throw new NotFoundException(`Availability #${id} not found`);
    }

    return record;
  }

  async create(dto: CreateAvailabilityDto, currentUser: JwtUser) {
    this.validateDateTime(dto.availableDate, dto.startTime, dto.endTime);

    const user = await this.usersRepo.findOne({
      where: { id: currentUser.sub },
    });
    if (!user) {
      throw new NotFoundException(`User #${currentUser.sub} not found`);
    }

    await this.checkOverlap(
      currentUser.sub,
      dto.availableDate,
      dto.startTime,
      dto.endTime,
    );

    const availability = this.availabilitiesRepo.create({
      userId: currentUser.sub,
      availableDate: dto.availableDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
      status: dto.status ?? AvailabilityStatus.AVAILABLE,
      note: dto.note?.trim() ?? null,
    });

    const saved = await this.availabilitiesRepo.save(availability);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateAvailabilityDto, currentUser: JwtUser) {
    const record = await this.availabilitiesRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Availability #${id} not found`);
    }

    if (record.userId !== currentUser.sub) {
      throw new ForbiddenException(
        'You can only update your own availability records',
      );
    }

    const nextDate = dto.availableDate ?? record.availableDate;
    const nextStart = dto.startTime ?? record.startTime;
    const nextEnd = dto.endTime ?? record.endTime;

    this.validateDateTime(nextDate, nextStart, nextEnd);
    await this.checkOverlap(record.userId, nextDate, nextStart, nextEnd, id);

    record.availableDate = nextDate;
    record.startTime = nextStart;
    record.endTime = nextEnd;

    if (dto.status !== undefined) {
      record.status = dto.status;
    }
    if (dto.note !== undefined) {
      record.note = dto.note.trim();
    }

    await this.availabilitiesRepo.save(record);
    return this.findOne(id);
  }

  async remove(id: number, currentUser: JwtUser) {
    const record = await this.availabilitiesRepo.findOne({ where: { id } });
    if (!record) {
      throw new NotFoundException(`Availability #${id} not found`);
    }

    if (record.userId !== currentUser.sub) {
      throw new ForbiddenException(
        'You can only delete your own availability records',
      );
    }

    await this.availabilitiesRepo.remove(record);
  }

  private validateDateTime(
    availableDate: string,
    startTime: string,
    endTime: string,
  ) {
    if (!isValidDateString(availableDate)) {
      throw new BadRequestException('Invalid availableDate provided');
    }
    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be later than startTime');
    }
  }

  private async checkOverlap(
    userId: number,
    availableDate: string,
    startTime: string,
    endTime: string,
    ignoreId?: number,
  ) {
    const sameDay = await this.availabilitiesRepo.find({
      where: { userId, availableDate },
    });

    for (const existing of sameDay) {
      if (ignoreId && existing.id === ignoreId) {
        continue;
      }
      if (timesOverlap(startTime, endTime, existing.startTime, existing.endTime)) {
        throw new ConflictException(
          'Duplicate or overlapping availability record for this date and time',
        );
      }
    }
  }
}
