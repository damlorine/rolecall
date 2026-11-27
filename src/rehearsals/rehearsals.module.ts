import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Availability } from '../availabilities/entities/availability.entity.js';
import { CastAssignment } from '../cast-assignments/entities/cast-assignment.entity.js';
import { MailModule } from '../mail/mail.module.js';
import { Production } from '../productions/entities/production.entity.js';
import { Rehearsal } from './entities/rehearsal.entity.js';
import { RehearsalsController } from './rehearsals.controller.js';
import { RehearsalsService } from './rehearsals.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rehearsal,
      Production,
      CastAssignment,
      Availability,
    ]),
    AuthModule,
    MailModule,
  ],
  controllers: [RehearsalsController],
  providers: [RehearsalsService],
  exports: [RehearsalsService],
})
export class RehearsalsModule {}
