import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import type { JwtUser } from '../auth/guards/jwt-auth.guard.js';
import { Production } from '../productions/entities/production.entity.js';
import { QueryUsersDto } from './dto/query-users.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { User, UserRole } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Production)
    private readonly productionsRepo: Repository<Production>,
  ) {}

  findAll(query: QueryUsersDto) {
    const where = query.role ? { role: query.role } : {};
    return this.usersRepo.find({
      where,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto, currentUser: JwtUser) {
    const isDirector = currentUser.role === UserRole.DIRECTOR;
    const isOwner = currentUser.sub === id;

    if (!isDirector && !isOwner) {
      throw new ForbiddenException('You can only update your own account');
    }

    if (dto.role && !isDirector) {
      throw new ForbiddenException('Only a director can change user roles');
    }

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await this.usersRepo.findOne({
          where: { email: normalizedEmail },
        });
        if (existing) {
          throw new ConflictException('Email already exists');
        }
        user.email = normalizedEmail;
      }
    }

    if (dto.fullName) {
      user.fullName = dto.fullName.trim();
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.role) {
      user.role = dto.role;
    }

    const saved = await this.usersRepo.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      role: saved.role,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async remove(id: number, currentUser: JwtUser) {
    const isDirector = currentUser.role === UserRole.DIRECTOR;
    const isOwner = currentUser.sub === id;

    if (!isDirector && !isOwner) {
      throw new ForbiddenException('You can only delete your own account');
    }

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User #${id} not found`);
    }

    const ownedProductions = await this.productionsRepo.count({
      where: { directorId: id },
    });
    if (ownedProductions > 0) {
      throw new ConflictException(
        'Cannot delete user who still directs existing productions',
      );
    }

    await this.usersRepo.remove(user);
  }
}
