import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtUser } from '../auth/guards/jwt-auth.guard.js';
import { isValidDateString } from '../common/date-time.util.js';
import { Rehearsal } from '../rehearsals/entities/rehearsal.entity.js';
import { User, UserRole } from '../users/entities/user.entity.js';
import { CreateProductionDto } from './dto/create-production.dto.js';
import { QueryProductionsDto } from './dto/query-productions.dto.js';
import { UpdateProductionDto } from './dto/update-production.dto.js';
import { Production } from './entities/production.entity.js';

@Injectable()
export class ProductionsService {
  constructor(
    @InjectRepository(Production)
    private readonly productionsRepo: Repository<Production>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Rehearsal)
    private readonly rehearsalsRepo: Repository<Rehearsal>,
  ) {}

  async findAll(query: QueryProductionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const [data, total] = await this.productionsRepo.findAndCount({
      relations: { director: true },
      order: { startDate: 'ASC', id: 'ASC' },
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
    const production = await this.productionsRepo.findOne({
      where: { id },
      relations: { director: true, rehearsals: true },
    });

    if (!production) {
      throw new NotFoundException(`Production #${id} not found`);
    }

    return production;
  }

  async create(dto: CreateProductionDto, currentUser: JwtUser) {
    this.validateDateRange(dto.startDate, dto.endDate);

    const directorId = dto.directorId ?? currentUser.sub;
    await this.ensureDirectorExists(directorId);

    const production = this.productionsRepo.create({
      directorId,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      venue: dto.venue?.trim() ?? null,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    const saved = await this.productionsRepo.save(production);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateProductionDto) {
    const production = await this.productionsRepo.findOne({ where: { id } });
    if (!production) {
      throw new NotFoundException(`Production #${id} not found`);
    }

    const nextStartDate = dto.startDate ?? production.startDate;
    const nextEndDate = dto.endDate ?? production.endDate;
    this.validateDateRange(nextStartDate, nextEndDate);

    if (dto.directorId !== undefined) {
      await this.ensureDirectorExists(dto.directorId);
      production.directorId = dto.directorId;
    }

    if (dto.title !== undefined) {
      production.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      production.description = dto.description.trim();
    }
    if (dto.venue !== undefined) {
      production.venue = dto.venue.trim();
    }

    production.startDate = nextStartDate;
    production.endDate = nextEndDate;

    await this.productionsRepo.save(production);
    return this.findOne(id);
  }

  async remove(id: number) {
    const production = await this.productionsRepo.findOne({ where: { id } });
    if (!production) {
      throw new NotFoundException(`Production #${id} not found`);
    }

    const rehearsalCount = await this.rehearsalsRepo.count({
      where: { productionId: id },
    });
    if (rehearsalCount > 0) {
      throw new ConflictException(
        'Cannot delete production that still has scheduled rehearsals',
      );
    }

    await this.productionsRepo.remove(production);
  }

  private validateDateRange(startDate: string, endDate: string) {
    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      throw new BadRequestException('Invalid calendar date provided');
    }
    if (endDate < startDate) {
      throw new BadRequestException('endDate cannot be earlier than startDate');
    }
  }

  private async ensureDirectorExists(directorId: number) {
    const director = await this.usersRepo.findOne({
      where: { id: directorId },
    });
    if (!director) {
      throw new NotFoundException(`Director #${directorId} not found`);
    }
    if (director.role !== UserRole.DIRECTOR) {
      throw new BadRequestException(`User #${directorId} is not a director`);
    }
  }
}
