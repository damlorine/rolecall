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
import { CreateProductionDto } from './dto/create-production.dto.js';
import { QueryProductionsDto } from './dto/query-productions.dto.js';
import { UpdateProductionDto } from './dto/update-production.dto.js';
import { ProductionsService } from './productions.service.js';

@Controller('productions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductionsController {
  constructor(private readonly productionsService: ProductionsService) {}

  @Get()
  findAll(@Query() query: QueryProductionsDto) {
    return this.productionsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productionsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.DIRECTOR)
  create(@Body() dto: CreateProductionDto, @Req() req: AuthenticatedRequest) {
    return this.productionsService.create(dto, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.DIRECTOR)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionDto,
  ) {
    return this.productionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productionsService.remove(id);
  }
}
