import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../users/entities/user.entity.js';
import { AvailabilitiesController } from './availabilities.controller.js';
import { AvailabilitiesService } from './availabilities.service.js';
import { Availability } from './entities/availability.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Availability, User]), AuthModule],
  controllers: [AvailabilitiesController],
  providers: [AvailabilitiesService],
  exports: [AvailabilitiesService],
})
export class AvailabilitiesModule {}
