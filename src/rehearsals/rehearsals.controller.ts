import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserRole } from '../users/entities/user.entity.js';
import { CreateRehearsalDto } from './dto/create-rehearsal.dto.js';
import { QueryRehearsalsDto } from './dto/query-rehearsals.dto.js';
import { UpdateRehearsalDto } from './dto/update-rehearsal.dto.js';
import { RehearsalsService } from './rehearsals.service.js';

@Controller('rehearsals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RehearsalsController {
  constructor(private readonly rehearsalsService: RehearsalsService) {}

  @Get()
  findAll(@Query() query: QueryRehearsalsDto) {
    return this.rehearsalsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rehearsalsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.DIRECTOR)
  create(@Body() dto: CreateRehearsalDto) {
    return this.rehearsalsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRehearsalDto,
  ) {
    return this.rehearsalsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rehearsalsService.remove(id);
  }
}
