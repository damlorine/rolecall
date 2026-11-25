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
import { CastAssignmentsService } from './cast-assignments.service.js';
import { CreateCastAssignmentDto } from './dto/create-cast-assignment.dto.js';
import { QueryCastAssignmentsDto } from './dto/query-cast-assignments.dto.js';
import { UpdateCastAssignmentDto } from './dto/update-cast-assignment.dto.js';

@Controller('cast-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CastAssignmentsController {
  constructor(
    private readonly castAssignmentsService: CastAssignmentsService,
  ) {}

  @Get()
  findAll(@Query() query: QueryCastAssignmentsDto) {
    return this.castAssignmentsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.castAssignmentsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.DIRECTOR)
  create(@Body() dto: CreateCastAssignmentDto) {
    return this.castAssignmentsService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCastAssignmentDto,
  ) {
    return this.castAssignmentsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.castAssignmentsService.remove(id);
  }
}
