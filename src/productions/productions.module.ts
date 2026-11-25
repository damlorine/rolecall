import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Rehearsal } from '../rehearsals/entities/rehearsal.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Production } from './entities/production.entity.js';
import { ProductionsController } from './productions.controller.js';
import { ProductionsService } from './productions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Production, User, Rehearsal]), AuthModule],
  controllers: [ProductionsController],
  providers: [ProductionsService],
  exports: [ProductionsService],
})
export class ProductionsModule {}
