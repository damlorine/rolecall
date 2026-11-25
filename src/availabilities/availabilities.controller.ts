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
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  type AuthenticatedRequest,
  JwtAuthGuard,
} from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UserRole } from '../users/entities/user.entity.js';
import { AvailabilitiesService } from './availabilities.service.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { QueryAvailabilitiesDto } from './dto/query-availabilities.dto.js';
import { UpdateAvailabilityDto } from './dto/update-availability.dto.js';

@Controller('availabilities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AvailabilitiesController {
  constructor(private readonly availabilitiesService: AvailabilitiesService) {}

  @Get()
  findAll(@Query() query: QueryAvailabilitiesDto) {
    return this.availabilitiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.availabilitiesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ACTOR)
  create(
    @Body() dto: CreateAvailabilityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.availabilitiesService.create(dto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ACTOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAvailabilityDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.availabilitiesService.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ACTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.availabilitiesService.remove(id, req.user);
  }
}
