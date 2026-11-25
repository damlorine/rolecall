import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Availability } from '../availabilities/entities/availability.entity.js';
import { Rehearsal } from '../rehearsals/entities/rehearsal.entity.js';
import { User } from '../users/entities/user.entity.js';
import { CastAssignmentsController } from './cast-assignments.controller.js';
import { CastAssignmentsService } from './cast-assignments.service.js';
import { CastAssignment } from './entities/cast-assignment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([CastAssignment, Rehearsal, User, Availability]),
    AuthModule,
  ],
  controllers: [CastAssignmentsController],
  providers: [CastAssignmentsService],
  exports: [CastAssignmentsService],
})
export class CastAssignmentsModule {}
