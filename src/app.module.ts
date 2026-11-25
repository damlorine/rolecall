import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { Availability } from './availabilities/entities/availability.entity.js';
import { CastAssignment } from './cast-assignments/entities/cast-assignment.entity.js';
import { Production } from './productions/entities/production.entity.js';
import { ProductionsModule } from './productions/productions.module.js';
import { Rehearsal } from './rehearsals/entities/rehearsal.entity.js';
import { RehearsalsModule } from './rehearsals/rehearsals.module.js';
import { User } from './users/entities/user.entity.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'rolecall_user'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'rolecall_db'),
        entities: [User, Production, Rehearsal, Availability, CastAssignment],
        synchronize: true,
      }),
    }),
    AuthModule,
    UsersModule,
    ProductionsModule,
    RehearsalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
